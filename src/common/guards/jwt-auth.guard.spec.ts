import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function createContext(headers: Record<string, string>): ExecutionContext {
  const request = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let fakeJwtService: { verifyAsync: ReturnType<typeof vi.fn> };
  let fakeConfig: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    fakeJwtService = { verifyAsync: vi.fn() };
    fakeConfig = { get: vi.fn().mockReturnValue('fake-secret') };
    guard = new JwtAuthGuard(fakeJwtService as any, fakeConfig as any);
  });

  it('throws UnauthorizedException when no Authorization header is present', async () => {
    const context = createContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(fakeJwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the auth type is not Bearer', async () => {
    const context = createContext({ authorization: 'Basic sometoken' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when the token fails verification', async () => {
    fakeJwtService.verifyAsync.mockRejectedValue(new Error('bad token'));
    const context = createContext({ authorization: 'Bearer garbage' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows the request and attaches the payload when the token is valid', async () => {
    const payload = { sub: 'user-1', phone: '9876543210' };
    fakeJwtService.verifyAsync.mockResolvedValue(payload);

    const request = { headers: { authorization: 'Bearer validtoken' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect((request as any).user).toEqual(payload);
  });
});
