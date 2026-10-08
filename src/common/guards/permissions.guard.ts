import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../roles/roles.service.js';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.sub;
    const projectId: string | undefined =
      request.params?.projectId ?? request.params?.id;

    if (!userId || !projectId) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    const granted = await this.rolesService.getUserPermissions(
      projectId,
      userId,
    );

    const hasAll = required.every((permission) => granted.includes(permission));
    if (!hasAll) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
