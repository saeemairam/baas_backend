import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { AuditLogsController } from './audit-logs.controller.js';
import { AuditLogsRepository } from './audit-logs.repository.js';
import { AuditLogsService } from './audit-logs.service.js';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), RolesModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
