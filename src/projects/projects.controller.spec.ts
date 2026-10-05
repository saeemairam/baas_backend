import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: {
    create: any;
    findAllForOwner: any;
    findOneForOwner: any;
    update: any;
    delete: any;
  };

  const fakeReq = { user: { sub: 'user-1' } };

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findAllForOwner: vi.fn(),
      findOneForOwner: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    controller = new ProjectsController(service as unknown as ProjectsService);
  });

  it('create() calls service.create with the owner id and dto, wraps the result', async () => {
    const dto = { name: 'Test Project' };
    const created = { id: 'proj-1', name: 'Test Project', ownerId: 'user-1' };
    service.create.mockResolvedValue(created);

    const result = await controller.create(fakeReq, dto as any);

    expect(service.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual({
      message: 'Project created successfully',
      data: created,
    });
  });

  it('findAll() calls service.findAllForOwner with the owner id, wraps the result', async () => {
    const projects = [{ id: 'proj-1' }, { id: 'proj-2' }];
    service.findAllForOwner.mockResolvedValue(projects);

    const result = await controller.findAll(fakeReq);

    expect(service.findAllForOwner).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      message: 'Projects retrieved successfully',
      data: projects,
    });
  });

  it('findOne() calls service.findOneForOwner with id and owner id, wraps the result', async () => {
    const project = { id: 'proj-1', ownerId: 'user-1' };
    service.findOneForOwner.mockResolvedValue(project);

    const result = await controller.findOne(fakeReq, 'proj-1');

    expect(service.findOneForOwner).toHaveBeenCalledWith('proj-1', 'user-1');
    expect(result).toEqual({
      message: 'Project retrieved successfully',
      data: project,
    });
  });

  it('update() calls service.update with id, owner id, and dto, wraps the result', async () => {
    const dto = { name: 'Updated Name' };
    const updated = { id: 'proj-1', name: 'Updated Name' };
    service.update.mockResolvedValue(updated);

    const result = await controller.update(fakeReq, 'proj-1', dto as any);

    expect(service.update).toHaveBeenCalledWith('proj-1', 'user-1', dto);
    expect(result).toEqual({
      message: 'Project updated successfully',
      data: updated,
    });
  });

  it('remove() calls service.delete with id and owner id, returns null data', async () => {
    service.delete.mockResolvedValue(undefined);

    const result = await controller.remove(fakeReq, 'proj-1');

    expect(service.delete).toHaveBeenCalledWith('proj-1', 'user-1');
    expect(result).toEqual({
      message: 'Project deleted successfully',
      data: null,
    });
  });
});
