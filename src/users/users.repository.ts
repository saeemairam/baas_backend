import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { User } from './entities/user.entity.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByPhone(phone: string): Promise<User | null> {
    const rows = await this.db.query<User[]>(
      'SELECT * FROM users WHERE phone = ? LIMIT 1',
      [phone],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.query<User[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ?? null;
  }

  async create(user: {
    id: string;
    phone: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO users (id, phone, password_hash, first_name, last_name)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.phone, user.passwordHash, user.firstName, user.lastName],
    );
  }
}
