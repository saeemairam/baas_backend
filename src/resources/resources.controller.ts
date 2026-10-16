import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { CreateResourceDto } from './dto/create-resource.dto.js';
import { ResourcesService } from './resources.service.js';

@ApiTags('Resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @RequirePermissions('resources:create')
  @ApiOperation({ summary: 'Create a resource in a project' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  @ApiResponse({ status: 409, description: 'Resource name already exists' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return {
      message: 'Resource created successfully',
      data: await this.resourcesService.create(projectId, dto.name),
    };
  }

  @Get()
  @RequirePermissions('resources:read')
  @ApiOperation({ summary: 'List resources of a project' })
  @ApiResponse({ status: 200, description: 'Resources retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  async list(@Param('projectId') projectId: string) {
    return {
      message: 'Resources retrieved successfully',
      data: await this.resourcesService.findAll(projectId),
    };
  }

  @Delete(':id')
  @RequirePermissions('resources:delete')
  @ApiOperation({ summary: 'Delete a resource and its records' })
  @ApiResponse({ status: 200, description: 'Resource deleted successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    await this.resourcesService.delete(projectId, id);
    return { message: 'Resource deleted successfully', data: null };
  }
}
