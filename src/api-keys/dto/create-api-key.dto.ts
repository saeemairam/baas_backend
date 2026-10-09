import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Mobile app key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
