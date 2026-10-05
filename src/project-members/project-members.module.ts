import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { ProjectMembersController } from './project-members.controller.js';
import { ProjectMembersRepository } from './project-members.repository.js';
import { ProjectMembersService } from './project-members.service.js';

@Module({
  imports: [DatabaseModule, ProjectsModule, JwtModule.register({})],
  controllers: [ProjectMembersController],
  providers: [ProjectMembersService, ProjectMembersRepository],
})
export class ProjectMembersModule {}
