import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourcesService } from './resources.service.js';
import type { ResourcesRepository } from './resources.repository.js';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    findAllByProject: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findAllByProject: vi.fn(),
      delete: vi.fn(),
    };
    service = new ResourcesService(
      repository as unknown as ResourcesRepository,
    );
  });

  describe('create', () => {
    it('creates a resource and returns its id, project and name', async () => {
      repository.create.mockResolvedValue(undefined);

      const result = await service.create('project-1', 'products');

      expect(result.name).toBe('products');
      expect(result.projectId).toBe('project-1');
      expect(repository.create).toHaveBeenCalledWith({
        id: result.id,
        projectId: 'project-1',
        name: 'products',
      });
    });

    it('throws ConflictException when the name already exists', async () => {
      repository.create.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.create('project-1', 'products')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rethrows other database errors', async () => {
      const error = new Error('connection lost');
      repository.create.mockRejectedValue(error);

      await expect(service.create('project-1', 'products')).rejects.toBe(error);
    });
  });

  describe('findAll', () => {
    it('returns the resources of the given project', async () => {
      const resources = [
        { id: 'r-1', projectId: 'project-1', name: 'products' },
      ];
      repository.findAllByProject.mockResolvedValue(resources);

      const result = await service.findAll('project-1');

      expect(repository.findAllByProject).toHaveBeenCalledWith('project-1');
      expect(result).toBe(resources);
    });
  });

  describe('delete', () => {
    it('deletes the resource using the project id and resource id', async () => {
      repository.delete.mockResolvedValue(true);

      await service.delete('project-1', 'r-1');

      expect(repository.delete).toHaveBeenCalledWith('project-1', 'r-1');
    });

    it('throws NotFoundException when no resource was deleted', async () => {
      repository.delete.mockResolvedValue(false);

      await expect(service.delete('project-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
