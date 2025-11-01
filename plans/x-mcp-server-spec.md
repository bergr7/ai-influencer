# X API v2 MCP Server Specification

## Overview
Create an MCP (Model Context Protocol) server that exposes X API v2 functionality using Mastra and the `twitter-api-v2` Node.js library with OAuth 2.0 User Context authentication.

## Goals
- Provide a reusable MCP server for X/Twitter operations
- Enable AI agents to interact with X API v2
- Support both reading and writing operations
- Follow Mastra patterns and best practices

## Tools to Implement

### 1. `fetch_tweets`
**Purpose**: Fetch tweets from authenticated user's home timeline OR search by keywords

**Input**:
- `query` (string, optional): Search keywords. If provided, searches recent tweets (last 7 days). If empty/omitted, fetches home timeline
- `maxResults` (number, optional, default: 5): Number of tweets to fetch (5-20)
- `excludeReplies` (boolean, optional, default: false): Exclude reply tweets (home timeline only)

**Output**:
- Array of tweets with truncated content and metadata:
  - `id`: Tweet ID
  - `text`: Tweet text (truncated to 280 chars)
  - `author_id`: Author user ID
  - `created_at`: Creation timestamp
  - `public_metrics`: Engagement metrics (likes, retweets, replies, etc.)
- Tweets returned in reverse chronological order (newest first)

**Implementation Notes**:
- If `query` provided: Use `client.v2.search()` endpoint (searches last 7 days)
- If `query` empty: Use `client.v2.homeTimeline()` endpoint (tweets from followed accounts)
- Returns truncated content, not full content
- Supports pagination via maxResults
- Tweets ordered newest to oldest

### 2. `read_tweet`
**Purpose**: Read full content of a tweet and format it in an agent-readable format

**Input**:
- `tweetId` (string, required): ID of the tweet to read

**Output**:
- Formatted tweet object:
  - `id`: Tweet ID
  - `text`: Full tweet text
  - `author`: Author information (name, username, id)
  - `created_at`: Creation timestamp
  - `metrics`: Public metrics (likes, retweets, replies, quotes, views)
  - `media`: Array of media URLs (if present)
  - `urls`: Array of expanded URLs (if present)
  - `referenced_tweets`: Info about quoted/replied tweets (if present)

**Implementation Notes**:
- Use `client.v2.singleTweet()` with expansions
- Include `tweet.fields`, `user.fields`, `media.fields`, `expansions`
- Format response for easy agent consumption

### 3. `repost_tweet`
**Purpose**: Repost (quote tweet) a tweet with the user's own thoughts

**Input**:
- `tweetId` (string, required): ID of the tweet to quote
- `thoughts` (string, required): User's commentary (max 280 chars combined with quote)

**Output**:
- Result object:
  - `id`: New tweet ID
  - `text`: Text of the created quote tweet
  - `quoted_tweet_id`: ID of the original tweet

**Implementation Notes**:
- Use `client.v2.quote()` endpoint
- Validate text length (accounting for quote attachment)
- Requires write permissions

### 4. `create_tweet`
**Purpose**: Create a new tweet in the user profile with specific content

**Input**:
- `text` (string, required): Tweet content (max 280 characters)

**Output**:
- Result object:
  - `id`: Created tweet ID
  - `text`: Text of the created tweet

**Implementation Notes**:
- Use `client.v2.tweet()` endpoint
- Validate text length (max 280 chars for standard accounts)
- Requires write permissions

## Project Structure

```
src/
- x-mcp-server/
  -  stdio.ts              # MCP server entry point (stdio transport)
  -  client.ts             # X API client wrapper with authentication
  -  tools/
    -   fetch-tweets.ts   # Tool: Fetch user timeline tweets
    -   read-tweet.ts     # Tool: Read full tweet content
    -   repost-tweet.ts   # Tool: Quote tweet with thoughts
    -   create-tweet.ts   # Tool: Create new tweet
  -  logger.ts           # Logger for MCP server
  -  types.ts            # TypeScript type definitions
```

## Technical Decisions

### Authentication: OAuth 2.0 User Context
- **Method**: OAuth 2.0 with User Context
- **Rationale**: Provides full read-write access for posting tweets, retweeting, etc.
- **Credentials Required**:
  - `X_API_KEY` (App Key)
  - `X_API_SECRET` (App Secret)
  - `X_ACCESS_TOKEN` (User Access Token)
  - `X_ACCESS_SECRET` (User Access Secret)

### X API Library: `twitter-api-v2`
- **Package**: `twitter-api-v2` by @plhery
- **Version**: Latest stable
- **Rationale**:
  - Most popular Node.js library for X API v2 (Trust Score: 8.9)
  - 490 code snippets available in documentation
  - Strongly typed with TypeScript
  - Full v2 API coverage including streaming and pagination
  - Active maintenance and community support

### MCP Transport: stdio (Local Use)
- **Transport**: Standard I/O (stdio)
- **Deployment**: Local use only (not published to NPM)
- **Rationale**: Simpler setup for local development and testing

### Framework: Mastra MCP
- **Package**: `@mastra/mcp`
- **Pattern**: Using `createTool()` for tool definitions

## Environment Variables

Create `.env.example`:

```
# X API v2 Credentials (OAuth 2.0 User Context)
X_API_KEY=your_app_key_here
X_API_SECRET=your_app_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_SECRET=your_access_secret_here
```

>Note: You would need to create an app and project in X Developer Portal to get the credentials.

## X API v2 Endpoints Reference

### Home Timeline & Search (fetch_tweets)

**Home Timeline Mode** (no query):
- **Endpoint**: `GET /2/users/:id/timelines/reverse_chronological`
- **Rate Limit**: 180 requests per 15 min (User context, free tier)
- **Parameters**: `max_results`, `tweet.fields`, `expansions`, `exclude`
- **Returns**: Tweets from followed accounts in reverse chronological order (newest first)

**Search Mode** (with query):
- **Endpoint**: `GET /2/tweets/search/recent`
- **Rate Limit**: 180 requests per 15 min (User context, free tier)
- **Parameters**: `query`, `max_results`, `tweet.fields`, `expansions`
- **Returns**: Recent tweets (last 7 days) matching search query in reverse chronological order (newest first)

### Tweet Lookup (read_tweet)
- **Endpoint**: `GET /2/tweets/:id`
- **Rate Limit**: 300 requests per 15 min (App), 900 per 15 min (User)
- **Parameters**: `tweet.fields`, `expansions`, `user.fields`, `media.fields`

### Quote Tweet (repost_tweet)
- **Endpoint**: `POST /2/tweets`
- **Rate Limit**: 200 tweets per 15 min per user
- **Body**: `text`, `quote_tweet_id`

### Create Tweet (create_tweet)
- **Endpoint**: `POST /2/tweets`
- **Rate Limit**: 200 tweets per 15 min per user
- **Body**: `text`

## Future Enhancements (Out of Scope)

- Media upload support
- Search functionality
- List management
- Direct messages
- Streaming support
- Rate limit tracking and automatic throttling
- Publishing to NPM