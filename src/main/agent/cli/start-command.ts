// ============================================================================
// START COMMAND - Start PrintMyFile Agent
// ============================================================================

import { logger } from '../utils/logger.js';
import { Agent } from '../core/agent.js';
import { errorHandler } from '../utils/errors.js';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function startCommand(args: Record<string, string | boolean>): Promise<void> {
  try {
    console.log(chalk.blue.bold('\n🚀 Starting PrintMyFile Agent...\n'));

    // Load configuration if specified
    if (args["config"]) {
      console.log(chalk.cyan(`📋 Loading configuration from: ${args["config"] as string}`));
      // TODO: Load custom config file
    }

    // Check if agent is already running
    const isRunning = await checkIfAgentRunning();
    if (isRunning) {
      console.log(chalk.yellow('⚠️  Agent appears to be already running'));
      console.log(chalk.yellow('   Use "printmyfile-agent status" to check status'));
      
      if (!args["force"]) {
        process.exit(0);
      }
    }

    // Create and initialize agent
    console.log(chalk.yellow('🔧 Initializing agent...'));
    const agent = new Agent();
    
    try {
      await agent.initialize();
      console.log(chalk.green('✅ Agent initialized successfully\n'));
    } catch (error) {
      console.log(chalk.red('❌ Agent initialization failed:'));
      console.log(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }

    // Set up graceful shutdown
    setupGracefulShutdown(agent);

    // Start the agent
    console.log(chalk.yellow('🖨️  Starting agent services...'));
    
    try {
      await agent.start();
    } catch (error) {
      console.log(chalk.red('❌ Failed to start agent:'));
      console.log(chalk.red(error instanceof Error ? error.message : String(error)));
      
      errorHandler.handleError(error as Error, 'start-command');
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red.bold('❌ Start command failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    
    logger.error('Start command failed:', error);
    process.exit(1);
  }
}

/**
 * Check if agent is already running
 */
async function checkIfAgentRunning(): Promise<boolean> {
  try {
    // Check for PID file
    const pidFile = path.join(process.cwd(), '.agent.pid');
    
    if (await fs.pathExists(pidFile)) {
      const pid = await fs.readFile(pidFile, 'utf8');
      
      // Check if process is actually running
      try {
        process.kill(parseInt(pid.trim()), 0);
        return true;
      } catch {
        // Process doesn't exist, remove stale PID file
        await fs.remove(pidFile);
      }
    }
    
    return false;
  } catch (error) {
    logger.debug('Error checking if agent is running:', error);
    return false;
  }
}

/**
 * Set up graceful shutdown handlers
 */
function setupGracefulShutdown(agent: Agent): void {
  const shutdown = async (signal: string) => {
    console.log(chalk.yellow(`\n📡 Received ${signal}, shutting down gracefully...`));
    
    try {
      await agent.shutdown();
      console.log(chalk.green('✅ Agent shut down successfully\n'));
    } catch (error) {
      console.log(chalk.red('❌ Error during shutdown:'));
      console.log(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  };

  // Handle different shutdown signals
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGQUIT', () => void shutdown('SIGQUIT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.log(chalk.red('❌ Uncaught Exception:'));
    console.log(chalk.red(error.message));
    logger.error('Uncaught Exception:', error);
    void shutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.log(chalk.red('❌ Unhandled Rejection:'));
    console.log(chalk.red(String(reason)));
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    void shutdown('unhandledRejection');
  });
}
