import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { InvoiceStatus } from '../../prisma/generated/prisma/enums';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const subtotal = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const tax = subtotal * 0.11;
      const total = subtotal + tax;

      const invoiceNumber = await this.generateInvoiceNumber();

      return tx.invoice.create({
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
    });
  }

  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`; // YYYYMMDD

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${datePrefix}`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastNumber + 1;
    }

    return `INV-${datePrefix}-${String(sequence).padStart(4, '0')}`;
  }

  async findAll(userId: string, filters: FilterInvoiceDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      if (start > end) {
        throw new BadRequestException(
          'startDate cannot be greater than endDate',
        );
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const where: any = {
      userId,
    };

    // Filter by status
    if (filters.status) {
      where.status = filters.status;
    }

    // Filter by date range (dueDate)
    if (filters.startDate || filters.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        where.dueDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.dueDate.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search } },
        {
          customer: {
            name: { contains: filters.search },
          },
        },
      ];
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const orderBy: any = {};
    if (sortBy === 'customer') {
      orderBy.customer = { name: sortOrder };
    } else if (['invoiceNumber', 'status', 'dueDate', 'createdAt', 'total'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
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
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
    const statusFlow: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT],
      [InvoiceStatus.SENT]: [
        InvoiceStatus.PAID,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.CANCELLED,
      ],
      [InvoiceStatus.PAID]: [],
      [InvoiceStatus.OVERDUE]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      [InvoiceStatus.CANCELLED]: [],
    };

    const currentStatus = invoice.status as InvoiceStatus;
    const newStatus = dto.status as InvoiceStatus;

    if (!statusFlow[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
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

  async getDashboard(userId: string) {
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
