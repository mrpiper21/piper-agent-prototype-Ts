// ============================================================================
// MAIN ENTRY POINT - PrintMyFile Agent
// ============================================================================

import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { Agent } from './core/agent.js';
import { errorHandler } from './utils/errors.js';


// Load environment variables
dotenv.config();

console.log('🔍 Environment loaded');
console.log('AGENT_ID:', process.env.AGENT_ID);

/**
 * Main function to start the agent
 */
async function main(): Promise<void> {
  try {
    logger.info('🚀 Starting PrintMyFile Agent...\n');

    // Create and initialize agent
    const agent = new Agent();
    
    // Initialize agent components
    agent.initialize();

    // Set up graceful shutdown handlers
    setupGracefulShutdown(agent);

    // Start the agent
    await agent.start();

    // await agent.testPrint();

  } catch (error) {
    errorHandler.handleError(error as Error, 'main');
    process.exit(1);
  }
}

/**
 * Set up graceful shutdown handlers
 */
function setupGracefulShutdown(agent: Agent): void {
  const shutdown = async (signal: string) => {
    logger.info(`\n📡 Received ${signal}, shutting down gracefully...`);
    
    try {
      await agent.shutdown();
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different shutdown signals
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGQUIT', () => void shutdown('SIGQUIT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    void shutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, _) => {
    logger.error('Unhandled Rejection at:', reason);
    void shutdown('unhandledRejection');
  });
}

/**
 * Check if running as main module
 */
main().catch((error) => {
  logger.error('Failed to start agent:', error);
  process.exit(1);
});
