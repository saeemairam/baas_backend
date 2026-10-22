import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordsRepository } from './records.repository.js';
import { RecordsService } from './records.service.js';

describe('RecordsService', () => {
  let service: RecordsService;
  let repository: {
    resourceExists: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      resourceExists: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new RecordsService(repository as unknown as RecordsRepository);
  });

  describe('create', () => {
    it('creates a record when the resource exists', async () => {
      repository.resourceExists.mockResolvedValue(true);
      const data = { title: 'Phone', price: 499 };

      const result = await service.create('project-1', 'resource-1', data);

      expect(result.resourceId).toBe('resource-1');
      expect(result.data).toBe(data);
      expect(repository.create).toHaveBeenCalledWith({
        id: result.id,
        resourceId: 'resource-1',
        data,
      });
    });

    it('throws NotFoundException when the resource does not exist', async () => {
      repository.resourceExists.mockResolvedValue(false);

      await expect(
        service.create('project-1', 'missing', { title: 'Phone' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns the records of the resource', async () => {
      repository.resourceExists.mockResolvedValue(true);
      const records = [{ id: 'rec-1', resourceId: 'resource-1' }];
      repository.findAll.mockResolvedValue(records);

      const result = await service.findAll('project-1', 'resource-1');

      expect(repository.findAll).toHaveBeenCalledWith(
        'project-1',
        'resource-1',
      );
      expect(result).toBe(records);
    });

    it('throws NotFoundException when the resource does not exist', async () => {
      repository.resourceExists.mockResolvedValue(false);

      await expect(service.findAll('project-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns the record when found', async () => {
      const record = { id: 'rec-1', resourceId: 'resource-1' };
      repository.findOne.mockResolvedValue(record);

      const result = await service.findOne('project-1', 'resource-1', 'rec-1');

      expect(result).toBe(record);
    });

    it('throws NotFoundException when the record is missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('project-1', 'resource-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the record data', async () => {
      repository.update.mockResolvedValue(true);
      const data = { price: 459 };

      await service.update('project-1', 'resource-1', 'rec-1', data);

      expect(repository.update).toHaveBeenCalledWith(
        'project-1',
        'resource-1',
        'rec-1',
        data,
      );
    });

    it('throws NotFoundException when no record was updated', async () => {
      repository.update.mockResolvedValue(false);

      await expect(
        service.update('project-1', 'resource-1', 'missing', { price: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes the record', async () => {
      repository.delete.mockResolvedValue(true);

      await service.delete('project-1', 'resource-1', 'rec-1');

      expect(repository.delete).toHaveBeenCalledWith(
        'project-1',
        'resource-1',
        'rec-1',
      );
    });

    it('throws NotFoundException when no record was deleted', async () => {
      repository.delete.mockResolvedValue(false);

      await expect(
        service.delete('project-1', 'resource-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
