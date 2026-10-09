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
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @RequirePermissions('api_keys:create')
  @ApiOperation({ summary: 'Create an API key for a project' })
  @ApiResponse({ status: 201, description: 'API key created. Shown once.' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return {
      message: 'API key created successfully',
      data: await this.apiKeysService.create(projectId, dto.name),
    };
  }

  @Get()
  @RequirePermissions('api_keys:read')
  @ApiOperation({ summary: 'List API keys of a project' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  async list(@Param('projectId') projectId: string) {
    return {
      message: 'API keys retrieved successfully',
      data: await this.apiKeysService.findAll(projectId),
    };
  }

  @Delete(':id')
  @RequirePermissions('api_keys:delete')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  async revoke(@Param('projectId') projectId: string, @Param('id') id: string) {
    await this.apiKeysService.revoke(projectId, id);
    return { message: 'API key revoked successfully', data: null };
  }
}
