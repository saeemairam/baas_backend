import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    const fakeUsersService = { register: vi.fn() } as unknown as UsersService;
    const fakeJwtService = { signAsync: vi.fn() } as unknown as JwtService;
    const fakeConfigService = { get: vi.fn() } as unknown as ConfigService;
    service = new AuthService(
      fakeUsersService,
      fakeJwtService,
      fakeConfigService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
