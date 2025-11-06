import { Agent } from "@mastra/core/agent";
import { Memory } from '@mastra/memory';
import { openai } from '@ai-sdk/openai';
import { MCPClient } from '@mastra/mcp';
import { TokenLimiter, ToolCallFilter } from "@mastra/memory/processors";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import * as path from 'path';
import { createTweetTool } from '../../mocked-x-mcp-server/tools/create-tweet.js';
import { repostTweetTool } from '../../mocked-x-mcp-server/tools/repost-tweet.js';

// Helper function to resolve paths correctly whether running from source or bundled
function relativeFromRoot(pathString: string) {
  // Check if we're running from the bundled .mastra directory
  if (import.meta.url.includes('.mastra')) {
    // When bundled, go back to the project root from .mastra/output
    return path.join(process.cwd(), '../../', pathString);
  }
  // When running from source, use the current working directory
  return path.join(process.cwd(), pathString);
}

// Initialize X MCP Client with correct path resolution
const MCP_SERVER_PATH = relativeFromRoot('src/mocked-x-mcp-server/stdio.ts');

const xMcpClient = new MCPClient({
  id: 'x-mcp-client',
  servers: {
    'x-mcp-mock': {
      command: 'npx',
      args: ['-y', 'tsx', MCP_SERVER_PATH],
      env: {
        LOG_LEVEL: 'info',
      },
    },
  },
});

const systemPrompt = `
You are the AI Influencer Agent for X (Twitter).

Mission
- Discover timely, high-signal tweets about AI agents, LLMs, tool use, MCP, and developer workflows.
- Summarize relevance and propose concise, on-brand content options: Original, Quote (repost with commentary), or Reply.

MCP Tooling (server id: x-mcp-mock)
- Use these tools when available (prefer snake_case ids; camelCase may exist in some clients):
  - fetch_tweets: Discovery. Inputs: query (optional), maxResults (5–20, default 5), excludeReplies.
    • No query → fetch home timeline; with query → recent search.
    • Returns truncated text + metadata, newest first.
  - read_tweet: Deep read. Input: tweetId. Returns full text, author, metrics, media, URLs, referenced tweets.
  - create_tweet: Post original. Input: text (1–280 chars). Output: id, text.
  - repost_tweet: Quote a tweet. Inputs: tweetId, thoughts (<=280 chars). Output: id, text, quoted_tweet_id.

Operating Principles
- Discovery first: Use fetch_tweets with targeted queries like "AI agents", "agentic workflows", "tool use", "LLMs", "MCP", "Mastra" (maxResults 5–10).
- Safety: Avoid unverified claims, sensitive content, and personal attacks. If uncertain, ask a clarifying question.
- Resilience: If tools fail or return empty, try an alternative query or source and explain the limitation briefly.

Default Workflow
1) Discovery → fetch_tweets (timeline or search), read_tweet to get full context for shortlisted items. Then select the 2-3 most promising items.
2) Drafting → When the user asks you to do so, produce 2–3 options (Original/Quote/Reply). For Quote/Reply, include the target tweetId.
3) Refinement → When the user asks you to do so, refine the drafts based on the user's feedback.
4) Execution → When the user asks you to do so, use create_tweet for originals or repost_tweet for quotes. For replies, post appropriately per product capabilities.
`;

// Get read-only tools from MCP client
const mcpTools = await xMcpClient.getTools();

// Filter out posting tools from MCP (we'll use direct imports instead)
const readOnlyMcpTools = Object.fromEntries(
  Object.entries(mcpTools).filter(([key]) =>
    !key.includes('createTweet') && !key.includes('repostTweet')
  )
);

// Combine MCP tools with directly imported posting tools
// Direct imports have suspend/resume support, MCP tools don't
const tools = {
  ...readOnlyMcpTools,
  // Override with direct imports that support suspend/resume
  'x-mcp-mock_createTweet': createTweetTool,
  'x-mcp-mock_repostTweet': repostTweetTool,
};

export const aiInfluencerAgent = new Agent({
  name: "ai-influencer-agent",
  instructions: {
    role: 'system',
    content: systemPrompt,
    providerOptions: {
      openai: {
        verbosity: 'low'
      }
    }
  },
  model: "openai/gpt-5-mini",
  tools,
  memory: new Memory({
    processors: [
      new ToolCallFilter({
        exclude: ['fetch_tweets', 'read_tweet'],
      }),
      new TokenLimiter({
        limit: 200000,
        encoding: o200k_base,
      }),
    ],
    options: {
      threads: {
        generateTitle: {
          model: openai('gpt-5-nano'),
          instructions: 'Generate a concise title based on the user message and the thread context.',
        }
      },
      workingMemory: {
        enabled: true
      },
    },
  })
});