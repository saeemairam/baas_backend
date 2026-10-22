import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { ProjectMembersModule } from './project-members/project-members.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { RecordsModule } from './records/records.module.js';
import { ResourcesModule } from './resources/resources.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Default limit: 100 requests per 60 seconds (60000 ms) per client
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    ProjectMembersModule,
    ApiKeysModule,
    ResourcesModule,
    RecordsModule,
    AuditLogsModule,
  ],
  controllers: [],
  providers: [
    // Applies the rate limit to every route in the app
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
