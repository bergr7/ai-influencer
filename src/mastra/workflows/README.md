# Test X MCP Workflow

A comprehensive Mastra workflow that tests the `x-mcp-server` tools including both home timeline and keyword search (suitable for free tier).

## What it does

This workflow sequentially tests all x-mcp-server capabilities:

1. **fetch-tweets (home)**: Fetches 5 recent tweets from your home timeline (accounts you follow)
2. **fetch-tweets (search)**: Searches for tweets with keywords "open source" and "model" (5 each)
3. **read-tweet**: Reads the full content of the first fetched tweet
4. **create-tweet**: Posts a simple test tweet
5. **repost-tweet**: Quote tweets the first fetched tweet

## Prerequisites

- X API credentials configured in `.env`:
  ```env
  X_API_KEY=your_api_key
  X_API_SECRET=your_api_secret
  X_ACCESS_TOKEN=your_access_token
  X_ACCESS_SECRET=your_access_token_secret
  ```

## Usage

### Running the Workflow

Simply run the workflow without any arguments:

```bash
npm run test-x-mcp
```

The workflow will:
- Fetch tweets from your authenticated user's home timeline
- Search for tweets using keywords
- Test all tools (fetch, search, read, create, repost) sequentially
- Display results and summaries

## What to Expect

The workflow will:
1. Fetch 5 tweets from your home timeline (newest first)
2. Search for 5 tweets matching "open source"
3. Search for 5 tweets matching "model"
4. Read details of the first tweet from home timeline
5. Create a test tweet with timestamp
6. Quote tweet the first fetched tweet (if available)

Each step logs its progress, and the final result includes a summary of all operations.

## Minimal API Usage

Designed for free tier accounts:
- Home timeline: 5 tweets (1 request)
- Search "open source": 5 tweets (1 request)
- Search "model": 5 tweets (1 request)
- Read 1 tweet (1 request)
- Create 1 tweet (1 request)
- Repost 1 tweet (1 request)
- Total: ~6 API calls per run

## Example Output

```
[info] Starting test-x-mcp-workflow...

🏠 Fetching from HOME TIMELINE (no query)
✅ Fetched 5 tweets from home timeline
📌 First tweet ID: 1234567890123456789

🔍 SEARCHING for keywords: "open source" and "model"
✅ Found 5 tweets for "open source"
✅ Found 5 tweets for "model"

✅ Read tweet: 1234567890123456789
✅ Created tweet: 9876543210987654321
✅ Reposted tweet: 1111111111111111111

[info] ✅ Workflow completed successfully!
[info] Summary: Workflow completed successfully. All tools tested: home timeline, search (2 queries), read, create, and repost.
```

## Troubleshooting

**Error: "No tweets fetched"**
- Make sure you follow at least one account on X
- Verify the accounts you follow have recent tweets
- Check that your X API credentials are correct

**Error: "Tool not found"**
- Ensure x-mcp-server dependencies are installed
- Verify `.env` has all required X API credentials

**Error: Rate limit exceeded**
- Wait for the rate limit window to reset (15 minutes)
- The free tier has 180 requests per 15 minutes for home timeline
