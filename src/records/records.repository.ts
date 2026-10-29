import { Injectable } from '@nestjs/common';
import { ProjectDatabasesService } from '../project-databases/project-databases.service.js';
import type { ResourceRecord } from './entities/record.entity.js';

const SELECT_COLUMNS = `
  rec.id,
  rec.resource_id AS resourceId,
  rec.data,
  rec.created_at AS createdAt,
  rec.updated_at AS updatedAt
`;

@Injectable()
export class RecordsRepository {
  constructor(private readonly projectDb: ProjectDatabasesService) {}

  async resourceExists(
    projectId: string,
    resourceId: string,
  ): Promise<boolean> {
    const rows = await this.projectDb.query<{ id: string }[]>(
      projectId,
      'SELECT id FROM resources WHERE id = ? AND project_id = ? LIMIT 1',
      [resourceId, projectId],
    );
    return rows.length > 0;
  }

  async create(
    projectId: string,
    record: {
      id: string;
      resourceId: string;
      data: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.projectDb.query(
      projectId,
      'INSERT INTO records (id, resource_id, data) VALUES (?, ?, ?)',
      [record.id, record.resourceId, JSON.stringify(record.data)],
    );
  }

  async findAll(
    projectId: string,
    resourceId: string,
  ): Promise<ResourceRecord[]> {
    return this.projectDb.query<ResourceRecord[]>(
      projectId,
      `SELECT ${SELECT_COLUMNS}
       FROM records rec
       JOIN resources res ON res.id = rec.resource_id
       WHERE res.project_id = ? AND rec.resource_id = ?
       ORDER BY rec.created_at DESC`,
      [projectId, resourceId],
    );
  }

  async findOne(
    projectId: string,
    resourceId: string,
    id: string,
  ): Promise<ResourceRecord | null> {
    const rows = await this.projectDb.query<ResourceRecord[]>(
      projectId,
      `SELECT ${SELECT_COLUMNS}
       FROM records rec
       JOIN resources res ON res.id = rec.resource_id
       WHERE res.project_id = ? AND rec.resource_id = ? AND rec.id = ?
       LIMIT 1`,
      [projectId, resourceId, id],
    );
    return rows[0] ?? null;
  }

  async update(
    projectId: string,
    resourceId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.projectDb.query<{ affectedRows: number }>(
      projectId,
      `UPDATE records rec
       JOIN resources res ON res.id = rec.resource_id
       SET rec.data = ?
       WHERE res.project_id = ? AND rec.resource_id = ? AND rec.id = ?`,
      [JSON.stringify(data), projectId, resourceId, id],
    );
    return result.affectedRows > 0;
  }

  async delete(
    projectId: string,
    resourceId: string,
    id: string,
  ): Promise<boolean> {
    const result = await this.projectDb.query<{ affectedRows: number }>(
      projectId,
      `DELETE rec FROM records rec
       JOIN resources res ON res.id = rec.resource_id
       WHERE res.project_id = ? AND rec.resource_id = ? AND rec.id = ?`,
      [projectId, resourceId, id],
    );
    return result.affectedRows > 0;
  }
}
