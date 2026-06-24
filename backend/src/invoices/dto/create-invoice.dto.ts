import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  // IsUUID,
  ValidateNested,
  Min,
  IsInt,
  IsNumber,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemDto {
  @ApiProperty({ example: 'MacBook Pro 14"' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 25000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: '2026-07-01' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'Pembayaran untuk project Q3' })
  @IsOptional()
  @IsString()
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
