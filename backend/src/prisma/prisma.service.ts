import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env dari root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    console.log('🔍 DATABASE_URL:', databaseUrl);
    console.log('📁 Current directory:', process.cwd());

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
