import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import * as path from 'path';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    let databaseUrl = process.env.DATABASE_URL;
    console.log('* DATABASE_URL:', databaseUrl);
    console.log('* Current directory:', process.cwd());

    if (databaseUrl && databaseUrl.startsWith('file:./')) {
      const relativePath = databaseUrl.replace('file:./', '');
      const absolutePath = path.resolve(process.cwd(), relativePath);
      databaseUrl = `file:${absolutePath}`;
      console.log('* Resolved DATABASE_URL:', databaseUrl);
    }

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
