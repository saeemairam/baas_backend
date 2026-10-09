import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { ProjectMember } from './entities/project-member.entity.js';

const SELECT_COLUMNS = `
  pm.id,
  pm.project_id AS projectId,
  pm.user_id AS userId,
  r.name AS role,
  pm.role_id AS roleId,
  pm.created_at AS createdAt
`;

const FROM_CLAUSE = `
  FROM project_members pm
  LEFT JOIN roles r ON r.id = pm.role_id
`;

@Injectable()
export class ProjectMembersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember | null> {
    const rows = await this.db.query<ProjectMember[]>(
      `SELECT ${SELECT_COLUMNS} ${FROM_CLAUSE} WHERE pm.project_id = ? AND pm.user_id = ? LIMIT 1`,
      [projectId, userId],
    );
    return rows[0] ?? null;
  }

  async findAllByProject(projectId: string): Promise<ProjectMember[]> {
    return this.db.query<ProjectMember[]>(
      `SELECT ${SELECT_COLUMNS} ${FROM_CLAUSE} WHERE pm.project_id = ? ORDER BY pm.created_at ASC`,
      [projectId],
    );
  }

  async create(member: {
    id: string;
    projectId: string;
    userId: string;
    roleId: string;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO project_members (id, project_id, user_id, role_id) VALUES (?, ?, ?, ?)',
      [member.id, member.projectId, member.userId, member.roleId],
    );
  }

  async delete(projectId: string, userId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId],
    );
  }
}
