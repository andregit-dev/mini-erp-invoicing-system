import { plainToClass } from 'class-transformer';
import { IsString, IsEnum, IsNotEmpty, validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';

export enum NodeEnv {
  DEV = 'DEV',
  STG = 'STG',
  PROD = 'PROD',
}

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsEnum(NodeEnv, {
    message: 'NODE_ENV must be one of: DEV, STG, PROD',
  })
  NODE_ENV: NodeEnv = NodeEnv.DEV;
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
