import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiKeysService } from '../../api-keys/api-keys.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// Lets a route accept either a project API key (x-api-key header)
// or a normal logged-in user (Bearer token).
@Injectable()
export class ApiKeyOrJwtGuard implements CanActivate {
  private readonly jwtGuard: JwtAuthGuard;

  constructor(
    private readonly apiKeysService: ApiKeysService,
    jwtService: JwtService,
    config: ConfigService,
  ) {
    this.jwtGuard = new JwtAuthGuard(jwtService, config);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];

    if (!key) {
      return this.jwtGuard.canActivate(context);
    }

    const projectId = request.params?.projectId;
    if (typeof key !== 'string' || !projectId) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiKey = await this.apiKeysService.authenticate(key, projectId);
    return true;
  }
}
