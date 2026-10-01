import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
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
}
