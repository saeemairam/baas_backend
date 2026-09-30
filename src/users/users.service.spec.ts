import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let repo: { findByPhone: any; create: any };

  beforeEach(() => {
    // a fake repository, so this test never touches the real database
    repo = {
      findByPhone: vi.fn(),
      create: vi.fn(),
    };
    service = new UsersService(repo as unknown as UsersRepository);
  });

  it('creates a user when the phone is new', async () => {
    repo.findByPhone.mockResolvedValue(null);

    const result = await service.register({
      phone: '9999999999',
      password: 'StrongPassword123!',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(result.phone).toBe('9999999999');
    expect(result.firstName).toBe('Test');
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('throws ConflictException when the phone already exists', async () => {
    repo.findByPhone.mockResolvedValue({ id: 'existing-id' });

    await expect(
      service.register({
        phone: '9999999999',
        password: 'StrongPassword123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    ).rejects.toThrow(ConflictException);

    expect(repo.create).not.toHaveBeenCalled();
  });
});
