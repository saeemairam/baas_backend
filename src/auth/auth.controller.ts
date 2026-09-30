import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new platform user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Phone already exists' })
  async register(@Body() dto: RegisterDto) {
    return {
      message: 'User registered successfully',
      data: await this.authService.register(dto),
    };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with phone and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid phone or password' })
  async login(@Body() dto: LoginDto) {
    return {
      message: 'Login successful',
      data: await this.authService.login(dto),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current logged-in user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  async getMe(@Req() req: any) {
    return {
      message: 'Current user profile',
      data: await this.authService.getProfile(req.user.sub),
    };
  }
}
