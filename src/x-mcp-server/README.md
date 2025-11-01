# X MCP Server

A Model Context Protocol (MCP) server that exposes the X (Twitter) API v2 functionality through Mastra, enabling AI agents to interact with X programmatically.

## Overview

This server bridges your AI applications with X's API, providing four core tools for reading and posting tweets. It uses OAuth 1.0a User Context authentication and communicates via the MCP stdio transport.

## Features

- **Fetch Tweets**: Retrieve tweets from your home timeline OR search by keywords with filtering options
- **Read Tweet**: Access full content of a specific tweet
- **Create Tweet**: Post new tweets to X
- **Repost Tweet**: Quote tweet with custom commentary
- **Structured Logging**: Pino-based logging to stderr (keeping stdout clean for MCP protocol)
- **Type Safety**: Full TypeScript support with Zod schema validation

## Quick Start

### Prerequisites

- Node.js 18+
- X API v2 credentials (API key, secret, access token, access token secret)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file with the following environment variables:

```env
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_token_secret
LOG_LEVEL=info  # optional: debug, info, warn, error
```

### Usage

Start the server:

```bash
npm run x-mcp
# or
node dist/x-mcp-server/stdio.js
```

The server will start listening on stdio and log to stderr. It's ready to accept MCP requests from connected clients.

## Tools

### fetch-tweets
Fetch tweets from your home timeline OR search by keywords. If query is provided, searches recent tweets (last 7 days). If query is empty, fetches from home timeline. Returns tweets in reverse chronological order (newest first).

**Input:**
- `query` (string, optional): Search keywords (e.g., "open source", "AI model")
- `maxResults` (number): 5-20 tweets to fetch (default: 5)
- `excludeReplies` (boolean): Filter out replies (default: false, home timeline only)

**Output:** Array of tweets with metadata (ID, text, author_id, created_at, engagement metrics)

**Examples:**
- Home timeline: `{ maxResults: 10 }`
- Search: `{ query: "open source", maxResults: 5 }`

### read-tweet
Read the full content of a specific tweet.

**Input:**
- `tweetId` (string): Tweet ID to read

**Output:** Complete tweet data including text, author, timestamps, and metrics

### create-tweet
Post a new tweet to X.

**Input:**
- `text` (string): Tweet content

**Output:** Created tweet object with ID and metadata

### repost-tweet
Quote tweet with custom commentary.

**Input:**
- `tweetId` (string): Tweet ID to quote
- `text` (string): Your quote/commentary

**Output:** Created quote tweet object

## Architecture

### File Structure

```
src/x-mcp-server/
├── stdio.ts          # Entry point and MCP server setup
├── client.ts         # X API v2 client initialization
├── logger.ts         # Pino logger configuration
├── types.ts          # TypeScript type definitions
└── tools/            # Tool implementations
    ├── fetch-tweets.ts
    ├── read-tweet.ts
    ├── create-tweet.ts
    └── repost-tweet.ts
```

### Key Components

- **client.ts**: Singleton Twitter API client with OAuth 1.0a authentication
- **logger.ts**: Structured logging using pino, configured to write to stderr to avoid interfering with MCP protocol on stdout
- **stdio.ts**: MCP server initialization and startup with graceful shutdown handling

## Authentication

Uses OAuth 1.0a User Context, which provides:
- Full read-write access to X API
- User context authentication (posts appear under your account)
- Access to user timeline, posting capabilities, and engagement metrics

## Environment

| Variable | Description | Required |
|----------|-------------|----------|
| `X_API_KEY` | Your app's API key (consumer key) | ✓ |
| `X_API_SECRET` | Your app's API secret (consumer secret) | ✓ |
| `X_ACCESS_TOKEN` | User access token | ✓ |
| `X_ACCESS_SECRET` | User access token secret | ✓ |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | ✗ |

## Development

### Running Locally

```bash
# Build
npm run build

# Start server
npm run x-mcp-server

# View logs
# Logs are written to stderr while MCP protocol uses stdout
```

### Debugging

Set the log level to debug:

```bash
LOG_LEVEL=debug npm run x-mcp-server
```

## Integration

This server is designed to be used with Mastra agents and workflows. Connect it to your Mastra applications by configuring it in your MCP client configuration.

## Error Handling

The server includes comprehensive error handling:
- Environment variable validation on startup
- API error handling with meaningful error messages
- Graceful shutdown on SIGINT/SIGTERM signals

## License

See repository root for license information.
