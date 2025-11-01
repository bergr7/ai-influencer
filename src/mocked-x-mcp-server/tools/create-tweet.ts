import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mockClientV2 } from '../mock-client';
import type { APITweet } from '../types';

/**
 * Create Tweet Tool (MOCKED)
 *
 * Simulates creating a tweet - returns fake created tweet data.
 * No real tweets are posted.
 */

export const createTweetTool = createTool({
  id: 'create_tweet',
  description:
    'Create a MOCK tweet (no real tweet posted). Returns fake tweet ID and text for testing.',
  inputSchema: z.object({
    text: z
      .string()
      .min(1)
      .max(280)
      .describe('Tweet content (1-280 characters for standard accounts)'),
  }),
  outputSchema: z.object({
    id: z.string(),
    text: z.string(),
  }),
  execute: async ({ context }) => {
    const { text } = context;

    // Validate text length (same as real API)
    if (text.length > 280) {
      throw new Error(
        `Tweet text too long: ${text.length} characters (max 280 for standard accounts)`
      );
    }

    if (text.length < 1) {
      throw new Error('Tweet text cannot be empty');
    }

    try {
      // Create mock tweet
      const result = await mockClientV2.tweet(text);
      const tweet = result.data as APITweet;

      return {
        id: tweet.id,
        text: tweet.text,
      };
    } catch (error) {
      // Mock client shouldn't fail, but handle gracefully
      if (error instanceof Error) {
        throw new Error(`Failed to create mock tweet: ${error.message}`);
      }
      throw new Error('Failed to create mock tweet: Unknown error occurred');
    }
  },
});
