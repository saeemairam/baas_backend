import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditLogsRepository } from './audit-logs.repository.js';
import type { AuditLog } from './entities/audit-log.entity.js';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async log(entry: {
    projectId: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      await this.auditLogsRepository.create({
        id: randomUUID(),
        projectId: entry.projectId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details: entry.details ?? null,
      });
    } catch (error) {
      this.logger.warn(`Failed to write audit log: ${String(error)}`);
    }
  }

  findAll(projectId: string): Promise<AuditLog[]> {
    return this.auditLogsRepository.findAllByProject(projectId);
  }
}
