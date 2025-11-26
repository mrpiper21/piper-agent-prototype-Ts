# Release Setup Guide

## Problem
The workflow is not publishing to the `Agent-Releases` repository because it requires a Personal Access Token (PAT) with write access to that repository.

## Solution

### Step 1: Create a Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Configure the token:
   - **Note**: `Agent-Releases Publisher`
   - **Expiration**: Choose your preferred expiration (or no expiration)
   - **Scopes**: Check `repo` (this includes all repository permissions)
4. Click "Generate token"
5. **IMPORTANT**: Copy the token immediately (you won't be able to see it again)

### Step 2: Add Token as Repository Secret

1. Go to your repository: `https://github.com/mrpiper21/piper-agent-prototype-Ts` (or your current repo)
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Configure:
   - **Name**: `PERSONAL_ACCESS_TOKEN`
   - **Secret**: Paste the token you copied in Step 1
5. Click **"Add secret"**

### Step 3: Verify Token Has Access

The token must have write access to the `Agent-Releases` repository. If the `Agent-Releases` repo is:
- **Public**: The token with `repo` scope will work
- **Private**: Make sure the token was created by a user who has write access to that repository

### Step 4: Test the Workflow

1. Create and push a new tag:
   ```bash
   git tag -a v1.1.15 -m "Release version 1.1.15"
   git push origin v1.1.15
   ```

2. Check the workflow:
   - Go to **Actions** tab in your repository
   - The workflow should run and publish to `Agent-Releases`

3. Verify the release:
   - Go to: https://github.com/mrpiper21/Agent-Releases/releases
   - You should see the new release with all platform builds

## Troubleshooting

### Workflow fails with "PERSONAL_ACCESS_TOKEN secret is required"
- Make sure you added the secret with the exact name: `PERSONAL_ACCESS_TOKEN`
- Check that the secret is added in the correct repository

### Workflow runs but doesn't publish to Agent-Releases
- Verify the token has `repo` scope
- Check that the token has access to the `Agent-Releases` repository
- Look at the workflow logs for specific error messages

### Build succeeds but no release appears
- Check the workflow logs for electron-builder errors
- Verify the `package.json` has the correct repository configuration:
  ```json
  "publish": {
    "provider": "github",
    "owner": "mrpiper21",
    "repo": "Agent-Releases"
  }
  ```

## Current Configuration

- **Release Repository**: `mrpiper21/Agent-Releases`
- **Trigger**: Push tags matching `v*.*.*`
- **Required Secret**: `PERSONAL_ACCESS_TOKEN` (with `repo` scope)

