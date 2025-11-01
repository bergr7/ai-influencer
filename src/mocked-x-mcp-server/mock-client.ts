import { logger } from './logger';
import {
  generateHomeTimelineTweets,
  generateSearchTweets,
  generateFakeTweet,
  generateCreatedTweet,
  generateQuoteTweet,
} from './mock-data';

/**
 * Mock X API Client
 *
 * Provides the same interface as twitter-api-v2 but returns fake data.
 * No API credentials required, no rate limits.
 */

/**
 * Mock paginator structure matching twitter-api-v2
 */
class MockPaginator {
  constructor(public data: { data: any[]; meta: { result_count: number; next_token?: string } }) {}
}

/**
 * Mock v2 client matching twitter-api-v2's v2 interface
 */
class MockClientV2 {
  /**
   * Mock homeTimeline() - returns fake tweets from followed accounts
   */
  async homeTimeline(options?: {
    max_results?: number;
    exclude?: string[];
    'tweet.fields'?: string[];
  }): Promise<MockPaginator> {
    logger.info('Mock: Fetching home timeline');

    const maxResults = options?.max_results || 10;
    const tweets = generateHomeTimelineTweets(maxResults);

    return new MockPaginator({
      data: tweets,
      meta: {
        result_count: tweets.length,
        next_token: tweets.length > 0 ? 'mock_next_token_123' : undefined,
      },
    });
  }

  /**
   * Mock search() - returns fake tweets matching query
   */
  async search(
    query: string,
    options?: {
      max_results?: number;
      'tweet.fields'?: string[];
    }
  ): Promise<MockPaginator> {
    logger.info({ query }, 'Mock: Searching tweets');

    const maxResults = options?.max_results || 10;
    const tweets = generateSearchTweets(query, maxResults);

    return new MockPaginator({
      data: tweets,
      meta: {
        result_count: tweets.length,
        next_token: tweets.length > 0 ? 'mock_search_next_token_456' : undefined,
      },
    });
  }

  /**
   * Mock singleTweet() - returns fake tweet details
   */
  async singleTweet(
    tweetId: string,
    options?: {
      expansions?: string[];
      'tweet.fields'?: string[];
      'user.fields'?: string[];
      'media.fields'?: string[];
    }
  ): Promise<{ data: any }> {
    logger.info({ tweetId }, 'Mock: Reading single tweet');

    // Generate a fake tweet with the specified ID
    const tweet = generateFakeTweet({
      id: tweetId,
      includeMetrics: true,
    });

    return {
      data: {
        ...tweet,
        // Add additional fields for expansions if requested
        author: options?.expansions?.includes('author_id')
          ? {
              id: tweet.author_id,
              name: 'Mock Author',
              username: 'mockauthor',
            }
          : undefined,
      },
    };
  }

  /**
   * Mock tweet() - simulates creating a tweet
   */
  async tweet(text: string): Promise<{ data: { id: string; text: string } }> {
    logger.info({ text }, 'Mock: Creating tweet');

    const createdTweet = generateCreatedTweet(text);

    return {
      data: createdTweet,
    };
  }

  /**
   * Mock quote() - simulates quote tweeting
   */
  async quote(
    text: string,
    quotedTweetId: string
  ): Promise<{ data: { id: string; text: string; quoted_tweet_id: string } }> {
    logger.info({ text, quotedTweetId }, 'Mock: Quote tweeting');

    const quoteTweet = generateQuoteTweet(quotedTweetId, text);

    return {
      data: quoteTweet,
    };
  }
}

// Export mock client instance (no authentication needed)
logger.info('Initializing Mock X API client (no credentials required)');
export const mockClient = {
  v2: new MockClientV2(),
};

export const mockClientV2 = mockClient.v2;
logger.info('Mock X API client initialized successfully');
