import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  register(dto: RegisterDto) {
    return this.usersService.register(dto);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.validateUser(dto.phone, dto.password);

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, phone: user.phone },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  getProfile(userId: string) {
    return this.usersService.getProfile(userId);
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string };

    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.getProfile(payload.sub);

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, phone: user.phone },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
      },
    );

    return { accessToken, expiresIn: 900 };
  }

  // Stub: does not yet revoke the token server-side (no blocklist/storage built yet).
  // The client is expected to discard its tokens. Real revocation can be added later.
  logout() {
    return { message: 'Logged out' };
  }
}
