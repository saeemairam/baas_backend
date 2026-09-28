import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class HealthRepository {
  constructor(private readonly db: DatabaseService) {}

  async ping(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
