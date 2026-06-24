import { plainToClass } from 'class-transformer';
import { IsString, IsNotEmpty, validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  NODE_ENV: string = 'development';
}

const logger = new Logger('EnvironmentValidation');

export function validateEnvironment() {
  const config = plainToClass(EnvironmentVariables, process.env);
  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    const errorMessages = errors.map((err) => {
      return `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`;
    });
    logger.error('❌ Environment validation failed:');
    errorMessages.forEach((msg) => logger.error(`   - ${msg}`));
    throw new Error(
      `Environment validation failed: ${errorMessages.join('; ')}`,
    );
  }

  logger.log('✅ Environment variables validated successfully');
  return config;
}
