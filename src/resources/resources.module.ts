import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { ResourcesController } from './resources.controller.js';
import { ResourcesRepository } from './resources.repository.js';
import { ResourcesService } from './resources.service.js';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), RolesModule],
  controllers: [ResourcesController],
  providers: [ResourcesService, ResourcesRepository],
  exports: [ResourcesService],
})
export class ResourcesModule {}
