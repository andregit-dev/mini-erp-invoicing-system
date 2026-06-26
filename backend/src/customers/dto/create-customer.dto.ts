import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'PT Tech Solutions' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  name: string;

  @ApiProperty({ example: 'info@techsolutions.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Email must be less than 100 characters' })
  email: string;

  @ApiProperty({ example: '08123456789', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+62|0)[0-9]{9,13}$/, {
    message: 'Invalid phone number format (use +62 or 0 prefix)',
  })
  phone?: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 1, Jakarta', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'Address must be less than 250 characters' })
  address?: string;
}
