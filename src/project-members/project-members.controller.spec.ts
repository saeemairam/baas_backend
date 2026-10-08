import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectMembersController } from './project-members.controller.js';

describe('ProjectMembersController', () => {
  let controller: ProjectMembersController;
  let fakeService: {
    addMember: ReturnType<typeof vi.fn>;
    listMembers: ReturnType<typeof vi.fn>;
    removeMember: ReturnType<typeof vi.fn>;
  };

  const projectId = 'project-1';

  beforeEach(() => {
    fakeService = {
      addMember: vi.fn(),
      listMembers: vi.fn(),
      removeMember: vi.fn(),
    };
    controller = new ProjectMembersController(fakeService as any);
  });

  it('addMember calls the service with projectId and the dto', async () => {
    const dto = { userId: 'user-2', role: 'developer' };
    const created = {
      id: 'm1',
      projectId,
      userId: 'user-2',
      role: 'developer',
    };
    fakeService.addMember.mockResolvedValue(created);

    const result = await controller.addMember(projectId, dto as any);

    expect(fakeService.addMember).toHaveBeenCalledWith(projectId, dto);
    expect(result).toEqual({
      message: 'Member added successfully',
      data: created,
    });
  });

  it('listMembers calls the service with projectId', async () => {
    const members = [{ id: 'm1', projectId, userId: 'user-2' }];
    fakeService.listMembers.mockResolvedValue(members);

    const result = await controller.listMembers(projectId);

    expect(fakeService.listMembers).toHaveBeenCalledWith(projectId);
    expect(result).toEqual({
      message: 'Members retrieved successfully',
      data: members,
    });
  });

  it('removeMember calls the service with projectId and the target userId', async () => {
    fakeService.removeMember.mockResolvedValue(undefined);

    const result = await controller.removeMember(projectId, 'user-2');

    expect(fakeService.removeMember).toHaveBeenCalledWith(projectId, 'user-2');
    expect(result).toEqual({
      message: 'Member removed successfully',
      data: null,
    });
  });
});
