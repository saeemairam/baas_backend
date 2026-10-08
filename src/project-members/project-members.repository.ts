import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { ProjectMember } from './entities/project-member.entity.js';

const SELECT_COLUMNS = `
  id,
  project_id AS projectId,
  user_id AS userId,
  role,
  role_id AS roleId,
  created_at AS createdAt
`;

@Injectable()
export class ProjectMembersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember | null> {
    const rows = await this.db.query<ProjectMember[]>(
      `SELECT ${SELECT_COLUMNS} FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1`,
      [projectId, userId],
    );
    return rows[0] ?? null;
  }

  async findAllByProject(projectId: string): Promise<ProjectMember[]> {
    return this.db.query<ProjectMember[]>(
      `SELECT ${SELECT_COLUMNS} FROM project_members WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId],
    );
  }

  async create(member: {
    id: string;
    projectId: string;
    userId: string;
    role: string;
    roleId?: string;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO project_members (id, project_id, user_id, role, role_id) VALUES (?, ?, ?, ?, ?)',
      [
        member.id,
        member.projectId,
        member.userId,
        member.role,
        member.roleId ?? null,
      ],
    );
  }

  async updateRole(
    projectId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    await this.db.query(
      'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, projectId, userId],
    );
  }

  async delete(projectId: string, userId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId],
    );
  }
}
