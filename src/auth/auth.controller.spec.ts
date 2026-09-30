import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    const fakeAuthService = { register: vi.fn() } as unknown as AuthService;
    controller = new AuthController(fakeAuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
