import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
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
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 409, description: 'Project slug already in use' })
  async create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return {
      message: 'Project created successfully',
      data: await this.projectsService.create(req.user.sub, dto),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List projects you own' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findAll(@Req() req: any) {
    return {
      message: 'Projects retrieved successfully',
      data: await this.projectsService.findAllForOwner(req.user.sub),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not your project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    return {
      message: 'Project retrieved successfully',
      data: await this.projectsService.findOneForOwner(id, req.user.sub),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 403, description: 'Not your project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Project slug already in use' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return {
      message: 'Project updated successfully',
      data: await this.projectsService.update(id, req.user.sub, dto),
    };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not your project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.projectsService.delete(id, req.user.sub);
    return { message: 'Project deleted successfully', data: null };
  }
}
