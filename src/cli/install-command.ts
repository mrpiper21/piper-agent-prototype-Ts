// // ============================================================================
// // INSTALL COMMAND - Install PrintMyFile Agent
// // ============================================================================

// import { logger } from '../utils/logger.js';
// import { Installer } from '../install/Installer.js';
// import { platform } from '../utils/platform.js';
// import chalk from 'chalk';

// export async function installCommand(args: Record<string, string | boolean>): Promise<void> {
//   try {
//     console.log(chalk.blue.bold('\n🛠️  PrintMyFile Agent Installation\n'));

//     const installer = new Installer();
    
//     // Parse installation options
//     const options = {
//       autoStart: args['auto-start'] || false,
//       createDesktopShortcut: args['desktop-shortcut'] !== false,
//       runAsService: args["service"] || false,
//       installLocation: args["location"] || platform.getApplicationDataDirectory(),
//     };

//     console.log(chalk.cyan('Installation Options:'));
//     console.log(`  • Auto-start: ${options.autoStart ? 'Yes' : 'No'}`);
//     console.log(`  • Desktop shortcut: ${options.createDesktopShortcut ? 'Yes' : 'No'}`);
//     console.log(`  • Run as service: ${options.runAsService ? 'Yes' : 'No'}`);
//     console.log(`  • Install location: ${options.installLocation}\n`);

//     // Check system requirements
//     console.log(chalk.yellow('🔍 Checking system requirements...'));
//     await installer.checkRequirements();
//     console.log(chalk.green('✅ System requirements met\n'));

//     // Check permissions
//     console.log(chalk.yellow('🔐 Checking permissions...'));
//     const hasPermissions = await installer.checkPermissions();
//     if (!hasPermissions) {
//       console.log(chalk.red('❌ Insufficient permissions. Please run as administrator/root.'));
//       process.exit(1);
//     }
//     console.log(chalk.green('✅ Permissions verified\n'));

//     // Create directories
//     console.log(chalk.yellow('📁 Creating directories...'));
//     await installer.createDirectories();
//     console.log(chalk.green('✅ Directories created\n'));

//     // Install files
//     console.log(chalk.yellow('📦 Installing files...'));
//     await installer.installFiles();
//     console.log(chalk.green('✅ Files installed\n'));

//     // Create desktop shortcut
//     if (options.createDesktopShortcut) {
//       console.log(chalk.yellow('🖥️  Creating desktop shortcut...'));
//       await installer.createDesktopShortcut();
//       console.log(chalk.green('✅ Desktop shortcut created\n'));
//     }

//     // Install as service
//     if (options.runAsService) {
//       console.log(chalk.yellow('⚙️  Installing as system service...'));
//       await installer.installService();
//       console.log(chalk.green('✅ Service installed\n'));
//     }

//     // Configure auto-start
//     if (options.autoStart) {
//       console.log(chalk.yellow('🚀 Configuring auto-start...'));
//       await installer.configureAutoStart();
//       console.log(chalk.green('✅ Auto-start configured\n'));
//     }

//     // Finalize installation
//     console.log(chalk.yellow('🎯 Finalizing installation...'));
//     await installer.finalizeInstallation();
//     console.log(chalk.green('✅ Installation finalized\n'));

//     // Success message
//     console.log(chalk.green.bold('🎉 Installation completed successfully!\n'));
    
//     console.log(chalk.cyan('Next steps:'));
//     console.log('  1. Configure your environment variables:');
//     console.log('     • CLOUD_URL - Your cloud server URL');
//     console.log('     • AGENT_ID - Your unique agent ID');
//     console.log('     • API_KEY - Your API key');
//     console.log('  2. Start the agent:');
    
//     if (options.runAsService) {
//       console.log(chalk.yellow('     systemctl start printmyfile-agent'));
//     } else {
//       console.log(chalk.yellow('     printmyfile-agent start'));
//     }
    
//     console.log('\nFor more information, visit: https://docs.printmyfile.com\n');

//   } catch (error) {
//     console.error(chalk.red.bold('❌ Installation failed:'));
//     console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    
//     logger.error('Installation failed:', error);
//     process.exit(1);
//   }
// }
