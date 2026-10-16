import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class CreateRecordDto {
  @ApiProperty({ example: { title: 'Phone', price: 499 } })
  @IsObject()
  data: Record<string, unknown>;
}
