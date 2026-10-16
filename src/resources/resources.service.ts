import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ResourcesRepository } from './resources.repository.js';
import type { Resource } from './entities/resource.entity.js';

@Injectable()
export class ResourcesService {
  constructor(private readonly resourcesRepository: ResourcesRepository) {}

  async create(
    projectId: string,
    name: string,
  ): Promise<{ id: string; projectId: string; name: string }> {
    const id = randomUUID();

    try {
      await this.resourcesRepository.create({ id, projectId, name });
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'A resource with this name already exists in the project',
        );
      }
      throw error;
    }

    return { id, projectId, name };
  }

  findAll(projectId: string): Promise<Resource[]> {
    return this.resourcesRepository.findAllByProject(projectId);
  }

  async delete(projectId: string, id: string): Promise<void> {
    const deleted = await this.resourcesRepository.delete(projectId, id);
    if (!deleted) {
      throw new NotFoundException('Resource not found');
    }
  }
}
