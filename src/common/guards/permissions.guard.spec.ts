import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionsGuard } from './permissions.guard.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let fakeReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let fakeRolesService: { getUserPermissions: ReturnType<typeof vi.fn> };

  const buildContext = (request: unknown) =>
    ({
      getHandler: () => 'handler',
      getClass: () => 'class',
      switchToHttp: () => ({ getRequest: () => request }),
    }) as any;

  beforeEach(() => {
    fakeReflector = { getAllAndOverride: vi.fn() };
    fakeRolesService = { getUserPermissions: vi.fn() };
    guard = new PermissionsGuard(fakeReflector as any, fakeRolesService as any);
  });

  it('allows the request when the route requires no permissions', async () => {
    fakeReflector.getAllAndOverride.mockReturnValue(undefined);

    const result = await guard.canActivate(
      buildContext({ user: { sub: 'user-1' }, params: { projectId: 'p-1' } }),
    );

    expect(result).toBe(true);
    expect(fakeRolesService.getUserPermissions).not.toHaveBeenCalled();
  });

  it('allows the request when the user has every required permission', async () => {
    fakeReflector.getAllAndOverride.mockReturnValue(['members:read']);
    fakeRolesService.getUserPermissions.mockResolvedValue([
      'members:read',
      'members:create',
    ]);

    const result = await guard.canActivate(
      buildContext({ user: { sub: 'user-1' }, params: { projectId: 'p-1' } }),
    );

    expect(result).toBe(true);
    expect(fakeRolesService.getUserPermissions).toHaveBeenCalledWith(
      'p-1',
      'user-1',
    );
  });

  it('throws ForbiddenException when a required permission is missing', async () => {
    fakeReflector.getAllAndOverride.mockReturnValue(['members:create']);
    fakeRolesService.getUserPermissions.mockResolvedValue(['members:read']);

    await expect(
      guard.canActivate(
        buildContext({ user: { sub: 'user-1' }, params: { projectId: 'p-1' } }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for a user who is not a member of the project', async () => {
    fakeReflector.getAllAndOverride.mockReturnValue(['members:read']);
    fakeRolesService.getUserPermissions.mockResolvedValue([]);

    await expect(
      guard.canActivate(
        buildContext({ user: { sub: 'user-2' }, params: { projectId: 'p-1' } }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('reads the project id from the :id route param when projectId is absent', async () => {
    fakeReflector.getAllAndOverride.mockReturnValue(['projects:read']);
    fakeRolesService.getUserPermissions.mockResolvedValue(['projects:read']);

    const result = await guard.canActivate(
      buildContext({ user: { sub: 'user-1' }, params: { id: 'p-9' } }),
    );

    expect(result).toBe(true);
    expect(fakeRolesService.getUserPermissions).toHaveBeenCalledWith(
      'p-9',
      'user-1',
    );
  });

  it('throws ForbiddenException when the request has no authenticated user', async () => {
    fakeReflector.getAllAndOverride.mockReturnValue(['members:read']);

    await expect(
      guard.canActivate(buildContext({ params: { projectId: 'p-1' } })),
    ).rejects.toThrow(ForbiddenException);

    expect(fakeRolesService.getUserPermissions).not.toHaveBeenCalled();
  });
});
