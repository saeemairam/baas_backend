import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { ProjectDatabasesModule } from '../project-databases/project-databases.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { RecordsController } from './records.controller.js';
import { RecordsRepository } from './records.repository.js';
import { RecordsService } from './records.service.js';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({}),
    RolesModule,
    AuditLogsModule,
    ApiKeysModule,
    ProjectDatabasesModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService, RecordsRepository],
  exports: [RecordsService],
})
export class RecordsModule {}
