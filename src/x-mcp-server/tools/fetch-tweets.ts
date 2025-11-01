import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { xClientV2 } from '../client';
import type { APITweet } from '../types';

/**
 * Fetch Tweets Tool
 *
 * Fetches tweets from the authenticated user's home timeline OR searches by keywords.
 * - If query is provided: Searches recent tweets (last 7 days) matching keywords
 * - If query is empty: Fetches from home timeline (accounts you follow)
 * Returns tweets in reverse chronological order (newest first).
 * Returns truncated content (280 chars) and metadata - not full content.
 *
 * Use cases:
 * - Get recent tweets from your home feed
 * - Search for tweets by keywords
 * - Monitor timeline activity from followed accounts
 * - Find tweets about specific topics
 *
 * For full tweet content, use the read-tweet tool instead.
 */

export const fetchTweetsTool = createTool({
  id: 'fetch_tweets',
  description:
    'Fetch tweets from your home timeline OR search by keywords. If query is provided, searches recent tweets (last 7 days). If query is empty, fetches from home timeline. Returns tweets in reverse chronological order (newest first). Returns truncated content and metadata, not full tweet content.',
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe('Optional search query. If provided, searches tweets instead of fetching home timeline. Example: "open source" or "AI model"'),
    maxResults: z
      .number()
      .min(5)
      .max(20)
      .default(5)
      .describe('Number of tweets to fetch (5-20, default 5 to conserve API quota)'),
    excludeReplies: z
      .boolean()
      .default(false)
      .describe('Exclude reply tweets from results'),
  }),
  outputSchema: z.object({
    tweets: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        author_id: z.string(),
        created_at: z.string(),
        public_metrics: z.object({
          retweet_count: z.number(),
          reply_count: z.number(),
          like_count: z.number(),
          quote_count: z.number(),
          bookmark_count: z.number().optional(),
          impression_count: z.number().optional(),
        }),
      })
    ),
    meta: z.object({
      result_count: z.number(),
      next_token: z.string().optional(),
    }),
  }),
  execute: async ({ context }) => {
    const { query, maxResults, excludeReplies } = context;

    try {
      let tweets: APITweet[];
      let meta: { result_count: number; next_token?: string };

      if (query && query.trim() !== '') {
        // Search mode: Search recent tweets (last 7 days) matching the query
        const searchResults = await xClientV2.search(query, {
          max_results: maxResults,
          'tweet.fields': [
            'created_at',
            'author_id',
            'public_metrics',
            'text',
          ],
        });

        // search() returns a paginator - extract data properly
        // The paginator has the response in .data property which contains { data, meta }
        const responseData = searchResults.data || {};
        tweets = (responseData.data || []) as APITweet[];
        meta = responseData.meta || {
          result_count: tweets.length,
        };
      } else {
        // Home timeline mode: Fetch tweets from accounts you follow
        // Returns tweets in reverse chronological order (newest first)
        const timeline = await xClientV2.homeTimeline({
          max_results: maxResults,
          exclude: excludeReplies ? ['replies'] : undefined,
          'tweet.fields': [
            'created_at',
            'author_id',
            'public_metrics',
            'text',
          ],
        });

        tweets = (timeline.data.data || []) as APITweet[];
        meta = timeline.data.meta || {
          result_count: 0,
        };
      }

      return {
        tweets: tweets.map((tweet) => ({
          id: tweet.id,
          text: tweet.text || '',
          author_id: tweet.author_id || '',
          created_at: tweet.created_at || new Date().toISOString(),
          public_metrics: tweet.public_metrics || {
            retweet_count: 0,
            reply_count: 0,
            like_count: 0,
            quote_count: 0,
          },
        })),
        meta: {
          result_count: meta.result_count,
          next_token: 'next_token' in meta ? meta.next_token : undefined,
        },
      };
    } catch (error) {
      // Handle Twitter API errors gracefully
      // For rate limiting (429) or other errors, return empty results instead of throwing
      // This allows workflows to continue even if API limits are hit
      const operation = context.query ? 'search tweets' : 'fetch home timeline';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      console.warn(`⚠️  Failed to ${operation}: ${errorMessage}`);

      // Return empty results with proper structure to satisfy output schema
      return {
        tweets: [],
        meta: {
          result_count: 0,
        },
      };
    }
  },
});
