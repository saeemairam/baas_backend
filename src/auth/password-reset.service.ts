import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  createHash,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { UsersService } from '../users/users.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';

const MAX_ATTEMPTS = 3;
const INVALID_CODE_MESSAGE = 'Invalid or expired code';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly usersService: UsersService,
  ) {}

  // Always finishes without an error, even for an unknown phone,
  // so nobody can use it to find out which phones are registered.
  async requestReset(phone: string): Promise<void> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      return;
    }

    const code = randomInt(100000, 1000000).toString();

    await this.passwordResetRepository.invalidateActive(user.id);
    await this.passwordResetRepository.create({
      id: randomUUID(),
      userId: user.id,
      codeHash: this.hash(code),
    });

    // Development mode: no SMS provider yet, so the code is printed here.
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] Password reset code for ${phone}: ${code}`);
    }
  }

  async resetPassword(
    phone: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const active = await this.passwordResetRepository.findActive(
      user.id,
      MAX_ATTEMPTS,
    );
    if (!active) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    if (!this.matches(code, active.codeHash)) {
      await this.passwordResetRepository.incrementAttempts(active.id);
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    await this.passwordResetRepository.markUsed(active.id);
    await this.usersService.setPassword(user.id, newPassword);
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private matches(code: string, storedHash: string): boolean {
    const a = Buffer.from(this.hash(code));
    const b = Buffer.from(storedHash);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
