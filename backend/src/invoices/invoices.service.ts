import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
// import { InvoiceStatus } from '../../../generated/prisma/enums';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateInvoiceDto) {
    // Cek customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Hitung subtotal, tax, total
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const tax = subtotal * 0.11; // 11% PPN
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice with items
    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        dueDate: new Date(dto.dueDate),
        subtotal,
        tax,
        total,
        note: dto.note,
        customerId: dto.customerId,
        userId,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filters: FilterInvoiceDto) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const invoice = await this.findOne(id);

    // Validasi status flow
    const statusFlow = {
      DRAFT: ['SENT'],
      SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
      PAID: [],
      OVERDUE: ['PAID', 'CANCELLED'],
      CANCELLED: [],
    };

    if (!statusFlow[invoice.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${invoice.status} to ${dto.status}`,
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: dto.status },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async getDashboard(userId?: string) {
    const where = userId ? { userId } : {};

    // Total invoices
    const totalInvoices = await this.prisma.invoice.count({ where });

    // Total revenue (only PAID invoices)
    const revenueResult = await this.prisma.invoice.aggregate({
      where: {
        ...where,
        status: 'PAID',
      },
      _sum: {
        total: true,
      },
    });

    // Status counts
    const statusCounts = await this.prisma.$transaction([
      this.prisma.invoice.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    // Recent invoices (last 5)
    const recentInvoices = await this.prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      totalInvoices,
      totalRevenue: revenueResult._sum.total || 0,
      statusCounts: {
        DRAFT: statusCounts[0],
        SENT: statusCounts[1],
        PAID: statusCounts[2],
        OVERDUE: statusCounts[3],
        CANCELLED: statusCounts[4],
      },
      recentInvoices,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    // Delete items first (cascade should handle, but safe)
    await this.prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    return this.prisma.invoice.delete({
      where: { id },
    });
  }
}
