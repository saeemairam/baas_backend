import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { Role } from './entities/role.entity.js';

const SELECT_COLUMNS = `
  id,
  name,
  project_id AS projectId,
  description,
  created_at AS createdAt
`;

@Injectable()
export class RolesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(projectId: string, id: string): Promise<Role | null> {
    const rows = await this.db.query<Role[]>(
      `SELECT ${SELECT_COLUMNS} FROM roles WHERE project_id = ? AND id = ? LIMIT 1`,
      [projectId, id],
    );
    return rows[0] ?? null;
  }

  async findByName(projectId: string, name: string): Promise<Role | null> {
    const rows = await this.db.query<Role[]>(
      `SELECT ${SELECT_COLUMNS} FROM roles WHERE project_id = ? AND name = ? LIMIT 1`,
      [projectId, name],
    );
    return rows[0] ?? null;
  }

  async findAllByProject(projectId: string): Promise<Role[]> {
    return this.db.query<Role[]>(
      `SELECT ${SELECT_COLUMNS} FROM roles WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId],
    );
  }

  async create(role: {
    id: string;
    projectId: string;
    name: string;
    description?: string;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO roles (id, project_id, name, description) VALUES (?, ?, ?, ?)',
      [role.id, role.projectId, role.name, role.description ?? null],
    );
  }
}
