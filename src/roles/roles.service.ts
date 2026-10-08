import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DEFAULT_ROLES } from './default-roles.constant.js';
import type { Role } from './entities/role.entity.js';
import { RolesRepository } from './roles.repository.js';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  findAllByProject(projectId: string): Promise<Role[]> {
    return this.rolesRepository.findAllByProject(projectId);
  }

  async findOne(projectId: string, id: string): Promise<Role> {
    const role = await this.rolesRepository.findById(projectId, id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  getUserPermissions(projectId: string, userId: string): Promise<string[]> {
    return this.rolesRepository.findPermissionNamesForUser(projectId, userId);
  }

  async createDefaultRoles(projectId: string): Promise<Record<string, string>> {
    const roleIds: Record<string, string> = {};

    for (const defaultRole of DEFAULT_ROLES) {
      const roleId = randomUUID();

      await this.rolesRepository.create({
        id: roleId,
        projectId,
        name: defaultRole.name,
        description: defaultRole.description,
      });

      const permissions = await this.rolesRepository.findPermissionsByNames(
        defaultRole.permissions,
      );
      await this.rolesRepository.assignPermissions(
        roleId,
        permissions.map((permission) => permission.id),
      );

      roleIds[defaultRole.name] = roleId;
    }

    return roleIds;
  }
}
