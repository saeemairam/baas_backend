import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { Resource } from './entities/resource.entity.js';

const SELECT_COLUMNS = `
  id,
  project_id AS projectId,
  name,
  created_at AS createdAt
`;

@Injectable()
export class ResourcesRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(resource: {
    id: string;
    projectId: string;
    name: string;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO resources (id, project_id, name) VALUES (?, ?, ?)',
      [resource.id, resource.projectId, resource.name],
    );
  }

  async findAllByProject(projectId: string): Promise<Resource[]> {
    return this.db.query<Resource[]>(
      `SELECT ${SELECT_COLUMNS} FROM resources WHERE project_id = ? ORDER BY created_at DESC`,
      [projectId],
    );
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    const result = await this.db.query<{ affectedRows: number }>(
      'DELETE FROM resources WHERE project_id = ? AND id = ?',
      [projectId, id],
    );
    return result.affectedRows > 0;
  }
}
