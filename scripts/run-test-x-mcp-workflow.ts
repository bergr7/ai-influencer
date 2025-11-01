import { mastra } from '../src/mastra';
import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({
  name: 'Test-X-MCP-Workflow',
  level: 'info',
});

async function runWorkflow() {
  try {
    logger.info('Starting test-x-mcp-workflow...');
    logger.info('This workflow will test all 4 x-mcp-server tools with minimal settings');
    logger.info('Fetching tweets from your home timeline (accounts you follow)');

    // Get the workflow
    const workflow = mastra.getWorkflow('testXMCPWorkflow');

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Create and start the workflow run (no input data needed)
    const run = await workflow.createRunAsync();

    const result = await run.start({
      inputData: {},
    });

    if (result.status === 'success') {
      logger.info('✅ Workflow completed successfully!');
      logger.info(`Summary: ${result.result.summary}`);
      console.log('\n=== Workflow Result ===');
      console.log(JSON.stringify(result, null, 2));
    } else if (result.status === 'failed') {
      logger.error('❌ Workflow failed');
      logger.error(`Error: ${result.error}`);
    } else if (result.status === 'suspended') {
      logger.warn('⚠️  Workflow suspended');
      logger.warn(`Suspended at: ${JSON.stringify(result.suspended)}`);
    }
  } catch (error) {
    logger.error('Error running workflow:');
    logger.error(error);
    process.exit(1);
  }
}

runWorkflow();
