import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '9876543210' })
  @IsMobilePhone('en-IN')
  phone: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string;
}
