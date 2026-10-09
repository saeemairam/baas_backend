import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProjectMembersRepository } from '../project-members/project-members.repository.js';
import { RolesService } from '../roles/roles.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsRepository } from './projects.repository.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly rolesService: RolesService,
    private readonly projectMembersRepository: ProjectMembersRepository,
  ) {}

  async create(ownerId: string, dto: CreateProjectDto) {
    const slug = dto.slug ?? this.slugify(dto.name);

    const existing = await this.projectsRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Project slug already in use');
    }

    const id = randomUUID();
    await this.projectsRepository.create({
      id,
      name: dto.name,
      slug,
      ownerId,
    });

    const roleIds = await this.rolesService.createDefaultRoles(id);

    await this.projectMembersRepository.create({
      id: randomUUID(),
      projectId: id,
      userId: ownerId,
      roleId: roleIds['owner'],
    });

    return this.projectsRepository.findById(id);
  }

  findAllForOwner(ownerId: string) {
    return this.projectsRepository.findAllByOwner(ownerId);
  }

  async findOneForOwner(id: string, userId: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    // Reuses the same lookup + ownership check as findOneForOwner
    await this.findOneForOwner(id, userId);

    if (dto.slug) {
      const existing = await this.projectsRepository.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('Project slug already in use');
      }
    }

    await this.projectsRepository.update(id, {
      name: dto.name,
      slug: dto.slug,
    });

    return this.projectsRepository.findById(id);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOneForOwner(id, userId);
    await this.projectsRepository.delete(id);
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
