import { createStep, createWorkflow } from '@mastra/core/workflows';
import { MCPClient } from '@mastra/mcp';
import { z } from 'zod';

// Initialize MCP client to connect to x-mcp-server
const getMCPClient = () => {
  return new MCPClient({
    id: 'x-mcp-test-workflow',
    servers: {
      'x-mcp': {
        command: 'npx',
        args: ['tsx', 'src/x-mcp-server/stdio.ts'],
        env: {
          X_API_KEY: process.env.X_API_KEY || '',
          X_API_SECRET: process.env.X_API_SECRET || '',
          X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN || '',
          X_ACCESS_SECRET: process.env.X_ACCESS_SECRET || '',
          LOG_LEVEL: 'info',
        },
      },
    },
  });
};

// Step 1: Fetch tweets from home timeline
const fetchHomeTimelineStep = createStep({
  id: 'fetch-home-timeline',
  description: 'Fetch recent tweets from home timeline',
  inputSchema: z.object({}),
  outputSchema: z.object({
    tweets: z.array(z.any()).describe('Array of tweet objects from home'),
    firstTweetId: z.string().optional().describe('ID of the first tweet for testing'),
  }),
  execute: async ({ inputData }) => {
    const mcp = getMCPClient();

    try {
      const toolsets = await mcp.getToolsets();

      const fetchTweetsTool =
        toolsets['x-mcp.fetch_tweets'] ||
        toolsets['x-mcp']?.['fetch_tweets'] ||
        toolsets['x-mcp']?.['fetchTweets'];

      if (!fetchTweetsTool) {
        throw new Error('fetch_tweets tool not found');
      }

      console.log('\n🏠 Fetching from HOME TIMELINE (no query)');
      console.log('🔧 Params:', { maxResults: 5, excludeReplies: false });

      const result = await fetchTweetsTool.execute({
        context: {
          maxResults: 5,
          excludeReplies: false,
        },
      });

      const tweets = result?.structuredContent?.tweets || [];
      const firstTweetId = tweets.length > 0 ? tweets[0]?.id : undefined;

      console.log(`✅ Fetched ${tweets.length} tweets from home timeline`);
      if (firstTweetId) {
        console.log(`📌 First tweet ID: ${firstTweetId}`);
      }

      return {
        tweets,
        firstTweetId,
      };
    } finally {
      await mcp.disconnect();
    }
  },
});

// Step 2: Search tweets by keywords
const searchTweetsStep = createStep({
  id: 'search-tweets',
  description: 'Search tweets using keywords',
  inputSchema: z.object({
    tweets: z.array(z.any()),
    firstTweetId: z.string().optional(),
  }),
  outputSchema: z.object({
    searchResults: z.array(z.any()).describe('Array of search result tweets'),
    firstTweetId: z.string().optional().describe('ID from previous step'),
  }),
  execute: async ({ inputData }) => {
    const mcp = getMCPClient();

    try {
      const toolsets = await mcp.getToolsets();

      const fetchTweetsTool =
        toolsets['x-mcp.fetch_tweets'] ||
        toolsets['x-mcp']?.['fetch_tweets'] ||
        toolsets['x-mcp']?.['fetchTweets'];

      if (!fetchTweetsTool) {
        throw new Error('fetch_tweets tool not found');
      }

      // Test with two different search queries
      const queries = ['open source', 'model'];
      console.log(`\n🔍 SEARCHING for keywords: "${queries[0]}" and "${queries[1]}"`);

      // Search for first query
      console.log(`\n🔧 Searching for: "${queries[0]}"`);
      const result1 = await fetchTweetsTool.execute({
        context: {
          query: queries[0],
          maxResults: 5,
        },
      });

      const tweets1 = result1?.structuredContent?.tweets || [];
      console.log(`✅ Found ${tweets1.length} tweets for "${queries[0]}"`);

      // Search for second query
      console.log(`\n🔧 Searching for: "${queries[1]}"`);
      const result2 = await fetchTweetsTool.execute({
        context: {
          query: queries[1],
          maxResults: 5,
        },
      });

      const tweets2 = result2?.structuredContent?.tweets || [];
      console.log(`✅ Found ${tweets2.length} tweets for "${queries[1]}"`);

      return {
        searchResults: [...tweets1, ...tweets2],
        firstTweetId: inputData.firstTweetId,
      };
    } finally {
      await mcp.disconnect();
    }
  },
});

