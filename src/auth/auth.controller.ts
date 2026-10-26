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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { PasswordResetService } from './password-reset.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
  ) {}

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

  // Stricter limit than the app default: 5 attempts per 60 seconds
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with phone and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid phone or password' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() dto: LoginDto) {
    return {
      message: 'Login successful',
      data: await this.authService.login(dto),
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a new access token using a refresh token' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return {
      message: 'Access token refreshed',
      data: await this.authService.refresh(dto),
    };
  }

  // 3 requests per 60 seconds, so nobody can flood a phone with codes
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request a password reset code',
    description:
      'Always answers the same way, whether or not the phone is registered. In development the code is printed in the server terminal.',
  })
  @ApiResponse({ status: 200, description: 'Reset code requested' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordResetService.requestReset(dto.phone);
    return {
      message: 'If the phone is registered, a reset code has been sent',
      data: null,
    };
  }

  // 5 attempts per 60 seconds
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Set a new password using the reset code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(
      dto.phone,
      dto.code,
      dto.newPassword,
    );
    return { message: 'Password reset successfully', data: null };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out the current session',
    description:
      'Requires a valid access token. Note: this does not yet revoke the token server-side — the client should discard its stored tokens.',
  })
  @ApiResponse({ status: 200, description: 'Logged out' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  async logout() {
    return {
      message: 'Logged out',
      data: this.authService.logout(),
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
