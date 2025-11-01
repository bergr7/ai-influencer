import pino from 'pino';

/**
 * Logger configuration for Mocked X MCP Server
 *
 * Uses pino for structured logging with stderr output
 * (stdout is reserved for MCP protocol messages)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
      destination: 2, // stderr (2) to avoid interfering with stdio MCP protocol
    },
  },
});
