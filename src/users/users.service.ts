import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  findByPhone(phone: string) {
    return this.usersRepository.findByPhone(phone);
  }

  async register(input: {
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    // 1. Reject duplicate phone numbers
    const existing = await this.usersRepository.findByPhone(input.phone);
    if (existing) {
      throw new ConflictException('Phone already exists');
    }

    // 2. Hash the password before storing it
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 3. Save the user
    const id = randomUUID();
    await this.usersRepository.create({
      id,
      phone: input.phone,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    // 4. Return only safe fields, never the password hash
    return {
      id,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
    };
  }
}
