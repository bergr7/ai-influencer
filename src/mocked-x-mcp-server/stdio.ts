#!/usr/bin/env node

/**
 * Mocked X MCP Server - Standard I/O Entry Point
 *
 * This is a MOCKED version that returns fake data instead of real X API calls.
 * Perfect for testing, development, and demos without consuming API rate limits.
 *
 * Tools provided:
 * - fetch-tweets: Get MOCK tweets from fake timeline or search
 * - read-tweet: Read MOCK tweet content
 * - repost-tweet: Create MOCK quote tweet
 * - create-tweet: Create MOCK tweet
 *
 * NO Authentication required - no API credentials needed!
 * Transport: stdio (for local use)
 */

import { MCPServer } from '@mastra/mcp';
import { fetchTweetsTool } from './tools/fetch-tweets';
import { readTweetTool } from './tools/read-tweet';
import { repostTweetTool } from './tools/repost-tweet';
import { createTweetTool } from './tools/create-tweet';
import { logger } from './logger';

// Create MCP server with all mocked X API tools
logger.info('Creating Mocked X MCP Server (fake data only, no real API calls)');
const server = new MCPServer({
  name: 'mocked-x-mcp-server',
  version: '1.0.0',
  tools: {
    fetchTweets: fetchTweetsTool,
    readTweet: readTweetTool,
    repostTweet: repostTweetTool,
    createTweet: createTweetTool,
  },
});
logger.info({ tools: ['fetchTweets', 'readTweet', 'repostTweet', 'createTweet'] }, 'Mocked MCP Server configured with tools');

// Start the server with stdio transport
logger.info('Starting Mocked MCP Server with stdio transport');
server
  .startStdio()
  .then(() => {
    logger.info('Mocked X MCP Server started successfully via stdio (no API credentials required!)');
  })
  .catch((error) => {
    logger.error({ error }, 'Failed to start Mocked X MCP Server');
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down Mocked X MCP Server');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down Mocked X MCP Server');
  process.exit(0);
});
