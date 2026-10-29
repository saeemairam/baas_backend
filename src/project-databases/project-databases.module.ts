import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ProjectDatabasesService } from './project-databases.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [ProjectDatabasesService],
  exports: [ProjectDatabasesService],
})
export class ProjectDatabasesModule {}
