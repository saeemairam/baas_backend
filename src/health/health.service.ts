import { Injectable } from '@nestjs/common';
import { HealthRepository } from './health.repository.js';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check() {
    const isDatabaseUp = await this.healthRepository.ping();

    return {
      status: isDatabaseUp ? 'ok' : 'error',
      database: isDatabaseUp ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
