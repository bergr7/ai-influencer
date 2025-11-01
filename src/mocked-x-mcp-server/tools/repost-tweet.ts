import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mockClientV2 } from '../mock-client';
import type { APITweet } from '../types';

/**
 * Repost Tweet Tool (Quote Tweet) - MOCKED
 *
 * Simulates quote tweeting - returns fake quote tweet data.
 * No real quote tweets are posted.
 */

export const repostTweetTool = createTool({
  id: 'repost_tweet',
  description:
    "Create a MOCK quote tweet (no real tweet posted). Returns fake quote tweet data with your thoughts.",
  inputSchema: z.object({
    tweetId: z.string().describe('ID of the tweet to quote (any ID works in mock mode)'),
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

    // Validate text length (same as real API)
    if (thoughts.length > 280) {
      throw new Error(
        `Thoughts text too long: ${thoughts.length} characters (max 280)`
      );
    }

    try {
      // Create mock quote tweet
      const result = await mockClientV2.quote(thoughts, tweetId);
      const tweet = result.data as APITweet;

      return {
        id: tweet.id,
        text: tweet.text,
        quoted_tweet_id: tweetId,
      };
    } catch (error) {
      // Mock client shouldn't fail, but handle gracefully
      if (error instanceof Error) {
        throw new Error(`Failed to create mock quote tweet: ${error.message}`);
      }
      throw new Error('Failed to create mock quote tweet: Unknown error occurred');
    }
  },
});
