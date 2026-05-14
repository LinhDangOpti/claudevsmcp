# Migration Guide

## Overview

This guide helps you transition from the old JavaScript-based structure to the new TypeScript-based architecture.

## What Changed?

### 1. **New Directory Structure**

**Before:**
```
root/
├── cli.js
├── query-cache.js
├── refresh-cache.js
├── src/
│   ├── index.ts
│   ├── azure-devops-client.ts
│   └── refresh-cache.ts
```

**After:**
```
root/
├── src/
│   ├── utils/              # NEW: Shared utilities
│   ├── scripts/            # NEW: TypeScript CLI tools
│   ├── azure-devops-client.ts
│   └── index.ts
├── dist/                   # Compiled output
```

### 2. **Shared Utilities**

Common code has been extracted into reusable modules:

- **cache-manager.ts**: All cache operations
- **config.ts**: Configuration validation
- **html-cleaner.ts**: HTML cleaning (no more duplication!)
- **logger.ts**: Structured logging

### 3. **TypeScript CLI Scripts**

Old JavaScript scripts have TypeScript equivalents:

| Old File | New File | Command |
|----------|----------|---------|
| `refresh-cache.js` | `src/scripts/refresh-cache.ts` | `npm run refresh` |
| `query-cache.js` | `src/scripts/query-cache.ts` | `npm run query` |
| `cli.js` | `src/scripts/cli.ts` | `npm run cli` |

### 4. **Code Quality Tools**

New additions:
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Full type safety

## Step-by-Step Migration

### Step 1: Install New Dependencies

```bash
npm install
```

This will install the new devDependencies (ESLint, Prettier, etc.).

### Step 2: Build the Project

```bash
npm run build
```

This compiles all TypeScript code to JavaScript in the `dist/` folder.

### Step 3: Test New Scripts

Test each script to ensure it works:

```bash
# Test cache refresh
npm run refresh

# Test query (with a sample query)
npm run query tickets in ACC

# Test CLI
npm run cli list
```

### Step 4: Update Your Workflow

**Old way:**
```bash
node refresh-cache.js
node query-cache.js tickets in ACC
node cli.js my-verify
```

**New way:**
```bash
npm run refresh
npm run query tickets in ACC
npm run cli my-verify
```

### Step 5: Clean Up (Optional)

Once you've verified everything works, you can remove old files:

```bash
# DO NOT delete these yet - keep for reference!
# After thorough testing, you can remove:
# - cli.js
# - query-cache.js
# - refresh-cache.js (keep the one in src/)
# - All checklist-*.md files (move to docs/ if needed)
```

## Breaking Changes

### 1. Script Execution

**Before:**
```bash
node cli.js my-verify
```

**After:**
```bash
npm run cli my-verify
```

### 2. Import Paths

If you're importing from these modules in your own code:

**Before:**
```typescript
import { AzureDevOpsClient } from './dist/azure-devops-client.js';
```

**After:**
```typescript
import { AzureDevOpsClient } from './dist/azure-devops-client.js';
import { loadCache, saveCache } from './dist/utils/cache-manager.js';
import { logger } from './dist/utils/logger.js';
```

### 3. Configuration Validation

Configuration is now validated on load. Make sure your `.env` file has all required variables:

```env
AZURE_DEVOPS_ORG_URL=https://your-org.visualstudio.com
AZURE_DEVOPS_TOKEN=your-pat-token
AZURE_DEVOPS_PROJECT=your-project
AZURE_DEVOPS_TEAM=your-team (optional, defaults to project)
AZURE_DEVOPS_USER_EMAIL=your.email@company.com (optional)
```

## New Features

### 1. Structured Logging

```typescript
import { logger } from './utils/logger.js';

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
logger.success('Success message');
logger.debug('Debug message');
```

### 2. Cache Management

```typescript
import { loadCache, saveCache, cacheExists, getCacheAge } from './utils/cache-manager.js';

// Check if cache exists
if (cacheExists()) {
  const age = getCacheAge(); // Age in minutes
  logger.info(`Cache is ${age} minutes old`);
}

// Load cache
const cache = loadCache();

// Save cache
saveCache({
  workItems: [...],
  lastUpdated: new Date().toISOString()
});
```

### 3. HTML Cleaning

```typescript
import { cleanHtml } from './utils/html-cleaner.js';

const cleanText = cleanHtml(htmlString);
```

### 4. Configuration Management

```typescript
import { loadConfig, getConfigValue } from './utils/config.js';

// Load all config
const config = loadConfig();

// Get single value
const token = getConfigValue('AZURE_DEVOPS_TOKEN', true); // true = required
```

## Code Quality

### Running Linter

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Running Formatter

```bash
# Check formatting
npm run format:check

# Format all files
npm run format
```

## Troubleshooting

### Build Errors

**Problem:** TypeScript compilation fails

**Solution:**
```bash
# Clean build
rm -rf dist/
npm run build
```

### Import Errors

**Problem:** Cannot find module

**Solution:** Make sure to use `.js` extension in imports (even for `.ts` files):
```typescript
import { logger } from './utils/logger.js';  // Correct
import { logger } from './utils/logger';     // Wrong
```

### Cache Not Found

**Problem:** "Cache file not found" error

**Solution:**
```bash
npm run refresh
```

### Environment Variables

**Problem:** "Missing required environment variables"

**Solution:** Check your `.env` file has all required variables.

## Rollback Plan

If you encounter issues, you can temporarily use the old JavaScript files:

```bash
# Use old scripts directly
node cli.js my-verify
node refresh-cache.js
node query-cache.js
```

The old files are still present and functional as a fallback.

## Getting Help

1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation
2. Review [README.md](./README.md) for setup instructions
3. Check error logs in the console
4. Verify your `.env` configuration

## Next Steps

After successful migration:

1. ✅ Keep using new TypeScript scripts for 1-2 weeks
2. ✅ Report any issues or bugs
3. ✅ Once stable, remove old JavaScript files
4. ✅ Update any external documentation or scripts that reference old files
5. ✅ Consider adding automated tests

## Feedback

If you encounter any issues during migration, please document them for future reference.
