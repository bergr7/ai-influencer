# Mocked X MCP Server

A **mocked version** of the X (Twitter) MCP Server that returns fake data instead of making real API calls. Perfect for testing, development, and demos without consuming API rate limits or requiring X API credentials.

## Why Use the Mocked Server?

✅ **No Rate Limits** - Test as much as you want
✅ **No API Credentials** - Works without X API keys
✅ **Fast & Reliable** - Instant responses with predictable data
✅ **Same Interface** - Drop-in replacement for the real server
✅ **Safe Testing** - Won't post real tweets or consume quotas

## Features

All four tools from the real X MCP server, but with fake data:

- **Fetch Tweets**: Returns mock tweets from fake timeline or search results
- **Read Tweet**: Returns detailed mock tweet data for any ID
- **Create Tweet**: Simulates creating a tweet (returns fake ID)
- **Repost Tweet**: Simulates quote tweeting (returns fake quote tweet)

## Quick Start

### No Configuration Required!

Unlike the real X MCP server, you don't need any environment variables or API credentials.

### Run the Server

```bash
npx tsx src/mocked-x-mcp-server/stdio.ts
```

The server will start and provide the same MCP interface as the real server, but with mock data.

## Tools

### fetch-tweets (mocked)
Returns fake tweets from mock timeline or search.

**Input:**
- `query` (string, optional): Search keywords (e.g., "open source", "AI model")
- `maxResults` (number): 5-20 tweets to fetch (default: 5)
- `excludeReplies` (boolean): Filter out replies (default: false)

**Output:** Array of mock tweets with realistic metadata

**Examples:**
- Home timeline: `{ maxResults: 10 }`
- Search: `{ query: "open source", maxResults: 5 }`

### read-tweet (mocked)
Returns fake detailed tweet data for any tweet ID.

**Input:**
- `tweetId` (string): Any tweet ID (all IDs work in mock mode)

**Output:** Complete mock tweet details including author, metrics, etc.

### create-tweet (mocked)
Simulates creating a tweet. Returns fake tweet ID.

**Input:**
- `text` (string): Tweet content (1-280 characters)

**Output:** Fake created tweet with mock ID

### repost-tweet (mocked)
Simulates quote tweeting. Returns fake quote tweet.

**Input:**
- `tweetId` (string): Tweet ID to quote (any ID works)
- `thoughts` (string): Your commentary (max 280 characters)

**Output:** Fake quote tweet with mock ID

## Mock Data Characteristics

- **Realistic**: Mock tweets use realistic text, authors, and metrics
- **Deterministic**: Same inputs produce consistent outputs
- **Varied**: Different tweets for home vs search, multiple authors
- **Search-aware**: Search results filter by keywords when possible

## Configuration for MCP Clients

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "mocked-x-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "src/mocked-x-mcp-server/stdio.ts"]
    }
  }
}
```

No `env` section needed - no credentials required!

## Example Usage in Workflows

Use it exactly like the real server:

```typescript
import { MCPClient } from '@mastra/mcp';

const mcp = new MCPClient({
  servers: {
    'mocked-x-mcp': {
      command: 'npx',
      args: ['tsx', 'src/mocked-x-mcp-server/stdio.ts'],
    },
  },
});

// All tools work the same way
const toolsets = await mcp.getToolsets();
const fetchTweets = toolsets['mocked-x-mcp']?.['fetch_tweets'];
const result = await fetchTweets.execute({
  context: { query: 'AI', maxResults: 5 }
});
```

## Differences from Real Server

| Feature | Real Server | Mocked Server |
|---------|------------|---------------|
| API Calls | ✅ Real X API | ❌ Fake data only |
| Credentials | ✅ Required | ❌ Not required |
| Rate Limits | ✅ Limited | ❌ Unlimited |
| Real Tweets | ✅ Posts live | ❌ Simulated only |
| Response Time | ~1-2s | <100ms |
| Data Variety | ✅ Real variety | ⚠️ Limited pool |

## When to Use Each

**Use Mocked Server For:**
- Local development and testing
- CI/CD pipelines
- Demos and presentations
- Learning and experimentation
- Avoiding rate limits

**Use Real Server For:**
- Production deployments
- Actual social media posting
- Real data analysis
- Live integrations

## Architecture

```
src/mocked-x-mcp-server/
├── stdio.ts              # MCP server entry point
├── mock-client.ts        # Mock Twitter API client
├── mock-data.ts          # Fake data generators
├── logger.ts             # Logging configuration
├── types.ts              # Type definitions
└── tools/
    ├── fetch-tweets.ts   # Mock fetch tweets
    ├── read-tweet.ts     # Mock read tweet
    ├── create-tweet.ts   # Mock create tweet
    └── repost-tweet.ts   # Mock repost tweet
```

## Development

The mocked server is designed to be a drop-in replacement. To switch between mock and real:

1. Update `.mcp.json` to point to desired server
2. Restart your application
3. Same code works with both!

## License

Same as main repository.
