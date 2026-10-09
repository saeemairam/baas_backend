import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RolesService } from '../roles/roles.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { ProjectMembersRepository } from './project-members.repository.js';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly membersRepository: ProjectMembersRepository,
    private readonly rolesService: RolesService,
  ) {}

  async addMember(projectId: string, dto: AddMemberDto) {
    const existing = await this.membersRepository.findByProjectAndUser(
      projectId,
      dto.userId,
    );
    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const role = await this.rolesService.findByName(projectId, dto.role);

    const id = randomUUID();
    await this.membersRepository.create({
      id,
      projectId,
      userId: dto.userId,
      roleId: role.id,
    });

    return this.membersRepository.findByProjectAndUser(projectId, dto.userId);
  }

  listMembers(projectId: string) {
    return this.membersRepository.findAllByProject(projectId);
  }

  async removeMember(projectId: string, memberUserId: string) {
    const existing = await this.membersRepository.findByProjectAndUser(
      projectId,
      memberUserId,
    );
    if (!existing) {
      throw new NotFoundException('Member not found');
    }

    if (existing.roleId) {
      const role = await this.rolesService.findOne(projectId, existing.roleId);
      if (role.name === 'owner') {
        throw new ForbiddenException('The project owner cannot be removed');
      }
    }

    await this.membersRepository.delete(projectId, memberUserId);
  }
}
