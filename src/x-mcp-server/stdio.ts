#!/usr/bin/env node

/**
 * X MCP Server - Standard I/O Entry Point
 *
 * This MCP server exposes X API v2 functionality through four tools:
 * - fetch-tweets: Get tweets from a user's timeline
 * - read-tweet: Read full content of a specific tweet
 * - repost-tweet: Quote tweet with commentary
 * - create-tweet: Post a new tweet
 *
 * Authentication: OAuth 1.0a User Context (requires environment variables)
 * Transport: stdio (for local use)
 */

import { MCPServer } from '@mastra/mcp';
import { fetchTweetsTool } from './tools/fetch-tweets';
import { readTweetTool } from './tools/read-tweet';
import { repostTweetTool } from './tools/repost-tweet';
import { createTweetTool } from './tools/create-tweet';
import { logger } from './logger';

// Create MCP server with all X API tools
logger.info('Creating X MCP Server');
const server = new MCPServer({
  name: 'x-mcp-server',
  version: '1.0.0',
  tools: {
    fetchTweets: fetchTweetsTool,
    readTweet: readTweetTool,
    repostTweet: repostTweetTool,
    createTweet: createTweetTool,
  },
});
logger.info({ tools: ['fetchTweets', 'readTweet', 'repostTweet', 'createTweet'] }, 'MCP Server configured with tools');

// Start the server with stdio transport
logger.info('Starting MCP Server with stdio transport');
server
  .startStdio()
  .then(() => {
    logger.info('X MCP Server started successfully via stdio');
  })
  .catch((error) => {
    logger.error({ error }, 'Failed to start X MCP Server');
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down X MCP Server');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down X MCP Server');
  process.exit(0);
});
