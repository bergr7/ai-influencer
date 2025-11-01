/**
 * Mock Data Generators for X MCP Server
 *
 * Provides realistic fake data for tweets, users, and other X API entities.
 * Used for testing and development without consuming API rate limits.
 */

import type { APITweet, APIUser } from '../x-mcp-server/types';

// Sample author data
const MOCK_AUTHORS = [
  { id: '1234567890', name: 'Alex Chen', username: 'alexchen' },
  { id: '2345678901', name: 'Sarah Martinez', username: 'sarahmartinez' },
  { id: '3456789012', name: 'Jordan Lee', username: 'jordanlee' },
  { id: '4567890123', name: 'Taylor Swift', username: 'taylorswift13' },
  { id: '5678901234', name: 'Dev Community', username: 'ThePracticalDev' },
  { id: '6789012345', name: 'AI Research', username: 'ai_research' },
  { id: '7890123456', name: 'Open Source', username: 'opensource' },
  { id: '8901234567', name: 'Tech News', username: 'technews' },
];

// Sample tweet texts
const TECH_TWEETS = [
  'Just discovered an amazing open source library for AI development! 🚀',
  'Working on a new machine learning model. Early results are promising!',
  'The future of AI is looking bright. Exciting times ahead for developers.',
  'Just published a new blog post about building AI agents with TypeScript.',
  'Love how the open source community comes together to solve problems.',
  'Been exploring different AI models lately. GPT-4 continues to impress.',
  'Building something cool with Claude API. The results are incredible!',
  'TypeScript + AI = Perfect combination for modern development.',
  'Just shipped a new feature using AI-powered code generation.',
  'The latest developments in AI are mind-blowing. Great time to be in tech!',
];

const GENERAL_TWEETS = [
  'Beautiful day for coding! ☀️',
  'Coffee + Code = Productivity ☕',
  'Debugging is like being a detective in a crime movie where you are also the murderer.',
  'There are two hard things in computer science: cache invalidation, naming things, and off-by-one errors.',
  'Code never lies, comments sometimes do.',
  'First, solve the problem. Then, write the code.',
  'The best error message is the one that never shows up.',
  'Programming is the art of telling another human what one wants the computer to do.',
];

/**
 * Generate a deterministic but realistic tweet ID
 */
export function generateTweetId(seed: number = Date.now()): string {
  return (1900000000000000000 + seed).toString();
}

/**
 * Generate a fake tweet object
 */
export function generateFakeTweet(options: {
  id?: string;
  text?: string;
  authorIndex?: number;
  createdAt?: string;
  includeMetrics?: boolean;
}): APITweet {
  const authorIndex = options.authorIndex ?? Math.floor(Math.random() * MOCK_AUTHORS.length);
  const author = MOCK_AUTHORS[authorIndex];

  const tweetId = options.id || generateTweetId(Math.floor(Math.random() * 100000));
  const text = options.text || [...TECH_TWEETS, ...GENERAL_TWEETS][
    Math.floor(Math.random() * (TECH_TWEETS.length + GENERAL_TWEETS.length))
  ];

  const tweet: APITweet = {
    id: tweetId,
    text: text,
    author_id: author.id,
    created_at: options.createdAt || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (options.includeMetrics !== false) {
    tweet.public_metrics = {
      retweet_count: Math.floor(Math.random() * 1000),
      reply_count: Math.floor(Math.random() * 500),
      like_count: Math.floor(Math.random() * 5000),
      quote_count: Math.floor(Math.random() * 200),
      bookmark_count: Math.floor(Math.random() * 300),
      impression_count: Math.floor(Math.random() * 50000),
    };
  }

  return tweet;
}

/**
 * Generate fake tweets for home timeline
 */
export function generateHomeTimelineTweets(count: number = 5): APITweet[] {
  return Array.from({ length: count }, (_, i) =>
    generateFakeTweet({
      id: generateTweetId(10000 + i),
      authorIndex: i % MOCK_AUTHORS.length,
      includeMetrics: true,
    })
  );
}

/**
 * Generate fake tweets matching a search query
 */
export function generateSearchTweets(query: string, count: number = 5): APITweet[] {
  // Filter tweets that might match the query
  const queryLower = query.toLowerCase();
  const matchingTweets = TECH_TWEETS.filter(text =>
    text.toLowerCase().includes(queryLower) ||
    (queryLower.includes('open') && text.toLowerCase().includes('open')) ||
    (queryLower.includes('source') && text.toLowerCase().includes('source')) ||
    (queryLower.includes('model') && text.toLowerCase().includes('model')) ||
    (queryLower.includes('ai') && text.toLowerCase().includes('ai'))
  );

  // If we have matching tweets, use them; otherwise use generic tech tweets
  const tweetsToUse = matchingTweets.length > 0 ? matchingTweets : TECH_TWEETS.slice(0, count);

  return Array.from({ length: Math.min(count, tweetsToUse.length) }, (_, i) =>
    generateFakeTweet({
      id: generateTweetId(20000 + i),
      text: tweetsToUse[i],
      authorIndex: i % MOCK_AUTHORS.length,
      includeMetrics: true,
    })
  );
}

/**
 * Generate fake user data
 */
export function generateFakeUser(authorId: string): APIUser {
  const author = MOCK_AUTHORS.find(a => a.id === authorId) || MOCK_AUTHORS[0];

  return {
    id: author.id,
    name: author.name,
    username: author.username,
    created_at: new Date(Date.now() - Math.random() * 365 * 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: `Software developer passionate about ${['AI', 'open source', 'technology', 'coding'][Math.floor(Math.random() * 4)]}`,
    public_metrics: {
      followers_count: Math.floor(Math.random() * 10000),
      following_count: Math.floor(Math.random() * 1000),
      tweet_count: Math.floor(Math.random() * 50000),
      listed_count: Math.floor(Math.random() * 100),
    },
    verified: Math.random() > 0.7,
  };
}

/**
 * Generate a fake created tweet response
 */
export function generateCreatedTweet(text: string): { id: string; text: string } {
  return {
    id: generateTweetId(Date.now()),
    text: text,
  };
}

/**
 * Generate a fake quote tweet (repost with thoughts)
 */
export function generateQuoteTweet(tweetId: string, thoughts: string): {
  id: string;
  text: string;
  quoted_tweet_id: string;
} {
  return {
    id: generateTweetId(Date.now() + 1000),
    text: thoughts,
    quoted_tweet_id: tweetId,
  };
}
