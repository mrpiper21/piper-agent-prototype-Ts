// // ============================================================================
// // STATUS COMMAND - Check PrintMyFile Agent status
// // ============================================================================

// import { logger } from '../utils/logger.js';
// import { platform } from '../utils/platform.js';
// import chalk from 'chalk';

// export async function statusCommand(args: any): Promise<void> {
//   try {
//     const verbose = args.verbose || false;
//     const json = args.json || false;

//     if (json) {
//       await showJsonStatus();
//     } else {
//       await showHumanReadableStatus(verbose);
//     }

//   } catch (error) {
//     console.error(chalk.red.bold('❌ Status check failed:'));
//     console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    
//     logger.error('Status command failed:', error);
//     process.exit(1);
//   }
// }

// /**
//  * Show human-readable status
//  */
// async function showHumanReadableStatus(verbose: boolean): Promise<void> {
//   console.log(chalk.blue.bold('\n📊 PrintMyFile Agent Status\n'));

//   // Check if agent is running
//   const isRunning = await checkIfAgentRunning();
//   const statusColor = isRunning ? chalk.green : chalk.red;
//   const statusText = isRunning ? 'RUNNING' : 'STOPPED';
  
//   console.log(`Status: ${statusColor(statusText)}\n`);

//   if (isRunning) {
//     // Get agent status
//     const agentStatus = await getAgentStatus();
    
//     console.log(chalk.cyan('Agent Information:'));
//     console.log(`  • Agent ID: ${agentStatus.agentId || 'Not configured'}`);
//     console.log(`  • Location: ${agentStatus.locationName || 'Not configured'}`);
//     console.log(`  • Uptime: ${formatUptime(agentStatus.uptime || 0)}`);
//     console.log(`  • Last Poll: ${agentStatus.lastPoll || 'Never'}`);
//     console.log(`  • Jobs Processed: ${agentStatus.jobsProcessed || 0}\n`);

//     console.log(chalk.cyan('Printer Information:'));
//     console.log(`  • Total Printers: ${agentStatus.printerCount || 0}`);
//     console.log(`  • Online Printers: ${agentStatus.onlinePrinters || 0}`);
//     console.log(`  • Offline Printers: ${agentStatus.offlinePrinters || 0}\n`);

//     if (verbose) {
//       console.log(chalk.cyan('System Information:'));
//       const sysInfo = platform.getSystemInfo();
//       console.log(`  • Platform: ${sysInfo.platform} ${sysInfo.arch}`);
//       console.log(`  • Node.js: ${sysInfo.nodeVersion}`);
//       console.log(`  • Hostname: ${sysInfo.hostname}`);
//       console.log(`  • Memory: ${formatBytes(sysInfo.memory.total)} total, ${formatBytes(sysInfo.memory.free)} free`);
//       console.log(`  • CPUs: ${sysInfo.cpus}\n`);

//       console.log(chalk.cyan('Configuration:'));
//       console.log(`  • Cloud URL: ${process.env.CLOUD_URL || 'Not set'}`);
//       console.log(`  • API Key: ${process.env.API_KEY ? 'Set' : 'Not set'}`);
//       console.log(`  • Log Level: ${process.env.LOG_LEVEL || 'info'}`);
//       console.log(`  • Poll Interval: ${process.env.POLL_INTERVAL || '5000'}ms`);
//       console.log(`  • Heartbeat Interval: ${process.env.HEARTBEAT_INTERVAL || '30000'}ms\n`);
//     }
//   } else {
//     console.log(chalk.yellow('Agent is not running. Start it with:'));
//     console.log(chalk.yellow('  printmyfile-agent start\n'));
//   }
// }

// /**
//  * Show JSON status
//  */
// async function showJsonStatus(): Promise<void> {
//   const isRunning = await checkIfAgentRunning();
//   const agentStatus = isRunning ? await getAgentStatus() : null;
//   const sysInfo = platform.getSystemInfo();

//   const status = {
//     running: isRunning,
//     timestamp: new Date().toISOString(),
//     agent: agentStatus,
//     system: {
//       platform: sysInfo.platform,
//       arch: sysInfo.arch,
//       nodeVersion: sysInfo.nodeVersion,
//       hostname: sysInfo.hostname,
//       memory: {
//         total: sysInfo.memory.total,
//         free: sysInfo.memory.free,
//         used: sysInfo.memory.used,
//       },
//       cpus: sysInfo.cpus,
//     },
//     configuration: {
//       cloudUrl: process.env.CLOUD_URL || null,
//       agentId: process.env.AGENT_ID || null,
//       apiKey: process.env.API_KEY ? 'set' : null,
//       logLevel: process.env.LOG_LEVEL || 'info',
//       pollInterval: parseInt(process.env.POLL_INTERVAL || '5000'),
//       heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'),
//     },
//   };

//   console.log(JSON.stringify(status, null, 2));
// }

// /**
//  * Check if agent is running
//  */
// async function checkIfAgentRunning(): Promise<boolean> {
//   try {
//     const fs = require('fs-extra');
//     const path = require('path');
//     const pidFile = path.join(process.cwd(), '.agent.pid');
    
//     if (await fs.pathExists(pidFile)) {
//       const pid = await fs.readFile(pidFile, 'utf8');
      
//       try {
//         process.kill(parseInt(pid), 0);
//         return true;
//       } catch {
//         // Process doesn't exist, remove stale PID file
//         await fs.remove(pidFile);
//       }
//     }
    
//     return false;
//   } catch (error) {
//     logger.debug('Error checking if agent is running:', error);
//     return false;
//   }
// }

// /**
//  * Get agent status (placeholder implementation)
//  */
// async function getAgentStatus(): Promise<any> {
//   try {
//     // This would typically connect to the running agent to get status
//     // For now, return placeholder data
//     return {
//       agentId: process.env.AGENT_ID || 'Not configured',
//       locationName: process.env.LOCATION_NAME || 'Not configured',
//       uptime: 0,
//       lastPoll: null,
//       jobsProcessed: 0,
//       printerCount: 0,
//       onlinePrinters: 0,
//       offlinePrinters: 0,
//     };
//   } catch (error) {
//     logger.error('Failed to get agent status:', error);
//     return {};
//   }
// }

// /**
//  * Format uptime in human-readable format
//  */
// function formatUptime(seconds: number): string {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const secs = seconds % 60;

//   if (hours > 0) {
//     return `${hours}h ${minutes}m ${secs}s`;
//   } else if (minutes > 0) {
//     return `${minutes}m ${secs}s`;
//   } else {
//     return `${secs}s`;
//   }
// }

// /**
//  * Format bytes in human-readable format
//  */
// function formatBytes(bytes: number): string {
//   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//   if (bytes === 0) return '0 Bytes';
  
//   const i = Math.floor(Math.log(bytes) / Math.log(1024));
//   return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
// }
