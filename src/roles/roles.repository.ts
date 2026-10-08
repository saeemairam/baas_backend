import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { Permission } from './entities/permission.entity.js';
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

  async findPermissionsByNames(names: string[]): Promise<Permission[]> {
    if (names.length === 0) return [];
    const placeholders = names.map(() => '?').join(', ');
    return this.db.query<Permission[]>(
      `SELECT id, name, resource, action FROM permissions WHERE name IN (${placeholders})`,
      names,
    );
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    if (permissionIds.length === 0) return;
    const placeholders = permissionIds.map(() => '(?, ?)').join(', ');
    const values = permissionIds.flatMap((permissionId) => [
      roleId,
      permissionId,
    ]);
    await this.db.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
      values,
    );
  }

  async findPermissionNamesForUser(
    projectId: string,
    userId: string,
  ): Promise<string[]> {
    const rows = await this.db.query<{ name: string }[]>(
      `SELECT p.name AS name
       FROM project_members pm
       JOIN roles r ON r.id = pm.role_id AND r.project_id = pm.project_id
       JOIN role_permissions rp ON rp.role_id = r.id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE pm.project_id = ? AND pm.user_id = ?`,
      [projectId, userId],
    );
    return rows.map((row) => row.name);
  }
}
