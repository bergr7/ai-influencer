import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mockClientV2 } from '../mock-client';
import type {
  APITweet,
  APIUser,
  APIMedia,
  APITweetURLEntity,
  APITweetReferencedTweet,
} from '../types';

/**
 * Read Tweet Tool (MOCKED)
 *
 * Returns fake tweet details - no real API calls.
 * Generates realistic mock data for any tweet ID.
 */

export const readTweetTool = createTool({
  id: 'read_tweet',
  description:
    'Read MOCK tweet content (no real API calls). Returns fake tweet details for any ID. Includes author info, metrics, media, and URLs.',
  inputSchema: z.object({
    tweetId: z.string().describe('ID of the tweet to read (any ID works in mock mode)'),
  }),
  outputSchema: z.object({
    id: z.string(),
    text: z.string(),
    author: z.object({
      id: z.string(),
      name: z.string(),
      username: z.string(),
    }),
    created_at: z.string(),
    metrics: z.object({
      retweet_count: z.number(),
      reply_count: z.number(),
      like_count: z.number(),
      quote_count: z.number(),
      bookmark_count: z.number().optional(),
      impression_count: z.number().optional(),
    }),
    media: z
      .array(
        z.object({
          type: z.string(),
          url: z.string().optional(),
        })
      )
      .optional(),
    urls: z
      .array(
        z.object({
          url: z.string(),
          expanded_url: z.string().optional(),
          display_url: z.string().optional(),
        })
      )
      .optional(),
    referenced_tweets: z
      .array(
        z.object({
          type: z.string(),
          id: z.string(),
        })
      )
      .optional(),
  }),
  execute: async ({ context }) => {
    const { tweetId } = context;

    try {
      // Fetch mock tweet data
      const tweetResponse = await mockClientV2.singleTweet(tweetId, {
        'tweet.fields': [
          'created_at',
          'author_id',
          'public_metrics',
          'text',
          'entities',
          'attachments',
          'referenced_tweets',
        ],
        expansions: ['author_id', 'attachments.media_keys'],
        'user.fields': ['id', 'name', 'username'],
        'media.fields': ['type', 'url', 'preview_image_url'],
      });

      const tweet = tweetResponse.data as APITweet;

      // Mock author data
      const mockAuthor: APIUser = {
        id: tweet.author_id || 'mock_author_123',
        name: tweet.author?.name || 'Mock Author',
        username: tweet.author?.username || 'mockauthor',
      };

      // Mock media (optional)
      const media = undefined; // No mock media for now

      // Mock URLs (optional)
      const urls = undefined; // No mock URLs for now

      // Mock referenced tweets (optional)
      const referenced_tweets = undefined; // No mock references for now

      return {
        id: tweet.id,
        text: tweet.text,
        author: {
          id: mockAuthor.id,
          name: mockAuthor.name,
          username: mockAuthor.username,
        },
        created_at: tweet.created_at || new Date().toISOString(),
        metrics: tweet.public_metrics || {
          retweet_count: 0,
          reply_count: 0,
          like_count: 0,
          quote_count: 0,
        },
        media,
        urls,
        referenced_tweets,
      };
    } catch (error) {
      // Mock client shouldn't fail, but handle gracefully
      if (error instanceof Error) {
        throw new Error(`Failed to read mock tweet: ${error.message}`);
      }
      throw new Error('Failed to read mock tweet: Unknown error occurred');
    }
  },
});
