import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let repo: { findByPhone: any; create: any };

  beforeEach(() => {
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

  // new tests below
  it('validateUser returns user data when password matches', async () => {
    const passwordHash = await bcrypt.hash('StrongPassword123!', 10);
    repo.findByPhone.mockResolvedValue({
      id: 'user-1',
      phone: '9999999999',
      password_hash: passwordHash,
      first_name: 'Test',
      last_name: 'User',
    });

    const result = await service.validateUser(
      '9999999999',
      'StrongPassword123!',
    );

    expect(result.id).toBe('user-1');
    expect(result.phone).toBe('9999999999');
  });

  it('validateUser throws UnauthorizedException when password is wrong', async () => {
    const passwordHash = await bcrypt.hash('StrongPassword123!', 10);
    repo.findByPhone.mockResolvedValue({
      id: 'user-1',
      phone: '9999999999',
      password_hash: passwordHash,
      first_name: 'Test',
      last_name: 'User',
    });

    await expect(
      service.validateUser('9999999999', 'WrongPassword'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
