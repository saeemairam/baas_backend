import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  register(dto: RegisterDto) {
    return this.usersService.register(dto);
  }
}
