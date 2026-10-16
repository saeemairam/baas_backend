import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RecordsRepository } from './records.repository.js';
import type { ResourceRecord } from './entities/record.entity.js';

@Injectable()
export class RecordsService {
  constructor(private readonly recordsRepository: RecordsRepository) {}

  async create(
    projectId: string,
    resourceId: string,
    data: Record<string, unknown>,
  ): Promise<{
    id: string;
    resourceId: string;
    data: Record<string, unknown>;
  }> {
    await this.ensureResourceExists(projectId, resourceId);

    const id = randomUUID();
    await this.recordsRepository.create({ id, resourceId, data });

    return { id, resourceId, data };
  }

  async findAll(
    projectId: string,
    resourceId: string,
  ): Promise<ResourceRecord[]> {
    await this.ensureResourceExists(projectId, resourceId);
    return this.recordsRepository.findAll(projectId, resourceId);
  }

  async findOne(
    projectId: string,
    resourceId: string,
    id: string,
  ): Promise<ResourceRecord> {
    const record = await this.recordsRepository.findOne(
      projectId,
      resourceId,
      id,
    );
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    return record;
  }

  async update(
    projectId: string,
    resourceId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const updated = await this.recordsRepository.update(
      projectId,
      resourceId,
      id,
      data,
    );
    if (!updated) {
      throw new NotFoundException('Record not found');
    }
  }

  async delete(
    projectId: string,
    resourceId: string,
    id: string,
  ): Promise<void> {
    const deleted = await this.recordsRepository.delete(
      projectId,
      resourceId,
      id,
    );
    if (!deleted) {
      throw new NotFoundException('Record not found');
    }
  }

  private async ensureResourceExists(
    projectId: string,
    resourceId: string,
  ): Promise<void> {
    const exists = await this.recordsRepository.resourceExists(
      projectId,
      resourceId,
    );
    if (!exists) {
      throw new NotFoundException('Resource not found');
    }
  }
}
