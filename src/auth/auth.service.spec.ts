import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    const fakeUsersService = { register: vi.fn() } as unknown as UsersService;
    service = new AuthService(fakeUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
