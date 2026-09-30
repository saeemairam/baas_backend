import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [UsersModule, JwtModule.register({})], // empty register: we set options per sign() call instead
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
