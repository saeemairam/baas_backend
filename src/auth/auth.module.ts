import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';
import { PasswordResetService } from './password-reset.service.js';

@Module({
  imports: [UsersModule, DatabaseModule, JwtModule.register({})], // empty register: we set options per sign() call instead
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, PasswordResetRepository],
})
export class AuthModule {}
