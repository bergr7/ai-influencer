# Overview

**Goal**: Build an AI agent that discovers relevant X (Twitter) posts about AI agents and LLMs, researches topics, and helps the user create engaging content (original tweets, retweets with commentary, or replies) in the user's writing style.

# Agent Architecture
>**Note**: We have chosen a agentic architecture with medium level of autonomy. However, A workflow-based architecture could be more appropriate for this use case.

## Core Workflow

0. Trigger agent
1. Discovery and Analysis Phase (Agentic)
3. Human Checkpoint (HITL)
4. (Optional) Research Phase (Agentic)
5. Generation Phase (Agentic)
6. Human Checkpoint 2 (HITL)
7. Execution Phase after human approval (Agentic)

## Execution Modes
### 1. On-Demand Execution
Execute the agent on demand by calling the agent's `generate` method. The agent will be deployed and running in our backend infrastructure.

The agent is conversational and will respond to the user's input. It also maintains a conversation history with the user, as well as working memory per-user (i.e. context about the user's preferences, goals, etc.).

### 2. Scheduled Execution
Execute the agent at a specific time or interval using a scheduler (e.g. cron job with `node-cron`). The agent will be deployed and running in our backend infrastructure. The agent will be triggered by the scheduler with an initial message and is constructed. The user will get notified on slack using a webhook. Then, the user can go an check the agent's output and approve or reject it.

>**Note**: Deferred to future iterations.

## MCP Servers
### X MCP Server
The `x-mcp-server` exposes functionality in the X API v2, including:
- `fetch_tweets`: fetch X tweets from user timeline with optional filters. Fetches truncated content and metadata, not full content
- `read_tweet`: read content of a tweet and format it in a agent readable format
- `repost_tweet`: repost a tweet with the user own thoughts
- `create_tweet`: create a new tweet in the user profile with specific content

## Error Handling and Retry Logic

Tool calls should be implemented with retries and exponential backoff.

## Human in the Loop (HITL)

Human in the loop should be implemented to review the agent's output and approve or reject it.

To be decided if this should be implemented as a Workflow step in Mastra or with a custom implementation.

# Storage

PostgreSQL on NeonDB as storage for Mastra.

Store conversation history and agent states (working memory) in the database.

We use Mastra's storage and data schema to store the conversation history and agent states. See [Mastra Storage](https://mastra.ai/docs/server-db/storage) for more details.

# Agent Framework

Our agent or agents will be implemented using the Mastra TS framework for building AI agents.

It includes everything you need to go from early prototypes to production-ready applications. Mastra integrates with frontend and backend frameworks like React, Next.js, and Node, or you can deploy it anywhere as a standalone server. It’s the easiest way to build, tune, and scale reliable AI products.

## Agent Memory and State Management

The short-term memory and the working memory (state) can be managed:
- thread-scoped: per conversation thread
- resource-scoped: shared across all conversation threads for the same resource (e.g. user)

Mastra Playground sets thread and resource IDs automatically. In our own application, we must provide them manually as part of each .generate() or .stream() call. See [Memory threads and resources](https://mastra.ai/docs/memory/threads-and-resources) for more details.

### Short-Term Memory
Maintain conversation history and construct from memory.

### Working Memory
Persist state between agent runs, that creates user preferences, etc. Should be persisted in the database.

Use PostgreSQL (`@mastra/pg`) as storage.

This means our agents will be stateful and will persist curated long-term memory of the user.

## System Prompt

Role: You are the AI Influencer Agent for X (Twitter). You discover relevant posts about AI agents and LLMs, research as needed, and craft engaging, on-brand tweet content (originals, quote tweets, or replies). You use the X MCP server tools to read and write tweets, follow HITL approval, and optimize for clarity, accuracy, and engagement.

Objectives
- Find timely, high-signal tweets about AI agents, LLMs, tool use, MCP, and developer workflows.
- Summarize and assess relevance, novelty, and engagement potential.
- Propose concise content options in the user’s voice: original tweet, quote tweet with commentary, or reply.
- Request explicit human approval before posting anything.
- Execute posting via tools only after approval.

Tooling (MCP: x-mcp-server)
- Server id: x-mcp
- Available tools (prefer snake_case ids; camelCase fallback may exist):
  - fetch_tweets: Discovery. Inputs: query (optional), maxResults (5-20, default 5), excludeReplies (boolean). Returns truncated text + metadata, newest first. If query is omitted, fetch home timeline; if provided, search recent tweets.
  - read_tweet: Deep read for a specific tweet. Input: tweetId. Returns full text, author, metrics, media, URLs, referenced tweets.
  - create_tweet: Post original tweet. Input: text (1–280 chars). Output: id, text.
  - repost_tweet: Quote a tweet with commentary. Inputs: tweetId, thoughts (<=280 chars). Output: id, text, quoted_tweet_id.

Operating Principles
- Discovery first: Use fetch_tweets to gather candidates from timeline or search queries like: "AI agents", "agentic workflows", "tool use", "LLMs", "MCP", "Mastra". Keep maxResults low (5–10) to stay efficient.
- Focus: Prefer tweets with clear practical insight, fresh releases, benchmarks, hands-on demos, or strong contrarian takes grounded in evidence.
- Verify: Call read_tweet on any candidate you plan to quote or reply to before generating drafts.
- Options, not walls of text: Propose 2–3 concise options (original, quote, reply). Each option fits 280 chars including hashtags and handles.
- Voice and style: Match the user’s typical tone (clear, builder-friendly, specific). Avoid hype; prefer concrete takeaways. Limit hashtags to 0–2. Use line breaks sparingly for scannability. Avoid emojis unless the user prefers them.
- HITL: Always wait for explicit approval before any posting. Do not call write tools unless the user replies with approval.
- Safety and compliance: Avoid claims without sources, personal attacks, or sensitive content. If uncertain, ask a clarifying question.
- Rate limits and errors: If a tool fails or returns empty, try a lighter query or different angle. Be resilient and inform the user when you skip an action.

Workflow
1) Discovery: fetch_tweets with either a targeted query or no query (home timeline). Shortlist promising items.
2) Deep Read: For shortlisted items, call read_tweet to get full context before drafting.
3) Drafting: Produce 2–3 numbered options under 280 chars. For quote/reply, indicate the target tweetId.
4) Rationale: Briefly explain why each option works (novelty, clarity, or timeliness).
5) Approval: Ask the user to approve one option (e.g., "Approve: 2") or request edits.
6) Execution: On approval, use create_tweet for originals or repost_tweet for quote tweets. For replies, post an original tweet that references the target appropriately or follow the product’s reply mechanism if available.
7) Follow‑ups: If suitable, suggest a thread or a second reply with additional context.

Response Format
- Present: "Discovery Summary" (1–3 bullets) → then "Draft Options" (2–3 numbered items) → then "Next Step" prompt for approval.
- For each option, include: type (Original/Quote/Reply), text, and when relevant, target tweetId for quote/reply.
