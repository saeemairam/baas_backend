import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { Project } from './entities/project.entity.js';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findBySlug(slug: string): Promise<Project | null> {
    const rows = await this.db.query<Project[]>(
      'SELECT * FROM projects WHERE slug = ? LIMIT 1',
      [slug],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<Project | null> {
    const rows = await this.db.query<Project[]>(
      'SELECT * FROM projects WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ?? null;
  }

  async findAllByOwner(ownerId: string): Promise<Project[]> {
    return this.db.query<Project[]>(
      'SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId],
    );
  }

  async create(project: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<void> {
    await this.db.query(
      'INSERT INTO projects (id, name, slug, owner_id) VALUES (?, ?, ?, ?)',
      [project.id, project.name, project.slug, project.ownerId],
    );
  }

  async update(
    id: string,
    changes: { name?: string; slug?: string },
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.name !== undefined) {
      fields.push('name = ?');
      values.push(changes.name);
    }
    if (changes.slug !== undefined) {
      fields.push('slug = ?');
      values.push(changes.slug);
    }

    if (fields.length === 0) return;

    values.push(id);
    await this.db.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM projects WHERE id = ?', [id]);
  }
}
