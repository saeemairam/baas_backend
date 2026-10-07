import { Injectable, NotFoundException } from '@nestjs/common';
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
}
