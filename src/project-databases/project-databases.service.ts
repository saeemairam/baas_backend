import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'mysql2/promise';
import { createPool } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service.js';

const DATABASE_NAME_PATTERN = /^proj_[0-9a-f]{32}$/;
const PROJECT_POOL_SIZE = 3;

@Injectable()
export class ProjectDatabasesService implements OnModuleDestroy {
  private readonly pools = new Map<string, Pool>();
  // projectId -> database name, or null for old projects that stay on baas_db
  private readonly databaseNames = new Map<string, string | null>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  /** Builds the database name for a project id: proj_ + id without dashes. */
  buildDatabaseName(projectId: string): string {
    const name = `proj_${projectId.replace(/-/g, '').toLowerCase()}`;
    this.assertValidDatabaseName(name);
    return name;
  }

  /** Throws unless the name is proj_ followed by exactly 32 hex characters. */
  assertValidDatabaseName(name: string): void {
    if (!DATABASE_NAME_PATTERN.test(name)) {
      throw new Error('Invalid project database name');
    }
  }

  /**
   * Creates the project's own database with its resources and records tables,
   * then saves the name in projects.database_name. Safe to run twice.
   */
  async provision(projectId: string): Promise<string> {
    const name = this.buildDatabaseName(projectId);
    const db = '`' + name + '`'; // safe: validated against the strict pattern

    await this.databaseService.query(
      `CREATE DATABASE IF NOT EXISTS ${db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );

    await this.databaseService.query(
      `CREATE TABLE IF NOT EXISTS ${db}.resources (
        id CHAR(36) NOT NULL PRIMARY KEY,
        project_id CHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_resources_project_name UNIQUE (project_id, name)
      )`,
    );

    await this.databaseService.query(
      `CREATE TABLE IF NOT EXISTS ${db}.records (
        id CHAR(36) NOT NULL PRIMARY KEY,
        resource_id CHAR(36) NOT NULL,
        data JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_records_resource FOREIGN KEY (resource_id)
          REFERENCES ${db}.resources (id) ON DELETE CASCADE
      )`,
    );

    await this.databaseService.query(
      'UPDATE projects SET database_name = ? WHERE id = ?',
      [name, projectId],
    );

    this.databaseNames.set(projectId, name);
    return name;
  }

  /**
   * Runs a query on the right database for this project.
   * Old projects (empty database_name) use baas_db through DatabaseService.
   */
  async query<T = any>(
    projectId: string,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    const name = await this.getDatabaseName(projectId);

    if (name === null) {
      return this.databaseService.query<T>(sql, params);
    }

    const [rows] = await this.getPool(name).execute(sql, params as any[]);
    return rows as T;
  }

  /**
   * Drops the project's own database. Old projects (null name) are skipped.
   * Call this before the project row is deleted.
   */
  async drop(projectId: string): Promise<void> {
    const name = await this.getDatabaseName(projectId);
    if (name === null) {
      return;
    }

    this.assertValidDatabaseName(name);

    const pool = this.pools.get(name);
    if (pool) {
      await pool.end();
      this.pools.delete(name);
    }

    await this.databaseService.query('DROP DATABASE IF EXISTS `' + name + '`');

    this.databaseNames.delete(projectId);
  }

  /** Finds the project's database name (null = shared baas_db), cached in memory. */
  private async getDatabaseName(projectId: string): Promise<string | null> {
    if (this.databaseNames.has(projectId)) {
      return this.databaseNames.get(projectId) ?? null;
    }

    const rows = await this.databaseService.query<
      { database_name: string | null }[]
    >('SELECT database_name FROM projects WHERE id = ?', [projectId]);

    if (rows.length === 0) {
      throw new NotFoundException('Project not found');
    }

    const name = rows[0].database_name ?? null;
    this.databaseNames.set(projectId, name);
    return name;
  }

  /** Returns the pool for a project database, creating it the first time. */
  private getPool(name: string): Pool {
    this.assertValidDatabaseName(name);

    let pool = this.pools.get(name);
    if (!pool) {
      pool = createPool({
        host: this.configService.get<string>('DATABASE_HOST'),
        port: Number(this.configService.get('DATABASE_PORT')),
        database: name,
        user: this.configService.get<string>('DATABASE_USER'),
        password: this.configService.get<string>('DATABASE_PASSWORD'),
        waitForConnections: true,
        connectionLimit: PROJECT_POOL_SIZE,
      });
      this.pools.set(name, pool);
    }
    return pool;
  }

  /** Closes every project pool when the app stops. */
  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.pools.values()].map((pool) => pool.end()));
    this.pools.clear();
  }
}
