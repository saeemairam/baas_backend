import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { RolesRepository } from './roles.repository.js';
import { RolesService } from './roles.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [RolesRepository, RolesService],
  exports: [RolesService],
})
export class RolesModule {}
