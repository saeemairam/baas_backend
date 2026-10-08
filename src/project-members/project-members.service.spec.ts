import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
  let fakeRolesService: {
    findByName: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };

  const projectId = 'project-1';
  const newUserId = 'user-2';

  beforeEach(() => {
    fakeRepository = {
      findByProjectAndUser: vi.fn(),
      findAllByProject: vi.fn(),
      create: vi.fn(),
      updateRole: vi.fn(),
      delete: vi.fn(),
    };
    fakeRolesService = {
      findByName: vi
        .fn()
        .mockResolvedValue({ id: 'role-dev', name: 'developer', projectId }),
      findOne: vi.fn(),
    };
    service = new ProjectMembersService(
      fakeRepository as any,
      fakeRolesService as any,
    );
  });

  describe('addMember', () => {
    it('adds a new member with the role id', async () => {
      fakeRepository.findByProjectAndUser
        .mockResolvedValueOnce(null) // duplicate check
        .mockResolvedValueOnce({
          id: 'm1',
          projectId,
          userId: newUserId,
          role: 'developer',
          roleId: 'role-dev',
        }); // return value

      const result = await service.addMember(projectId, {
        userId: newUserId,
        role: 'developer',
      });

      expect(fakeRolesService.findByName).toHaveBeenCalledWith(
        projectId,
        'developer',
      );
      expect(fakeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          userId: newUserId,
          role: 'developer',
          roleId: 'role-dev',
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
        service.addMember(projectId, {
          userId: newUserId,
          role: 'developer',
        }),
      ).rejects.toThrow(ConflictException);

      expect(fakeRepository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the role does not exist in the project', async () => {
      fakeRepository.findByProjectAndUser.mockResolvedValueOnce(null);
      fakeRolesService.findByName.mockRejectedValueOnce(
        new NotFoundException('Role not found in this project'),
      );

      await expect(
        service.addMember(projectId, {
          userId: newUserId,
          role: 'developer',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(fakeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('listMembers', () => {
    it('returns the member list for the project', async () => {
      const members = [{ id: 'm1', projectId, userId: newUserId }];
      fakeRepository.findAllByProject.mockResolvedValue(members);

      const result = await service.listMembers(projectId);

      expect(fakeRepository.findAllByProject).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(members);
    });
  });

  describe('removeMember', () => {
    it('removes an existing member', async () => {
      fakeRepository.findByProjectAndUser.mockResolvedValue({
        id: 'm1',
        projectId,
        userId: newUserId,
        role: 'viewer',
        roleId: 'role-viewer',
      });
      fakeRolesService.findOne.mockResolvedValue({
        id: 'role-viewer',
        name: 'viewer',
        projectId,
      });

      await service.removeMember(projectId, newUserId);

      expect(fakeRolesService.findOne).toHaveBeenCalledWith(
        projectId,
        'role-viewer',
      );
      expect(fakeRepository.delete).toHaveBeenCalledWith(projectId, newUserId);
    });

    it('throws NotFoundException when the member does not exist', async () => {
      fakeRepository.findByProjectAndUser.mockResolvedValue(null);

      await expect(service.removeMember(projectId, newUserId)).rejects.toThrow(
        NotFoundException,
      );

      expect(fakeRepository.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when trying to remove the owner', async () => {
      fakeRepository.findByProjectAndUser.mockResolvedValue({
        id: 'm1',
        projectId,
        userId: 'owner-1',
        role: 'owner',
        roleId: 'role-owner',
      });
      fakeRolesService.findOne.mockResolvedValue({
        id: 'role-owner',
        name: 'owner',
        projectId,
      });

      await expect(service.removeMember(projectId, 'owner-1')).rejects.toThrow(
        ForbiddenException,
      );

      expect(fakeRepository.delete).not.toHaveBeenCalled();
    });
  });
});
