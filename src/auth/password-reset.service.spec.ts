import { BadRequestException, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsersService } from '../users/users.service.js';
import type { PasswordResetRepository } from './password-reset.repository.js';
import { PasswordResetService } from './password-reset.service.js';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let repository: {
    invalidateActive: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findActive: ReturnType<typeof vi.fn>;
    incrementAttempts: ReturnType<typeof vi.fn>;
    markUsed: ReturnType<typeof vi.fn>;
  };
  let usersService: {
    findByPhone: ReturnType<typeof vi.fn>;
    setPassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      invalidateActive: vi.fn(),
      create: vi.fn(),
      findActive: vi.fn(),
      incrementAttempts: vi.fn(),
      markUsed: vi.fn(),
    };
    usersService = {
      findByPhone: vi.fn(),
      setPassword: vi.fn(),
    };
    service = new PasswordResetService(
      repository as unknown as PasswordResetRepository,
      usersService as unknown as UsersService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestReset', () => {
    it('does nothing for an unknown phone', async () => {
      usersService.findByPhone.mockResolvedValue(null);

      await service.requestReset('9000000000');

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.invalidateActive).not.toHaveBeenCalled();
    });

    it('stores only the hash of the 6-digit code it generates', async () => {
      usersService.findByPhone.mockResolvedValue({ id: 'user-1' });
      const logSpy = vi
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      await service.requestReset('9876543210');

      const message = String(logSpy.mock.calls[0]?.[0]);
      const code = message.match(/: (\d{6})$/)?.[1];

      expect(code).toBeDefined();
      expect(repository.invalidateActive).toHaveBeenCalledWith('user-1');
      expect(repository.create).toHaveBeenCalledWith({
        id: expect.any(String),
        userId: 'user-1',
        codeHash: sha256(code as string),
      });
    });
  });

  describe('resetPassword', () => {
    it('throws for an unknown phone', async () => {
      usersService.findByPhone.mockResolvedValue(null);

      await expect(
        service.resetPassword('9000000000', '123456', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.setPassword).not.toHaveBeenCalled();
    });

    it('throws when there is no active code', async () => {
      usersService.findByPhone.mockResolvedValue({ id: 'user-1' });
      repository.findActive.mockResolvedValue(null);

      await expect(
        service.resetPassword('9876543210', '123456', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
      expect(repository.findActive).toHaveBeenCalledWith('user-1', 3);
      expect(usersService.setPassword).not.toHaveBeenCalled();
    });

    it('counts a wrong code as an attempt and does not change the password', async () => {
      usersService.findByPhone.mockResolvedValue({ id: 'user-1' });
      repository.findActive.mockResolvedValue({
        id: 'code-1',
        codeHash: sha256('123456'),
        attempts: 0,
      });

      await expect(
        service.resetPassword('9876543210', '999999', 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);

      expect(repository.incrementAttempts).toHaveBeenCalledWith('code-1');
      expect(repository.markUsed).not.toHaveBeenCalled();
      expect(usersService.setPassword).not.toHaveBeenCalled();
    });

    it('marks the code used and sets the new password when the code is correct', async () => {
      usersService.findByPhone.mockResolvedValue({ id: 'user-1' });
      repository.findActive.mockResolvedValue({
        id: 'code-1',
        codeHash: sha256('123456'),
        attempts: 0,
      });

      await service.resetPassword('9876543210', '123456', 'NewPassword123!');

      expect(repository.markUsed).toHaveBeenCalledWith('code-1');
      expect(usersService.setPassword).toHaveBeenCalledWith(
        'user-1',
        'NewPassword123!',
      );
      expect(repository.incrementAttempts).not.toHaveBeenCalled();
    });
  });
});
