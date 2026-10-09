import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { ApiKey } from './entities/api-key.entity.js';

const SELECT_COLUMNS = `
  id,
  project_id AS projectId,
  name,
  key_prefix AS keyPrefix,
  created_at AS createdAt,
  revoked_at AS revokedAt
`;

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(apiKey: {
    id: string;
    projectId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO api_keys (id, project_id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?, ?)',
      [
        apiKey.id,
        apiKey.projectId,
        apiKey.name,
        apiKey.keyHash,
        apiKey.keyPrefix,
      ],
    );
  }

  async findAllByProject(projectId: string): Promise<ApiKey[]> {
    return this.db.query<ApiKey[]>(
      `SELECT ${SELECT_COLUMNS} FROM api_keys WHERE project_id = ? ORDER BY created_at DESC`,
      [projectId],
    );
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const rows = await this.db.query<ApiKey[]>(
      `SELECT ${SELECT_COLUMNS} FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL LIMIT 1`,
      [keyHash],
    );
    return rows[0] ?? null;
  }

  async revoke(projectId: string, id: string): Promise<void> {
    await this.db.query(
      'UPDATE api_keys SET revoked_at = CURRENT_TIMESTAMP WHERE project_id = ? AND id = ? AND revoked_at IS NULL',
      [projectId, id],
    );
  }
}
