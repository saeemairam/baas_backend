import { Module } from '@nestjs/common';
import { HealthRepository } from './health.repository.js';
import { HealthService } from './health.service.js';

@Module({
  providers: [HealthService, HealthRepository],
})
export class HealthModule {}
