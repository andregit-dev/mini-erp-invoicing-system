import { PrismaClient } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const ALL_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
type Status = typeof ALL_STATUSES[number];

const PRODUCTS = [
  { name: 'MacBook Pro 14"', price: 25000000 },
  { name: 'MacBook Pro 16"', price: 35000000 },
  { name: 'iPad Air', price: 8500000 },
  { name: 'iPhone 15 Pro', price: 18000000 },
  { name: 'AirPods Pro', price: 3500000 },
  { name: 'Monitor 27" 4K', price: 6500000 },
  { name: 'Monitor 24" Full HD', price: 3500000 },
  { name: 'Mechanical Keyboard', price: 1500000 },
  { name: 'Wireless Mouse', price: 800000 },
  { name: 'Webcam 4K', price: 2500000 },
  { name: 'USB-C Hub', price: 1200000 },
  { name: 'External SSD 1TB', price: 2800000 },
  { name: 'Docking Station', price: 4500000 },
  { name: 'Monitor Stand', price: 1200000 },
  { name: 'Cable Management Kit', price: 500000 },
];

const COMPANIES = [
  { name: 'PT Tech Solutions', email: 'info@techsolutions.com', phone: '08123456789', address: 'Jl. Sudirman No. 1, Jakarta' },
  { name: 'CV Digital Creative', email: 'hello@digitalcreative.com', phone: '08198765432', address: 'Jl. Gatot Subroto No. 10, Bandung' },
  { name: 'PT Inovasi Mandiri', email: 'contact@inovasi.com', phone: '08155555555', address: 'Jl. Diponegoro No. 5, Surabaya' },
  { name: 'UD Berkah Jaya', email: 'berkahjaya@email.com', phone: '08122233344', address: 'Jl. Ahmad Yani No. 15, Medan' },
  { name: 'PT Kreatif Media', email: 'kreatif@media.com', phone: '08133344455', address: 'Jl. Thamrin No. 20, Makassar' },
  { name: 'CV Sumber Makmur', email: 'sumber@makmur.com', phone: '08144455566', address: 'Jl. Pahlawan No. 8, Semarang' },
  { name: 'PT Jaya Abadi', email: 'jaya@abadi.com', phone: '08155566677', address: 'Jl. Merdeka No. 12, Palembang' },
  { name: 'CV Karya Mandiri', email: 'karya@mandiri.com', phone: '08166677788', address: 'Jl. Sudirman No. 7, Yogyakarta' },
  { name: 'PT Maju Bersama', email: 'maju@bersama.com', phone: '08177788899', address: 'Jl. Gatot Subroto No. 3, Malang' },
  { name: 'CV Sukses Selalu', email: 'sukses@selalu.com', phone: '08188899900', address: 'Jl. Diponegoro No. 2, Bali' },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateItems(count: number) {
  const items = [];
  let subtotal = 0;

  const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  for (const product of selected) {
    const quantity = randomNumber(1, 5);
    const unitPrice = product.price + randomNumber(-500000, 500000);
    const total = quantity * unitPrice;
    subtotal += total;

    items.push({
      description: product.name,
      quantity,
      unitPrice: Math.max(unitPrice, 100000),
      total,
    });
  }

  return { items, subtotal };
}

async function main() {
  console.log('🌱 Starting seed with realistic data...');

  const hashedPassword = await bcrypt.hash('password123', 12);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@example.com',
        password: hashedPassword,
        name: 'Manager User',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  const customers = [];
  for (const company of COMPANIES) {
    const randomUser = randomItem(users);
    const customer = await prisma.customer.create({
      data: {
        ...company,
        userId: randomUser.id,
      },
    });
    customers.push(customer);
    console.log(`✅ Customer: ${customer.name}`);
  }

  console.log(`✅ Created ${customers.length} customers`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysFuture = new Date(now);
  thirtyDaysFuture.setDate(thirtyDaysFuture.getDate() + 30);

  let totalInvoices = 0;

  for (const customer of customers) {
    const randomUser = randomItem(users);

    for (const status of ALL_STATUSES) {
      const itemCount = randomNumber(1, 4);
      const { items, subtotal } = generateItems(itemCount);
      const tax = subtotal * 0.11;
      const total = subtotal + tax;

      let dueDate: Date;
      if (status === 'OVERDUE') {
        const past = new Date(now);
        past.setDate(past.getDate() - randomNumber(1, 15));
        dueDate = past;
      } else if (status === 'PAID' || status === 'SENT') {
        dueDate = randomDate(thirtyDaysAgo, now);
      } else if (status === 'DRAFT') {
        const future = new Date(now);
        future.setDate(future.getDate() + randomNumber(1, 15));
        dueDate = future;
      } else {
        dueDate = randomDate(thirtyDaysAgo, thirtyDaysFuture);
      }

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const datePrefix = `${year}${month}${day}`;
      const lastInvoice = await prisma.invoice.findFirst({
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

      const invoiceNumber = `INV-${datePrefix}-${String(sequence).padStart(4, '0')}`;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          status: status as any,
          subtotal,
          tax,
          total,
          dueDate,
          note: `Invoice ${status} - ${customer.name} - ${new Date(dueDate).toLocaleDateString('id-ID')}`,
          customerId: customer.id,
          userId: randomUser.id,
          items: {
            create: items,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      totalInvoices++;
      console.log(`✅ Invoice ${invoiceNumber} | ${status} | Rp ${total.toLocaleString()} | Due: ${dueDate.toLocaleDateString('id-ID')}`);
    }
  }

  console.log('\n📊 SEED SUMMARY:');
  console.log(`   ✅ ${users.length} users`);
  console.log(`   ✅ ${customers.length} customers`);
  console.log(`   ✅ ${totalInvoices} invoices (${ALL_STATUSES.length} statuses per customer)`);
  console.log(`   ✅ ${totalInvoices * 3} invoice items (avg 3 items per invoice)`);

  const statusCounts = await prisma.invoice.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n📈 Status Distribution:');
  for (const item of statusCounts) {
    console.log(`   ${item.status}: ${item._count} invoices`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
