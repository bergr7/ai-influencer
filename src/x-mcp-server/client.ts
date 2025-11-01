import { TwitterApi } from 'twitter-api-v2';
import { logger } from './logger.js';

/**
 * X API v2 Client Singleton
 *
 * Initializes the Twitter API client with OAuth 2.0 User Context authentication.
 * This provides full read-write access to the X API including posting tweets,
 * retweeting, and reading timelines.
 *
 * Required environment variables:
 * - X_API_KEY: Your app's API key (consumer key)
 * - X_API_SECRET: Your app's API secret (consumer secret)
 * - X_ACCESS_TOKEN: User access token
 * - X_ACCESS_SECRET: User access token secret
 */

// Validate required environment variables
const requiredEnvVars = [
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_SECRET',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error({ envVar }, 'Missing required environment variable');
    throw new Error(
      `Missing required environment variable: ${envVar}. ` +
        `Please set it in your .env file or environment.`
    );
  }
}

// Initialize the Twitter API client with OAuth 1.0a User Context
// (OAuth 1.0a is used for user authentication, not OAuth 2.0 as initially planned)
logger.info('Initializing X API client');
export const xClient = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!,
});

// Export read-write client for v2 endpoints
export const xClientV2 = xClient.v2;
logger.info('X API client initialized successfully');
