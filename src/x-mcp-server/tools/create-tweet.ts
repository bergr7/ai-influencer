import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { xClientV2 } from '../client';
import type { APITweet } from '../types';

/**
 * Create Tweet Tool
 *
 * Creates a new tweet in the user's profile with the specified content.
 * This is a basic tweet creation - no media, polls, or replies.
 *
 * Use cases:
 * - Post original content
 * - Share thoughts or updates
 * - Publish announcements
 *
 * Note: Standard accounts have a 280 character limit.
 * Premium/verified accounts may have higher limits.
 */

export const createTweetTool = createTool({
  id: 'create_tweet',
  description:
    'Create a new tweet in the user profile with specific content. Basic text-only tweets (no media or polls).',
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

    // Validate text length
    if (text.length > 280) {
      throw new Error(
        `Tweet text too long: ${text.length} characters (max 280 for standard accounts)`
      );
    }

    if (text.length < 1) {
      throw new Error('Tweet text cannot be empty');
    }

    try {
      // Create tweet using the v2 API
      const result = await xClientV2.tweet(text);
      const tweet = result.data as APITweet;

      return {
        id: tweet.id,
        text: tweet.text,
      };
    } catch (error) {
      // Handle Twitter API errors gracefully
      if (error instanceof Error) {
        throw new Error(`Failed to create tweet: ${error.message}`);
      }
      throw new Error('Failed to create tweet: Unknown error occurred');
    }
  },
});
