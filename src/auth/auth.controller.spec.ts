import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordResetService } from './password-reset.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    const fakeAuthService = { register: vi.fn() } as unknown as AuthService;
    const fakePasswordResetService = {
      requestReset: vi.fn(),
      resetPassword: vi.fn(),
    } as unknown as PasswordResetService;
    controller = new AuthController(fakeAuthService, fakePasswordResetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
