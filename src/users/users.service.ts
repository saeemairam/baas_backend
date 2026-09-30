import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create_user.dto.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  findByPhone(phone: string) {
    return this.usersRepository.findByPhone(phone);
  }

  async register(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('Phone already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const id = randomUUID();

    await this.usersRepository.create({
      id,
      phone: dto.phone,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return {
      id,
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
    };
  }

  async validateUser(phone: string, password: string) {
    const user = await this.usersRepository.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    return {
      id: user.id,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }

  async getProfile(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }
}
