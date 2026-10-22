import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { CreateRecordDto } from './dto/create-record.dto.js';
import { UpdateRecordDto } from './dto/update-record.dto.js';
import { RecordsService } from './records.service.js';

@ApiTags('Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/resources/:resourceId/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @RequirePermissions('records:create')
  @ApiOperation({ summary: 'Create a record in a resource' })
  @ApiResponse({ status: 201, description: 'Record created successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async create(
    @Param('projectId') projectId: string,
    @Param('resourceId') resourceId: string,
    @Body() dto: CreateRecordDto,
  ) {
    return {
      message: 'Record created successfully',
      data: await this.recordsService.create(projectId, resourceId, dto.data),
    };
  }

  @Get()
  @RequirePermissions('records:read')
  @ApiOperation({ summary: 'List records of a resource' })
  @ApiResponse({ status: 200, description: 'Records retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async list(
    @Param('projectId') projectId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return {
      message: 'Records retrieved successfully',
      data: await this.recordsService.findAll(projectId, resourceId),
    };
  }

  @Get(':id')
  @RequirePermissions('records:read')
  @ApiOperation({ summary: 'Get one record' })
  @ApiResponse({ status: 200, description: 'Record retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async getOne(
    @Param('projectId') projectId: string,
    @Param('resourceId') resourceId: string,
    @Param('id') id: string,
  ) {
    return {
      message: 'Record retrieved successfully',
      data: await this.recordsService.findOne(projectId, resourceId, id),
    };
  }

  @Put(':id')
  @RequirePermissions('records:update')
  @ApiOperation({ summary: 'Replace the data of a record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async update(
    @Param('projectId') projectId: string,
    @Param('resourceId') resourceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
  ) {
    await this.recordsService.update(projectId, resourceId, id, dto.data);
    return { message: 'Record updated successfully', data: null };
  }

  @Delete(':id')
  @RequirePermissions('records:delete')
  @ApiOperation({ summary: 'Delete a record' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  @ApiResponse({ status: 403, description: 'Missing permission' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('resourceId') resourceId: string,
    @Param('id') id: string,
  ) {
    await this.recordsService.delete(projectId, resourceId, id);
    return { message: 'Record deleted successfully', data: null };
  }
}
