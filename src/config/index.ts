import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration schema using Zod for validation
 * This ensures all required environment variables are present and valid
 */
const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DEBUG: z.coerce.boolean().default(false),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // EvolutionAPI (optional - only needed for server/worker)
  AUTHENTICATION_API_KEY: z.string().min(1).optional(),
  EVOLUTION_API_BASE_URL: z.string().url().default('http://evolution-api:8080'),
  EVOLUTION_API_INSTANCE_NAME: z.string().default('protein'),

  // Optional: Webhooks
  SERVER_URL: z.string().url().optional(),
  WEBHOOK_GLOBAL_URL: z.string().url().optional(),
});

/**
 * Type-safe configuration object
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Validated configuration
 * Throws an error with detailed messages if validation fails
 */
let config: Config;

// Helper to convert empty strings to undefined for optional fields
const env = (key: string): string | undefined => {
  const value = process.env[key];
  return value === '' ? undefined : value;
};

try {
  config = configSchema.parse({
    NODE_ENV: env('NODE_ENV'),
    PORT: env('PORT'),
    DEBUG: env('DEBUG'),
    DATABASE_URL: env('DATABASE_URL'),
    REDIS_URL: env('REDIS_URL'),
    REDIS_HOST: env('REDIS_HOST'),
    REDIS_PORT: env('REDIS_PORT'),
    OPENAI_API_KEY: env('OPENAI_API_KEY'),
    AUTHENTICATION_API_KEY: env('AUTHENTICATION_API_KEY'),
    EVOLUTION_API_BASE_URL: env('EVOLUTION_API_BASE_URL'),
    EVOLUTION_API_INSTANCE_NAME: env('EVOLUTION_API_INSTANCE_NAME'),
    SERVER_URL: env('SERVER_URL'),
    WEBHOOK_GLOBAL_URL: env('WEBHOOK_GLOBAL_URL'),
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map((err) => {
      const path = err.path.join('.');
      return `  - ${path}: ${err.message}`;
    });
    
    console.error('❌ Configuration validation failed:');
    console.error(errorMessages.join('\n'));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  throw error;
}

/**
 * Export validated configuration
 * This is the single source of truth for all configuration values
 */
export default config;

/**
 * Helper function to check if running in development
 */
export const isDevelopment = () => config.NODE_ENV === 'development';

/**
 * Helper function to check if running in production
 */
export const isProduction = () => config.NODE_ENV === 'production';

/**
 * Helper function to check if debug mode is enabled
 */
export const isDebug = () => config.DEBUG;

