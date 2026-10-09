import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let fakeRepository: {
    findBySlug: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findAllByOwner: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let fakeRolesService: {
    createDefaultRoles: ReturnType<typeof vi.fn>;
  };
  let fakeMembersRepository: {
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    fakeRepository = {
      findBySlug: vi.fn(),
      findById: vi.fn(),
      findAllByOwner: vi.fn(),
      create: vi.fn(),
    };
    fakeRolesService = {
      createDefaultRoles: vi.fn(),
    };
    fakeMembersRepository = {
      create: vi.fn(),
    };
    service = new ProjectsService(
      fakeRepository as any,
      fakeRolesService as any,
      fakeMembersRepository as any,
    );
  });

  describe('create', () => {
    it('creates a project with an auto-generated slug when none is given', async () => {
      fakeRepository.findBySlug.mockResolvedValue(null);
      fakeRepository.create.mockResolvedValue(undefined);
      fakeRolesService.createDefaultRoles.mockResolvedValue({
        owner: 'owner-role-id',
      });
      fakeMembersRepository.create.mockResolvedValue(undefined);
      fakeRepository.findById.mockResolvedValue({
        id: 'some-id',
        name: 'My First Project',
        slug: 'my-first-project',
        ownerId: 'owner-1',
        status: 'active',
      });

      const result = await service.create('owner-1', {
        name: 'My First Project',
      });

      expect(fakeRepository.findBySlug).toHaveBeenCalledWith(
        'my-first-project',
      );
      expect(fakeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My First Project',
          slug: 'my-first-project',
          ownerId: 'owner-1',
        }),
      );
      expect(fakeRolesService.createDefaultRoles).toHaveBeenCalledWith(
        expect.any(String),
      );
      expect(fakeMembersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'owner-1',
          roleId: 'owner-role-id',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ slug: 'my-first-project' }),
      );
    });

    it('throws ConflictException when the slug is already taken', async () => {
      fakeRepository.findBySlug.mockResolvedValue({
        id: 'existing-id',
        slug: 'my-first-project',
      });

      await expect(
        service.create('owner-1', { name: 'My First Project' }),
      ).rejects.toThrow(ConflictException);

      expect(fakeRepository.create).not.toHaveBeenCalled();
      expect(fakeRolesService.createDefaultRoles).not.toHaveBeenCalled();
      expect(fakeMembersRepository.create).not.toHaveBeenCalled();
    });

    it('uses the explicitly given slug instead of generating one', async () => {
      fakeRepository.findBySlug.mockResolvedValue(null);
      fakeRepository.create.mockResolvedValue(undefined);
      fakeRolesService.createDefaultRoles.mockResolvedValue({
        owner: 'owner-role-id',
      });
      fakeMembersRepository.create.mockResolvedValue(undefined);
      fakeRepository.findById.mockResolvedValue({
        id: 'some-id',
        slug: 'custom-slug',
      });

      await service.create('owner-1', {
        name: 'Anything',
        slug: 'custom-slug',
      });

      expect(fakeRepository.findBySlug).toHaveBeenCalledWith('custom-slug');
      expect(fakeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-slug' }),
      );
    });
  });

  describe('findAllForOwner', () => {
    it('returns the projects belonging to the given owner', async () => {
      const projects = [{ id: '1', ownerId: 'owner-1' }];
      fakeRepository.findAllByOwner.mockResolvedValue(projects);

      const result = await service.findAllForOwner('owner-1');

      expect(fakeRepository.findAllByOwner).toHaveBeenCalledWith('owner-1');
      expect(result).toEqual(projects);
    });
  });
});
