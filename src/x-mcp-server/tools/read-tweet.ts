import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { xClientV2 } from '../client';
import type {
  APITweet,
  APIUser,
  APIMedia,
  APITweetURLEntity,
  APITweetReferencedTweet,
} from '../types';

/**
 * Read Tweet Tool
 *
 * Reads the full content of a specific tweet and formats it in an agent-readable format.
 * Includes full text, author info, metrics, media, URLs, and referenced tweets.
 *
 * Use cases:
 * - Get complete details of a specific tweet
 * - Analyze tweet engagement and reach
 * - Extract media and URLs from tweets
 * - Understand conversation context (replies/quotes)
 */

export const readTweetTool = createTool({
  id: 'read_tweet',
  description:
    'Read the full content of a tweet and format it in an agent-readable format. Includes author info, metrics, media, and URLs.',
  inputSchema: z.object({
    tweetId: z.string().describe('ID of the tweet to read'),
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
      // Fetch single tweet with all expansions for complete data
      const tweetResponse = await xClientV2.singleTweet(tweetId, {
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
      const includes = tweetResponse.includes;

      // Extract author information
      const author = includes?.users?.[0] as APIUser | undefined;
      if (!author) {
        throw new Error('Author information not found');
      }

      // Extract media information
      const media = includes?.media?.map((m) => {
        const mediaItem = m as APIMedia;
        return {
          type: mediaItem.type,
          url: mediaItem.url || mediaItem.preview_image_url,
        };
      });

      // Extract URL entities
      const urls: Array<{ url: string; expanded_url?: string; display_url?: string }> | undefined =
        tweet.entities?.urls?.map((u) => {
          const urlEntity = u as APITweetURLEntity;
          return {
            url: urlEntity.url,
            expanded_url: urlEntity.expanded_url,
            display_url: urlEntity.display_url,
          };
        });

      // Extract referenced tweets (quotes, replies, retweets)
      const referenced_tweets:
        | Array<{ type: string; id: string }>
        | undefined = tweet.referenced_tweets?.map((rt) => {
        const refTweet = rt as APITweetReferencedTweet;
        return {
          type: refTweet.type,
          id: refTweet.id,
        };
      });

      return {
        id: tweet.id,
        text: tweet.text,
        author: {
          id: author.id,
          name: author.name,
          username: author.username,
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
      // Handle Twitter API errors gracefully
      if (error instanceof Error) {
        throw new Error(`Failed to read tweet: ${error.message}`);
      }
      throw new Error('Failed to read tweet: Unknown error occurred');
    }
  },
});
