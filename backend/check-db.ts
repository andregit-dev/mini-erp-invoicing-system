import { PrismaClient } from './prisma/generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
console.log('📁 Current directory:', process.cwd());

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Connected!');
    const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('📋 Tables:', result);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

main();
