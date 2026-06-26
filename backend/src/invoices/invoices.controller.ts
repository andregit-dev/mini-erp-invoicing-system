import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoiceStatus } from '../../generated/prisma/enums';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(req.user.id, createInvoiceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all invoices with filters, search, and pagination',
  })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  findAll(@Request() req, @Query() filters: FilterInvoiceDto) {
    return this.invoicesService.findAll(
      req.user.id,
      filters,
      1, // default page
      10, // default limit
      filters.search,
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  getDashboard(@Request() req) {
    return this.invoicesService.getDashboard(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.invoicesService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
