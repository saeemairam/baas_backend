import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsService } from './audit-logs.service.js';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let fakeRepository: {
    create: ReturnType<typeof vi.fn>;
    findAllByProject: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    fakeRepository = {
      create: vi.fn(),
      findAllByProject: vi.fn(),
    };
    service = new AuditLogsService(fakeRepository as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log', () => {
    it('saves an entry with a generated id', async () => {
      fakeRepository.create.mockResolvedValue(undefined);

      await service.log({
        projectId: 'project-1',
        userId: 'user-1',
        action: 'record.created',
        entityType: 'record',
        entityId: 'record-1',
        details: { resourceId: 'resource-1' },
      });

      expect(fakeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          projectId: 'project-1',
          userId: 'user-1',
          action: 'record.created',
          entityType: 'record',
          entityId: 'record-1',
          details: { resourceId: 'resource-1' },
        }),
      );
    });

    it('stores null for entityId and details when they are not given', async () => {
      fakeRepository.create.mockResolvedValue(undefined);

      await service.log({
        projectId: 'project-1',
        userId: 'user-1',
        action: 'resource.deleted',
        entityType: 'resource',
      });

      expect(fakeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: null, details: null }),
      );
    });

    it('does not throw when saving fails, and logs a warning instead', async () => {
      const warnSpy = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      fakeRepository.create.mockRejectedValue(new Error('database down'));

      await expect(
        service.log({
          projectId: 'project-1',
          userId: 'user-1',
          action: 'record.created',
          entityType: 'record',
        }),
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns the audit logs of the given project', async () => {
      const logs = [{ id: 'log-1', projectId: 'project-1' }];
      fakeRepository.findAllByProject.mockResolvedValue(logs);

      const result = await service.findAll('project-1');

      expect(fakeRepository.findAllByProject).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(logs);
    });
  });
});
