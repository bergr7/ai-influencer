import Readline from 'readline';
import chalk from 'chalk';
import { mastra } from '../src/mastra/index.js';
import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({
  name: 'Workflow-Then-Chat',
  level: 'info',
});

const RESOURCE_ID = 'user-123'; // User identifier
const THREAD_ID = `thread-${Date.now()}`; // Unique thread

/**
 * Main function - orchestrates workflow execution and chat transition
 */
async function main() {
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log(chalk.blue.bold('\n🚀 Starting AI Influencer Workflow...\n'));

    // Phase 1: Run Workflow with HITL Gates
    await runWorkflowPhase(rl);

    console.log(chalk.green.bold('\n✅ Workflow complete! Refined drafts ready.\n'));
    console.log(chalk.blue.bold('💬 Entering chat mode with agent...\n'));

    // Phase 2: Enter Chat Mode
    await chatWithAgent(rl);
  } catch (error) {
    logger.error('Error in main execution:');
    logger.error(error);
    rl.close();
    process.exit(1);
  }
}

/**
 * Phase 1: Execute workflow with HITL suspend/resume handling
 */
async function runWorkflowPhase(rl: Readline.Interface) {
  const workflow = mastra.getWorkflow('aiInfluencerWorkflow');

  if (!workflow) {
    throw new Error('Workflow "aiInfluencerWorkflow" not found');
  }

  const run = await workflow.createRunAsync();

  // Get initial query from user
  const query = await promptUser(
    rl,
    chalk.cyan('Enter search query (e.g., "AI agents", "Mastra"): ')
  );

  logger.info(`Starting workflow with query: "${query}"`);

  // Start workflow
  let result = await run.start({
    inputData: {
      query,
      resourceId: RESOURCE_ID,
      threadId: THREAD_ID,
    },
  });

  // Handle workflow suspensions in a loop
  while (result.status === 'suspended') {
    const suspendedStep = Array.isArray(result.suspended) ? result.suspended[0] : result.suspended;
    if (typeof suspendedStep !== 'string') {
      logger.error('Invalid suspended step type');
      break;
    }
    const suspendPayload = (result.steps as Record<string, any>)[suspendedStep]?.suspendPayload;

    if (!suspendPayload) {
      logger.error('No suspend payload found');
      break;
    }

    // Display suspension message from workflow
    console.log(
      chalk.yellow.bold(
        `\n⏸️  ${suspendPayload.suspendResponse || 'Workflow paused for review'}\n`
      )
    );

    // Get user feedback
    const userInput = await promptUser(
      rl,
      chalk.gray('Your feedback (press Enter to approve, or type feedback to refine): ')
    );

    logger.info(`User input: "${userInput || 'approved'}"`);

    // Resume workflow with user input
    result = await run.resume({
      step: suspendedStep,
      resumeData: { userInput: userInput || '' },
    });
  }

  // Check final workflow status
  if (result.status === 'success') {
    logger.info('Workflow completed successfully');
  } else if (result.status === 'failed') {
    logger.error('Workflow failed');
    throw new Error(`Workflow failed: ${result.error}`);
  }
}

/**
 * Phase 2: Interactive chat mode with tool approval
 */
async function chatWithAgent(rl: Readline.Interface, threadId: string = THREAD_ID, resourceId: string = RESOURCE_ID) {
  const agent = mastra.getAgent('aiInfluencerAgent');

  if (!agent) {
    throw new Error('Agent "aiInfluencerAgent" not found');
  }

  // Welcome message
  console.log(
    chalk.cyan(
      'Agent: Ready to post or refine your tweets! What would you like to do?\n' +
        chalk.gray('  (Type "exit" to quit)\n')
    )
  );

  // Chat loop
  while (true) {
    const userMessage = await promptUser(rl, chalk.gray('You: '));

    // Handle exit command
    if (userMessage.toLowerCase().trim() === 'exit') {
      console.log(chalk.blue('\nGoodbye! 👋\n'));
      rl.close();
      process.exit(0);
    }

    // Skip empty messages
    if (!userMessage.trim()) {
      continue;
    }

    console.log(chalk.cyan('\nAgent: '));

    try {
      // Stream agent response
      const stream = await agent.stream(userMessage, {
        memory: {
          thread: threadId,
          resource: resourceId,
        },
      });

      // Track if we need approval
      let needsApproval = false;
      let pendingToolCall: any = null;
      let currentRunId: string | undefined;

      // Store runId for approval/decline
      if ('runId' in stream) {
        currentRunId = (stream as any).runId;
      }

      // Process stream chunks
      for await (const chunk of stream.fullStream) {
        // Handle different chunk types
        if (chunk.type === 'text-delta') {
          // Output text as it streams
          process.stdout.write(chunk.payload.text);
        } else if (chunk.type === 'tool-call') {
          // Tool is being called
          pendingToolCall = chunk.payload;
          const toolName = chunk.payload.toolName;

          console.log(chalk.yellow(`\n\n🔧 Tool Call: ${toolName}`));
          console.log(chalk.gray(JSON.stringify(chunk.payload.args, null, 2)));

          // Check if this is a posting tool (they require approval)
          const isPostingTool = toolName === 'x-mcp-mock_createTweet' || toolName === 'x-mcp-mock_repostTweet';

          if (isPostingTool) {
            needsApproval = true;
            console.log(chalk.yellow('\n⚠️  This action requires approval.'));

            // Display the content to be posted
            const args = chunk.payload.args as Record<string, any> | undefined;
            if (args) {
              if (args.text) {
                console.log(chalk.gray(`Content: "${args.text}"`));
              } else if (args.thoughts) {
                console.log(chalk.gray(`Quote: "${args.thoughts}"`));
              }
            }
          }
        } else if (chunk.type === 'tool-result') {
          // Tool execution completed
          console.log(chalk.green(`\n✅ Tool Result: ${JSON.stringify(chunk.payload.result)}`));
        }
      }

      // Handle approval if needed
      if (needsApproval && pendingToolCall && currentRunId) {
        const approval = await promptUser(rl, chalk.yellow('\nApprove? (y/n): '));

        if (approval.toLowerCase().trim() === 'y') {
          console.log(chalk.green('✅ Approved. Executing...\n'));

          try {
            // Approve and get resumed stream
            const resumedStream = await agent.approveToolCall({
              runId: currentRunId,
            });

            // Process resumed stream
            for await (const chunk of resumedStream.fullStream) {
              if (chunk.type === 'text-delta') {
                process.stdout.write(chunk.payload.text);
              } else if (chunk.type === 'tool-result') {
                console.log(chalk.green(`\n✅ Tool Result: ${JSON.stringify(chunk.payload.result)}`));
              }
            }
          } catch (error) {
            logger.error('Error during tool approval:');
            logger.error(error);
            console.log(chalk.red('\n❌ Failed to execute approved action.'));
          }
        } else {
          console.log(chalk.red('❌ Declined. Tool call cancelled.'));

          try {
            await agent.declineToolCall({
              runId: currentRunId,
            });
          } catch (error) {
            logger.error('Error during tool decline:');
            logger.error(error);
          }
        }
      }

      console.log('\n');
    } catch (error) {
      logger.error('Error in chat interaction:');
      logger.error(error);
      console.log(chalk.red('\n❌ An error occurred. Please try again.\n'));
    }
  }
}

/**
 * Helper function to prompt user for input
 */
function promptUser(rl: Readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Start the application
main();
