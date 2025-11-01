import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { xClientV2 } from '../client';
import type { APITweet } from '../types';

/**
 * Repost Tweet Tool (Quote Tweet)
 *
 * Reposts (quotes) a tweet with the user's own thoughts/commentary.
 * This creates a quote tweet that shows the original tweet with your added text.
 *
 * Use cases:
 * - Share a tweet with your commentary
 * - Add context to someone else's tweet
 * - Build on existing conversations
 *
 * Note: The combined length of your thoughts + quote attachment must fit
 * within Twitter's character limits.
 */

export const repostTweetTool = createTool({
  id: 'repost_tweet',
  description:
    "Repost (quote tweet) a tweet with the user's own thoughts. Creates a quote tweet showing the original with your commentary.",
  inputSchema: z.object({
    tweetId: z.string().describe('ID of the tweet to quote'),
    thoughts: z
      .string()
      .max(280)
      .describe(
        "User's commentary/thoughts to add to the quote tweet (max 280 characters)"
      ),
  }),
  outputSchema: z.object({
    id: z.string(),
    text: z.string(),
    quoted_tweet_id: z.string(),
  }),
  execute: async ({ context }) => {
    const { tweetId, thoughts } = context;

    // Validate text length
    if (thoughts.length > 280) {
      throw new Error(
        `Thoughts text too long: ${thoughts.length} characters (max 280)`
      );
    }

    try {
      // Create quote tweet using the v2 API
      const result = await xClientV2.quote(thoughts, tweetId);
      const tweet = result.data as APITweet;

      return {
        id: tweet.id,
        text: tweet.text,
        quoted_tweet_id: tweetId,
      };
    } catch (error) {
      // Handle Twitter API errors gracefully
      if (error instanceof Error) {
        throw new Error(`Failed to quote tweet: ${error.message}`);
      }
      throw new Error('Failed to quote tweet: Unknown error occurred');
    }
  },
});
