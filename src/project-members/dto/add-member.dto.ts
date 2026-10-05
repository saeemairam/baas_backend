import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

const VALID_ROLES = ['admin', 'developer', 'viewer'] as const;

export class AddMemberDto {
  @ApiProperty({ example: 'f14538ff-feb5-4fc4-b6d1-4b4801d21d8f' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'developer', enum: VALID_ROLES })
  @IsNotEmpty()
  @IsIn(VALID_ROLES)
  role: string;
}
