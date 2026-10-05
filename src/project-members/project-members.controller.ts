import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { ProjectMembersService } from './project-members.service.js';

@ApiTags('Project Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Post()
  @ApiOperation({ summary: 'Add a member to a project' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 403, description: 'Not your project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async addMember(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
  ) {
    return {
      message: 'Member added successfully',
      data: await this.membersService.addMember(projectId, req.user.sub, dto),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List members of a project' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not your project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async listMembers(@Req() req: any, @Param('projectId') projectId: string) {
    return {
      message: 'Members retrieved successfully',
      data: await this.membersService.listMembers(projectId, req.user.sub),
    };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Not your project' })
  @ApiResponse({ status: 404, description: 'Project or member not found' })
  async removeMember(
    @Req() req: any,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    await this.membersService.removeMember(projectId, req.user.sub, userId);
    return { message: 'Member removed successfully', data: null };
  }
}
