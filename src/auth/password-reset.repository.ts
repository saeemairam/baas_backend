import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface ActiveResetCode {
  id: string;
  codeHash: string;
  attempts: number;
}

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly db: DatabaseService) {}

  async invalidateActive(userId: string): Promise<void> {
    await this.db.query(
      'UPDATE password_reset_codes SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [userId],
    );
  }

  async create(code: {
    id: string;
    userId: string;
    codeHash: string;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO password_reset_codes (id, user_id, code_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [code.id, code.userId, code.codeHash],
    );
  }

  async findActive(
    userId: string,
    maxAttempts: number,
  ): Promise<ActiveResetCode | null> {
    const rows = await this.db.query<ActiveResetCode[]>(
      `SELECT id, code_hash AS codeHash, attempts
       FROM password_reset_codes
       WHERE user_id = ? AND used_at IS NULL AND expires_at > NOW() AND attempts < ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, maxAttempts],
    );
    return rows[0] ?? null;
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.db.query(
      'UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?',
      [id],
    );
  }

  async markUsed(id: string): Promise<void> {
    await this.db.query(
      'UPDATE password_reset_codes SET used_at = NOW() WHERE id = ?',
      [id],
    );
  }
}
