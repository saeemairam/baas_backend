import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ApiKeysRepository } from './api-keys.repository.js';
import type { ApiKey } from './entities/api-key.entity.js';

@Injectable()
export class ApiKeysService {
  constructor(private readonly apiKeysRepository: ApiKeysRepository) {}

  async create(
    projectId: string,
    name: string,
  ): Promise<{ id: string; name: string; keyPrefix: string; key: string }> {
    const key = `pk_${randomBytes(24).toString('hex')}`;
    const id = randomUUID();
    const keyPrefix = key.slice(0, 11);

    await this.apiKeysRepository.create({
      id,
      projectId,
      name,
      keyHash: this.hash(key),
      keyPrefix,
    });

    return { id, name, keyPrefix, key };
  }

  findAll(projectId: string): Promise<ApiKey[]> {
    return this.apiKeysRepository.findAllByProject(projectId);
  }

  // Checks a key sent by an external app: it must exist, not be revoked,
  // and belong to the project in the URL (tenant isolation).
  async authenticate(key: string, projectId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findByHash(this.hash(key));
    if (!apiKey || apiKey.projectId !== projectId) {
      throw new UnauthorizedException('Invalid API key');
    }
    await this.apiKeysRepository.touchLastUsed(apiKey.id);
    return apiKey;
  }

  async revoke(projectId: string, id: string): Promise<void> {
    const revoked = await this.apiKeysRepository.revoke(projectId, id);
    if (!revoked) {
      throw new NotFoundException('API key not found');
    }
  }

  private hash(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
