import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

const DATABASE_NAME_PATTERN = /^proj_[0-9a-f]{32}$/;

@Injectable()
export class ProjectDatabasesService {
  constructor(private readonly databaseService: DatabaseService) {}

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

    return name;
  }
}
