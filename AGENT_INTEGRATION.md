# Agent Integration with Electron Desktop App

This document explains how the PrintMyFile Agent is integrated with the Electron desktop application.

## Architecture Overview

The agent functionality is integrated seamlessly into the Electron app through:

1. **AgentService** (`src/main/services/AgentService.ts`) - Manages the agent lifecycle
2. **IPC Handlers** (`src/main/ipc/handlers.ts`) - Bridge agent functionality to the renderer process
3. **Preload Script** (`src/main/preload.ts`) - Exposes agent API to the renderer
4. **Type Definitions** (`src/shared/types/ipc.types.ts`) - Shared TypeScript types

## How It Works

### Starting the Agent

The agent can be started from the React UI using:

```typescript
await window.electron.agent.start();
```

This initializes the Agent, discovers printers, and begins polling for jobs.

### Agent Status

Get the current agent status (running state, printers, jobs processed):

```typescript
const status = await window.electron.agent.getStatus();
// Returns: { status, isRunning, printerCount, jobsProcessed, lastPoll, uptime }
```

### Discovering Printers

```typescript
const printers = await window.electron.agent.discoverPrinters();
```

### Printing Files

```typescript
await window.electron.agent.printFile(
  'printer-name',
  '/path/to/file.pdf',
  {
    copies: 1,
    colorMode: 'color',
    orientation: 'portrait',
    duplex: false
  }
);
```

### Stopping the Agent

```typescript
await window.electron.agent.stop();
```

## Available API Methods

All agent operations are accessible via `window.electron.agent`:

- `start()` - Start the agent
- `stop()` - Stop the agent
- `getStatus()` - Get agent status
- `getPrinters()` - Get list of available printers
- `discoverPrinters()` - Force printer discovery
- `printFile(printerName, filePath, options)` - Print a file
- `testPrint(printerName, filePath)` - Test print
- `isRunning()` - Check if agent is running

## IPC Events

The main process handles these IPC events:

- `agent:start` - Start the agent
- `agent:stop` - Stop the agent
- `agent:getStatus` - Get agent status
- `agent:getPrinters` - Get printers
- `agent:discoverPrinters` - Discover printers
- `agent:printFile` - Print a file
- `agent:testPrint` - Test print
- `agent:isRunning` - Check if running

## Usage Example in React Component

```typescript
import { useEffect, useState } from 'react';

function PrinterDashboard() {
  const [status, setStatus] = useState(null);
  const [printers, setPrinters] = useState([]);

  useEffect(() => {
    // Start the agent when component mounts
    window.electron.agent.start().then(() => {
      // Get status
      window.electron.agent.getStatus().then(setStatus);
      
      // Get printers
      window.electron.agent.getPrinters().then(setPrinters);
    });

    // Poll status every 5 seconds
    const interval = setInterval(async () => {
      const newStatus = await window.electron.agent.getStatus();
      setStatus(newStatus);
    }, 5000);

    return () => {
      clearInterval(interval);
      window.electron.agent.stop();
    };
  }, []);

  const handlePrint = async (filePath: string) => {
    if (printers.length > 0) {
      await window.electron.agent.printFile(
        printers[0].printerName,
        filePath,
        { copies: 1 }
      );
    }
  };

  return (
    <div>
      <h2>Agent Status: {status?.status}</h2>
      <p>Printers: {status?.printerCount}</p>
      <p>Jobs Processed: {status?.jobsProcessed}</p>
      <p>Uptime: {status?.uptime}s</p>
      
      <h3>Available Printers:</h3>
      <ul>
        {printers.map(p => (
          <li key={p.printerName}>{p.displayName || p.printerName}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Integration Points

1. **Agent Class** (`src/agent/core/agent.ts`)
   - Exposes `getPrinterManager()`, `getCloudClient()`, `getJobProcessor()`
   - Provides `start()`, `stop()`, `getStatus()`, `testPrint()`

2. **PrinterManager** (`src/agent/core/printer/PrinterManager.ts`)
   - Handles printer discovery
   - Manages print jobs
   - Provides printer status and capabilities

3. **CloudClient** (`src/agent/utils/cloud/CloudClient.ts`)
   - Connects to cloud server
   - Polls for jobs
   - Registers printers

## Notes

- The agent runs in the main process alongside Electron
- All operations are async and return promises
- Errors are logged and propagated to the renderer
- The agent can be started/stopped without restarting the app

