import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'mysql2/promise';
import { createPool } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.pool = createPool({
      host: this.configService.get<string>('DATABASE_HOST'),
      port: Number(this.configService.get('DATABASE_PORT')),
      database: this.configService.get<string>('DATABASE_NAME'),
      user: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      waitForConnections: true,
      connectionLimit: 10,
    });

    await this.pool.query('SELECT 1');
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async query<T = any>(sql: string, params: unknown[] = []): Promise<T> {
    const [rows] = await this.pool.execute(sql, params as any[]);
    return rows as T;
  }
}
