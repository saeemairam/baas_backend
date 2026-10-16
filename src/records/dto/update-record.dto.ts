import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateRecordDto {
  @ApiProperty({ example: { title: 'Phone', price: 459 } })
  @IsObject()
  data: Record<string, unknown>;
}
