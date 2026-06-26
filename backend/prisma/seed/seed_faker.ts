import { PrismaClient } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { faker } from '@faker-js/faker';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

faker.seed(123);

const ALL_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
type Status = typeof ALL_STATUSES[number];

function generateCustomers(count: number) {
  const customers = [];
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const company = faker.company.name();

    customers.push({
      name: `${company}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: `+62 8${faker.string.numeric(2)} ${faker.string.numeric(4)} ${faker.string.numeric(4)}`,
      address: faker.location.streetAddress(true) + ', ' + faker.location.city() + ', ' + faker.location.country(),
    });
  }
  return customers;
}

function generateItems(count: number) {
  const items = [];
  let subtotal = 0;

  for (let i = 0; i < count; i++) {
    const productName = faker.commerce.productName();
    const quantity = faker.number.int({ min: 1, max: 5 });
    const unitPrice = faker.number.int({ min: 100000, max: 5000000 });
    const total = quantity * unitPrice;
    subtotal += total;

    items.push({
      description: productName,
      quantity,
      unitPrice,
      total,
    });
  }

  return { items, subtotal };
}

async function main() {
  console.log('🌱 Starting seed with realistic data...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. CREATE USERS
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

  // 2. CREATE 20 CUSTOMERS
  const customerData = generateCustomers(20);
  const customers = [];
  for (const data of customerData) {
    const randomUser = faker.helpers.arrayElement(users);
    const customer = await prisma.customer.create({
      data: {
        ...data,
        userId: randomUser.id,
      },
    });
    customers.push(customer);
    console.log(`✅ Customer: ${customer.name}`);
  }

  console.log(`✅ Created ${customers.length} customers`);

  // 3. CREATE 10 INVOICES PER CUSTOMER
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysFuture = new Date(now);
  thirtyDaysFuture.setDate(thirtyDaysFuture.getDate() + 30);

  let totalInvoices = 0;

  for (const customer of customers) {
    const randomUser = faker.helpers.arrayElement(users);

  
    for (let i = 0; i < 10; i++) {
      // Random status
      const status = faker.helpers.arrayElement(ALL_STATUSES);

      // Generate 5 items
      const { items, subtotal } = generateItems(5);
      const tax = subtotal * 0.11;
      const total = subtotal + tax;

      // Random dueDate (1-30 days from now)
      const dueDate = faker.date.between({ from: thirtyDaysAgo, to: thirtyDaysFuture });

      // Generate invoice number
      const datePrefix = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0');

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
          note: faker.lorem.sentence({ min: 5, max: 15 }),
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
      console.log(`Invoice ${invoiceNumber} | ${status} | Rp ${total.toLocaleString()}`);
    }
  }

  console.log('\n SEED SUMMARY:');
  console.log(`   ${users.length} users`);
  console.log(`   ${customers.length} customers`);
  console.log(`   ${totalInvoices} invoices (10 per customer)`);
  console.log(`   ${totalInvoices * 5} invoice items (5 per invoice)`);

  const statusCounts = await prisma.invoice.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n Status Distribution:');
  for (const item of statusCounts) {
    console.log(`   ${item.status}: ${item._count} invoices`);
  }
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
