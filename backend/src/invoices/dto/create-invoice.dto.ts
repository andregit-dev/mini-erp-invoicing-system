import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  Max,
  IsInt,
  IsNumber,
  Matches,
  MaxLength,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsFutureDate } from '../../common/validators/future-date.validator';

class InvoiceItemDto {
  @ApiProperty({ example: 'MacBook Pro 14"' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200, { message: 'Description must be less than 200 characters' })
  description: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(99999, { message: 'Quantity must be less than 100,000' })
  quantity: number;

  @ApiProperty({ example: 25000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(999999999, { message: 'Price must be less than 999,999,999' })
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: '2026-07-01' })
  @IsNotEmpty()
  @IsDateString()
  // TODO: Restrict to ADMIN only when RBAC is implemented
  // @Validate(IsFutureDate)
  dueDate: string;

  @ApiProperty({ example: 'Pembayaran untuk project Q3' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Note must be less than 200 characters' })
  note?: string;

  @ApiProperty({ example: 'cmqrtn6l60001i0dbx0kcge2d' })
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+$/, {
    message: 'customerId must be alphanumeric (lowercase a-z and 0-9)',
  })
  customerId: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
