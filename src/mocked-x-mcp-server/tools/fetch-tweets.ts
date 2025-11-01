import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mockClientV2 } from '../mock-client';
import type { APITweet } from '../types';

/**
 * Fetch Tweets Tool (MOCKED)
 *
 * Fetches FAKE tweets from mock data - no real API calls.
 * - If query is provided: Returns fake search results matching keywords
 * - If query is empty: Returns fake home timeline tweets
 * Returns tweets in reverse chronological order (newest first).
 *
 * Use cases:
 * - Test workflows without consuming API rate limits
 * - Develop and demo without X API credentials
 * - Get consistent, predictable results
 *
 * For full tweet content, use the read-tweet tool instead.
 */

export const fetchTweetsTool = createTool({
  id: 'fetch_tweets',
  description:
    'Fetch MOCK tweets from fake data (no real API calls). If query is provided, searches fake tweets. If query is empty, fetches fake home timeline. Returns tweets in reverse chronological order (newest first). Returns truncated content and metadata, not full tweet content.',
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe('Optional search query. If provided, searches mock tweets instead of fetching mock home timeline. Example: "open source" or "AI model"'),
    maxResults: z
      .number()
      .min(5)
      .max(20)
      .default(5)
      .describe('Number of mock tweets to fetch (5-20, default 5)'),
    excludeReplies: z
      .boolean()
      .default(false)
      .describe('Exclude reply tweets from results (not implemented in mock)'),
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
        // Search mode: Return fake search results
        const searchResults = await mockClientV2.search(query, {
          max_results: maxResults,
          'tweet.fields': [
            'created_at',
            'author_id',
            'public_metrics',
            'text',
          ],
        });

        // Mock client returns paginator with data
        const responseData = searchResults.data || {};
        tweets = (responseData.data || []) as APITweet[];
        meta = responseData.meta || {
          result_count: tweets.length,
        };
      } else {
        // Home timeline mode: Return fake home timeline
        const timeline = await mockClientV2.homeTimeline({
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
      // Mock client shouldn't throw errors, but handle gracefully just in case
      const operation = context.query ? 'search tweets' : 'fetch home timeline';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      console.warn(`⚠️  Failed to ${operation}: ${errorMessage}`);

      // Return empty results with proper structure
      return {
        tweets: [],
        meta: {
          result_count: 0,
        },
      };
    }
  },
});
