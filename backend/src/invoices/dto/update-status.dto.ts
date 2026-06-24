import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '../../../prisma/generated/prisma/enums';

export class UpdateStatusDto {
  @ApiProperty({ enum: InvoiceStatus, example: 'SENT' })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
