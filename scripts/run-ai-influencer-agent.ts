import { mastra } from '../src/mastra';
import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({
    name: 'Mastra',
    level: 'info',
});

const agent = mastra.getAgent('aiInfluencerAgent');

logger.info('Running ai-influencer-agent...');
const response = await agent.generate(
    {role: 'user', content: 'Write a suggestion for a X re-post about the latest AI technologies and trends.'});

logger.info(response.text);