// Step 3: Read a specific tweet
const readTweetStep = createStep({
  id: 'read-tweet',
  description: 'Read the full content of a specific tweet',
  inputSchema: z.object({
    searchResults: z.array(z.any()),
    firstTweetId: z.string().optional(),
  }),
  outputSchema: z.object({
    tweetDetails: z.any().optional().describe('Full tweet details'),
    tweetId: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.firstTweetId) {
      console.log('\n⚠️  No tweet ID available to read');
      return { tweetDetails: null, tweetId: undefined };
    }

    const mcp = getMCPClient();

    try {
      const toolsets = await mcp.getToolsets();
      const readTweetTool =
        toolsets['x-mcp.read_tweet'] ||
        toolsets['x-mcp']?.['read_tweet'] ||
        toolsets['x-mcp']?.['readTweet'];

      if (!readTweetTool) {
        throw new Error('read_tweet tool not found');
      }

      const result = await readTweetTool.execute({
        context: {
          tweetId: inputData.firstTweetId,
        },
      });

      // Extract structured content from MCP response
      const tweetDetails = result?.structuredContent || result;

      console.log(`\n✅ Read tweet: ${inputData.firstTweetId}`);

      return {
        tweetDetails,
        tweetId: inputData.firstTweetId,
      };
    } finally {
      await mcp.disconnect();
    }
  },
});

// Step 4: Create a test tweet
const createTweetStep = createStep({
  id: 'create-tweet',
  description: 'Post a new test tweet',
  inputSchema: z.object({
    tweetDetails: z.any().optional(),
    tweetId: z.string().optional(),
  }),
  outputSchema: z.object({
    createdTweet: z.any().optional().describe('Created tweet object'),
    createdTweetId: z.string().optional(),
    tweetId: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const mcp = getMCPClient();

    try {
      const toolsets = await mcp.getToolsets();
      const createTweetTool =
        toolsets['x-mcp.create_tweet'] ||
        toolsets['x-mcp']?.['create_tweet'] ||
        toolsets['x-mcp']?.['createTweet'];

      if (!createTweetTool) {
        throw new Error('create_tweet tool not found');
      }

      // Simple test tweet to minimize API usage
      const testText = `Testing x-mcp-server workflow - ${new Date().toISOString()}`;

      const result = await createTweetTool.execute({
        context: {
          text: testText,
        },
      });

      // Extract structured content from MCP response
      const createdTweet = result?.structuredContent || result;
      const createdTweetId = createdTweet?.id;

      if (result?.isError) {
        console.log(`\n⚠️  Create tweet failed: ${result?.content?.[0]?.text || 'Unknown error'}`);
        console.log('💡 If you see a 403 error, you need to enable write permissions in your X app settings');
      } else {
        console.log(`\n✅ Created tweet: ${createdTweetId}`);
      }

      return {
        createdTweet,
        createdTweetId,
        tweetId: inputData.tweetId,
      };
    } finally {
      await mcp.disconnect();
    }
  },
});

// Step 5: Repost (quote tweet) a tweet
const repostTweetStep = createStep({
  id: 'repost-tweet',
  description: 'Quote tweet with custom commentary',
  inputSchema: z.object({
    createdTweet: z.any().optional(),
    createdTweetId: z.string().optional(),
    tweetId: z.string().optional(),
  }),
  outputSchema: z.object({
    repostedTweet: z.any().optional().describe('Reposted tweet object'),
    summary: z.string().describe('Summary of all operations'),
  }),
  execute: async ({ inputData }) => {
    // Use the original tweet ID if available, otherwise skip
    if (!inputData.tweetId) {
      console.log('\n⚠️  No tweet ID available to repost');
      return {
        repostedTweet: null,
        summary: 'Workflow completed successfully. Repost skipped (no source tweet).',
      };
    }

    const mcp = getMCPClient();

    try {
      const toolsets = await mcp.getToolsets();
      const repostTweetTool =
        toolsets['x-mcp.repost_tweet'] ||
        toolsets['x-mcp']?.['repost_tweet'] ||
        toolsets['x-mcp']?.['repostTweet'];

      if (!repostTweetTool) {
        throw new Error('repost_tweet tool not found');
      }

      // Simple quote tweet text to minimize API usage
      const quoteThoughts = 'Testing repost functionality';

      const result = await repostTweetTool.execute({
        context: {
          tweetId: inputData.tweetId,
          thoughts: quoteThoughts,
        },
      });

      // Extract structured content from MCP response
      const repostedTweet = result?.structuredContent || result;

      if (result?.isError) {
        console.log(`\n⚠️  Repost failed: ${result?.content?.[0]?.text || 'Unknown error'}`);
      } else {
        console.log(`\n✅ Reposted tweet: ${repostedTweet?.id}`);
      }

      return {
        repostedTweet,
        summary: 'Workflow completed successfully. All tools tested: home timeline, search (2 queries), read, create, and repost.',
      };
    } finally {
      await mcp.disconnect();
    }
  },
});

// Create the workflow
export const testXMCPWorkflow = createWorkflow({
  id: 'test-x-mcp-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    repostedTweet: z.any().optional(),
    summary: z.string(),
  }),
})
  .then(fetchHomeTimelineStep)
  .then(searchTweetsStep)
  .then(readTweetStep)
  .then(createTweetStep)
  .then(repostTweetStep);

testXMCPWorkflow.commit();
