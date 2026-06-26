import { plainToClass } from 'class-transformer';
import { IsString, IsEnum, IsNotEmpty, validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';

/**
 * Standard NODE_ENV values (follows Node.js convention):
 * - development: Local development
 * - production: Production environment
 * - test: Testing environment
 * - staging: Staging/QA environment (optional)
 *
 * Defaults to 'development' if not set
 */
export enum NodeEnv {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsEnum(NodeEnv, {
    message: `NODE_ENV must be one of: ${Object.values(NodeEnv).join(', ')}`,
  })
  NODE_ENV: NodeEnv = NodeEnv.DEVELOPMENT;
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

  logger.log(`✅ Environment: ${config.NODE_ENV}`);
  return config;
}
