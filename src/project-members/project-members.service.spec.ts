import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectMembersService } from './project-members.service.js';

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  let fakeRepository: {
    findByProjectAndUser: ReturnType<typeof vi.fn>;
    findAllByProject: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateRole: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let fakeProjectsService: {
    findOneForOwner: ReturnType<typeof vi.fn>;
  };

  const projectId = 'project-1';
  const ownerId = 'owner-1';
  const newUserId = 'user-2';

  beforeEach(() => {
    fakeRepository = {
      findByProjectAndUser: vi.fn(),
      findAllByProject: vi.fn(),
      create: vi.fn(),
      updateRole: vi.fn(),
      delete: vi.fn(),
    };
    fakeProjectsService = {
      findOneForOwner: vi.fn().mockResolvedValue({ id: projectId, ownerId }),
    };
    service = new ProjectMembersService(
      fakeRepository as any,
      fakeProjectsService as any,
    );
  });

  describe('addMember', () => {
    it('checks ownership, then adds a new member', async () => {
      fakeRepository.findByProjectAndUser
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce({
          id: 'm1',
          projectId,
          userId: newUserId,
          role: 'developer',
        }); // return value

      const result = await service.addMember(projectId, ownerId, {
        userId: newUserId,
        role: 'developer',
      });

      expect(fakeProjectsService.findOneForOwner).toHaveBeenCalledWith(
        projectId,
        ownerId,
      );
      expect(fakeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          userId: newUserId,
          role: 'developer',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ userId: newUserId, role: 'developer' }),
      );
    });

    it('throws ConflictException when the user is already a member', async () => {
      fakeRepository.findByProjectAndUser.mockResolvedValueOnce({
        id: 'm1',
        projectId,
        userId: newUserId,
      });

      await expect(
        service.addMember(projectId, ownerId, {
          userId: newUserId,
          role: 'developer',
        }),
      ).rejects.toThrow(ConflictException);

      expect(fakeRepository.create).not.toHaveBeenCalled();
    });

    it('propagates the ownership check failure from ProjectsService', async () => {
      fakeProjectsService.findOneForOwner.mockRejectedValueOnce(
        new Error('Forbidden'),
      );

      await expect(
        service.addMember(projectId, ownerId, {
          userId: newUserId,
          role: 'developer',
        }),
      ).rejects.toThrow('Forbidden');

      expect(fakeRepository.findByProjectAndUser).not.toHaveBeenCalled();
    });
  });

  describe('listMembers', () => {
    it('checks ownership, then returns the member list', async () => {
      const members = [{ id: 'm1', projectId, userId: newUserId }];
      fakeRepository.findAllByProject.mockResolvedValue(members);

      const result = await service.listMembers(projectId, ownerId);

      expect(fakeProjectsService.findOneForOwner).toHaveBeenCalledWith(
        projectId,
        ownerId,
      );
      expect(result).toEqual(members);
    });
  });

  describe('removeMember', () => {
    it('checks ownership, then removes an existing member', async () => {
      fakeRepository.findByProjectAndUser.mockResolvedValue({
        id: 'm1',
        projectId,
        userId: newUserId,
      });

      await service.removeMember(projectId, ownerId, newUserId);

      expect(fakeRepository.delete).toHaveBeenCalledWith(projectId, newUserId);
    });

    it('throws NotFoundException when the member does not exist', async () => {
      fakeRepository.findByProjectAndUser.mockResolvedValue(null);

      await expect(
        service.removeMember(projectId, ownerId, newUserId),
      ).rejects.toThrow(NotFoundException);

      expect(fakeRepository.delete).not.toHaveBeenCalled();
    });
  });
});
