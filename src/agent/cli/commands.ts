

// import { CLICommand } from "@/types";
// import { installCommand } from "./install-command";
// import { startCommand } from "./start-command";
// import { statusCommand } from "./status-command";



// export const commands: CLICommand[] = [
//   {
//     name: 'install',
//     description: 'Install the PrintMyFile Agent',
//     options: [
//       {
//         name: 'auto-start',
//         alias: 'a',
//         type: 'boolean',
//         description: 'Start the agent automatically after installation',
//         required: false,
//         default: false,
//       },
//       {
//         name: 'desktop-shortcut',
//         alias: 'd',
//         type: 'boolean',
//         description: 'Create desktop shortcut',
//         required: false,
//         default: true,
//       },
//       {
//         name: 'service',
//         alias: 's',
//         type: 'boolean',
//         description: 'Install as a system service',
//         required: false,
//         default: false,
//       },
//     ],
//     action: installCommand,
//   },
//   {
//     name: 'start',
//     description: 'Start the PrintMyFile Agent',
//     options: [
//       {
//         name: 'config',
//         alias: 'c',
//         type: 'string',
//         description: 'Path to configuration file',
//         required: false,
//       },
//       {
//         name: 'daemon',
//         alias: 'd',
//         type: 'boolean',
//         description: 'Run as daemon',
//         required: false,
//         default: false,
//       },
//     ],
//     action: startCommand,
//   },
//   {
//     name: 'status',
//     description: 'Check agent status',
//     options: [
//       {
//         name: 'verbose',
//         alias: 'v',
//         type: 'boolean',
//         description: 'Show verbose output',
//         required: false,
//         default: false,
//       },
//       {
//         name: 'json',
//         alias: 'j',
//         type: 'boolean',
//         description: 'Output in JSON format',
//         required: false,
//         default: false,
//       },
//     ],
//     action: statusCommand,
//   },
// ];

// /**
//  * Get command by name
//  */
// export function getCommand(name: string): CLICommand | undefined {
//   return commands.find(cmd => cmd.name === name);
// }

// /**
//  * Get all available commands
//  */
// export function getAllCommands(): CLICommand[] {
//   return commands;
// }

// /**
//  * Parse command line arguments
//  */
// export function parseArgs(args: string[]): {
//   command: string;
//   options: Record<string, string | boolean>;
//   positional: string[];
// } {
//   const result = {
//     command: '',
//     options: {} as Record<string, string | boolean>,
//     positional: [] as string[],
//   };

//   let i = 0;
  
//   // First argument is the command
//   if (args.length > 0) {
//     result.command = args[0] as string;
//     i = 1;
//   }

//   // Parse options
//   while (i < args.length) {
//     const arg = args[i];
    
//     if (arg?.startsWith('--')) {
//       // Long option
//       const optionName = arg?.substring(2);
//       const command = getCommand(result.command);
      
//       if (command) {
//         const option = command.options?.find(opt => opt.name === optionName);
//         if (option) {
//           if (option.type === 'boolean') {
//             result.options[optionName] = true;
//           } else if (i + 1 < args.length) {
//             result.options[optionName] = args[i + 1] as string;
//             i++; // Skip next argument as it's the value
//           }
//         }
//       }
//     } else if (arg?.startsWith('-')) {
//       // Short option
//       const optionAlias = arg?.substring(1);
//       const command = getCommand(result.command);
      
//       if (command) {
//         const option = command.options?.find(opt => opt.alias === optionAlias);
//         if (option) {
//           if (option.type === 'boolean') {
//             result.options[option.name] = true;
//           } else if (i + 1 < args.length) {
//             result.options[option.name] = args[i + 1] as string;
//             i++; // Skip next argument as it's the value
//           }
//         }
//       }
//     } else {
//       // Positional argument
//       result.positional.push(arg as string);
//     }
    
//     i++;
//   }

//   return result;
// }

// /**
//  * Validate command options
//  */
// export function validateOptions(command: CLICommand, options: Record<string, string | boolean>): {
//   valid: boolean;
//   errors: string[];
// } {
//   const errors: string[] = [];

//   if (!command.options) {
//     return { valid: true, errors: [] };
//   }

//   for (const option of command.options) {
//     if (option.required && !(option.name in options)) {
//       errors.push(`Missing required option: --${option.name}`);
//     }

//     if (option.type === 'number' && option.name in options) {
//       const value = Number(options[option.name]);
//       if (isNaN(value)) {
//         errors.push(`Invalid number value for option --${option.name}: ${options[option.name]}`);
//       } else {
//         (options as Record<string, string | boolean | number>)[option.name] = value;
//       }
//     }

//     if (option.type === 'boolean' && option.name in options) {
//       const value = options[option.name];
//       if (typeof value !== 'boolean' && typeof value !== 'string') {
//         errors.push(`Invalid boolean value for option --${option.name}: ${value}`);
//       } else if (typeof value === 'string') {
//         options[option.name] = value.toLowerCase() === 'true';
//       }
//     }
//   }

//   return {
//     valid: errors.length === 0,
//     errors,
//   };
// }

// /**
//  * Show help for a command
//  */
// export function showCommandHelp(command: CLICommand): void {
//   console.log(`\nUsage: ${command.name} [options]\n`);
//   console.log(command.description);
  
//   if (command.options && command.options.length > 0) {
//     console.log('\nOptions:');
//     for (const option of command.options) {
//       const alias = option.alias ? `-${option.alias}, ` : '    ';
//       const required = option.required ? ' (required)' : '';
//       const defaultValue = option.default !== undefined ? ` (default: ${option.default})` : '';
      
//       console.log(`  ${alias}--${option.name}${required}${defaultValue}`);
//       console.log(`      ${option.description}`);
//     }
//   }
// }

// /**
//  * Show general help
//  */
// export function showHelp(): void {
//   console.log('\nPrintMyFile Agent - Command Line Interface\n');
//   console.log('Usage: printmyfile-agent <command> [options]\n');
//   console.log('Available commands:');
  
//   for (const command of commands) {
//     console.log(`  ${command.name.padEnd(15)} ${command.description}`);
//   }
  
//   console.log('\nUse "printmyfile-agent <command> --help" for detailed help on a specific command.');
// }
