import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'PT Tech Solutions' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'info@techsolutions.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '08123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 1, Jakarta', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
