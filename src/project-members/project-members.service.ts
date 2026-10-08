import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProjectsService } from '../projects/projects.service.js';
import { RolesService } from '../roles/roles.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { ProjectMembersRepository } from './project-members.repository.js';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly membersRepository: ProjectMembersRepository,
    private readonly projectsService: ProjectsService,
    private readonly rolesService: RolesService,
  ) {}

  // only the project owner can manage members, for now
  private async assertIsOwner(projectId: string, userId: string) {
    const project = await this.projectsService.findOneForOwner(
      projectId,
      userId,
    );
    return project;
  }

  async addMember(projectId: string, ownerId: string, dto: AddMemberDto) {
    await this.assertIsOwner(projectId, ownerId);

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
      role: dto.role,
      roleId: role.id,
    });

    return this.membersRepository.findByProjectAndUser(projectId, dto.userId);
  }

  async listMembers(projectId: string, ownerId: string) {
    await this.assertIsOwner(projectId, ownerId);
    return this.membersRepository.findAllByProject(projectId);
  }

  async removeMember(projectId: string, ownerId: string, memberUserId: string) {
    await this.assertIsOwner(projectId, ownerId);

    const existing = await this.membersRepository.findByProjectAndUser(
      projectId,
      memberUserId,
    );
    if (!existing) {
      throw new NotFoundException('Member not found');
    }

    await this.membersRepository.delete(projectId, memberUserId);
  }
}
