import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiKeysService } from './api-keys.service.js';
import type { ApiKeysRepository } from './api-keys.repository.js';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    findAllByProject: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findAllByProject: vi.fn(),
      revoke: vi.fn(),
    };
    service = new ApiKeysService(repository as unknown as ApiKeysRepository);
  });

  describe('create', () => {
    it('returns a key in the format pk_ + 48 hex characters', async () => {
      const result = await service.create('project-1', 'Mobile app key');

      expect(result.key).toMatch(/^pk_[0-9a-f]{48}$/);
      expect(result.keyPrefix).toBe(result.key.slice(0, 11));
      expect(result.name).toBe('Mobile app key');
    });

    it('stores only the SHA-256 hash, never the raw key', async () => {
      const result = await service.create('project-1', 'Mobile app key');

      const expectedHash = createHash('sha256')
        .update(result.key)
        .digest('hex');
      expect(repository.create).toHaveBeenCalledWith({
        id: result.id,
        projectId: 'project-1',
        name: 'Mobile app key',
        keyHash: expectedHash,
        keyPrefix: result.keyPrefix,
      });
    });
  });

  describe('findAll', () => {
    it('returns the keys of the given project', async () => {
      const keys = [{ id: 'key-1', projectId: 'project-1', name: 'test' }];
      repository.findAllByProject.mockResolvedValue(keys);

      const result = await service.findAll('project-1');

      expect(repository.findAllByProject).toHaveBeenCalledWith('project-1');
      expect(result).toBe(keys);
    });
  });

  describe('revoke', () => {
    it('revokes the key using the project id and key id', async () => {
      repository.revoke.mockResolvedValue(undefined);

      await service.revoke('project-1', 'key-1');

      expect(repository.revoke).toHaveBeenCalledWith('project-1', 'key-1');
    });
  });
});
