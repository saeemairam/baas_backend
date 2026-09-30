import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create_user.dto.js'; // new
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  findByPhone(phone: string) {
    return this.usersRepository.findByPhone(phone);
  }

  async register(dto: CreateUserDto) {
    // was: input: { phone: string; ... }
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
}
