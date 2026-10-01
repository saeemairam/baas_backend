import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ProjectsRepository } from './projects.repository.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

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

    return this.projectsRepository.findById(id);
  }

  findAllForOwner(ownerId: string) {
    return this.projectsRepository.findAllByOwner(ownerId);
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
