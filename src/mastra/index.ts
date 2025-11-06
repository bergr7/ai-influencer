
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { aiInfluencerAgent } from './agents/ai-influencer-agent';
import { contentCreatorAssistant } from './agents/content-creator-assistant';
import { aiInfluencerWorkflow } from './workflows/ai-influencer-workflow';

export const mastra = new Mastra({
  agents: { aiInfluencerAgent, contentCreatorAssistant },
  workflows: { aiInfluencerWorkflow },
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL ?? (() => {
      throw new Error('DATABASE_URL environment variable is not set');
    })(),
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});