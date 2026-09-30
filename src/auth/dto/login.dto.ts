import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '9876543210' })
  @IsMobilePhone('en-IN')
  phone: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsNotEmpty()
  password: string;
}
