import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { AuditLog } from './entities/audit-log.entity.js';

const SELECT_COLUMNS = `
  id,
  project_id AS projectId,
  user_id AS userId,
  action,
  entity_type AS entityType,
  entity_id AS entityId,
  details,
  created_at AS createdAt
`;

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(log: {
    id: string;
    projectId: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    details: Record<string, unknown> | null;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO audit_logs (id, project_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        log.id,
        log.projectId,
        log.userId,
        log.action,
        log.entityType,
        log.entityId,
        log.details ? JSON.stringify(log.details) : null,
      ],
    );
  }

  async findAllByProject(projectId: string): Promise<AuditLog[]> {
    return this.db.query<AuditLog[]>(
      `SELECT ${SELECT_COLUMNS} FROM audit_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT 100`,
      [projectId],
    );
  }
}
