# Fixing OneDrive Sync Issues with Vite

## Problem
OneDrive can lock files in `node_modules/.vite/` causing Vite dependency optimization errors (504 Outdated Optimize Dep).

## Solutions

### Option 1: Exclude `.vite` from OneDrive (Recommended)

1. **Right-click** on your project folder in File Explorer
2. Select **OneDrive** → **Free up space** (or **Always keep on this device**)
3. Or exclude the specific folder:
   - Open OneDrive settings
   - Go to **Sync and backup** → **Advanced settings**
   - Click **Choose folders**
   - Uncheck `node_modules/.vite` or the entire `node_modules` folder

### Option 2: Use Clean Script

Run this command to clear the Vite cache:
```bash
npm run clean:vite
```

Or clean everything:
```bash
npm run clean:all
```

### Option 3: Move Project Outside OneDrive

Move your project to a location outside OneDrive (e.g., `C:\Projects\` instead of `C:\Users\...\OneDrive\`).

### Option 4: Pause OneDrive Temporarily

When developing:
1. Right-click OneDrive icon in system tray
2. Select **Pause syncing** → **2 hours**
3. Resume when done

## Quick Fix

If you're getting the error right now:

1. **Stop the dev server** (Ctrl+C)
2. **Run**: `npm run clean:vite`
3. **Restart**: `npm run dev`

The cache will be rebuilt automatically.

