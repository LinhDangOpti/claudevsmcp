# Azure DevOps MCP Server Setup

## Overview
This MCP server provides tools to interact with Azure DevOps work items, pull requests, and development artifacts.

## Available Tools

### Work Item Tools
- `get_my_current_sprint_tickets` - Get tickets assigned to user in current sprint
- `get_tickets_by_state` - Filter tickets by state (e.g., "In ACC", "Active")
- `get_work_item_details` - Get detailed work item information
- `get_current_sprint_info` - Get current sprint information
- `list_all_current_sprint_tickets` - List all tickets in current sprint
- `query_tickets` - Natural language query for tickets

### Pull Request Tools
- `get_work_item_pull_requests` - Get all PRs linked to a work item
- `get_pull_request_details` - Get detailed PR information
- `get_pull_request_files` - Get list of changed files in a PR
- `get_pull_request_file_diffs` - Get detailed file diffs with additions/deletions

## Installation in Claude Code

### Step 1: Build the MCP Server
```bash
cd e:\Coding\mcp\azure-devops-mcp-server
npm run build
```

### Step 2: Add to Claude Code Settings

Open your Claude Code settings (`.claude/settings.json` or User Settings) and add:

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": [
        "e:\\Coding\\mcp\\azure-devops-mcp-server\\dist\\index.js"
      ],
      "env": {
        "AZURE_DEVOPS_ORG_URL": "https://ericsson-web.visualstudio.com",
        "AZURE_DEVOPS_TOKEN": "YOUR_TOKEN_HERE",
        "AZURE_DEVOPS_PROJECT": "ericssondotcom-vnext",
        "AZURE_DEVOPS_USER_EMAIL": "your.email@ericsson.com"
      }
    }
  }
}
```

**Important**: Replace `YOUR_TOKEN_HERE` with your actual Azure DevOps PAT token from `.env` file.

### Step 3: Restart Claude Code

After adding the configuration, restart Claude Code to load the MCP server.

### Step 4: Verify Installation

In Claude Code, try calling one of the tools:
- Ask: "list all tickets in current sprint"
- Or: "get PRs for work item 14317"

## Environment Variables

The MCP server requires these environment variables:

- `AZURE_DEVOPS_ORG_URL` - Your Azure DevOps organization URL
- `AZURE_DEVOPS_TOKEN` - Personal Access Token with Read permissions
- `AZURE_DEVOPS_PROJECT` - Project name
- `AZURE_DEVOPS_TEAM` - Team name (optional, defaults to project name)
- `AZURE_DEVOPS_USER_EMAIL` - Your email for filtering assigned tickets

## Cache Management

The server uses cached work items from `cache/work-items.json` for work item queries.

To refresh the cache:
```bash
npm run refresh
```

## Usage Examples

### Analyze PRs for a Ticket
```
/analyze-pr 14317
```

This will:
1. Use `get_work_item_pull_requests(14317)` to fetch all PRs
2. Use `get_pull_request_files()` for each PR to get changed files
3. Categorize files and generate testing recommendations
4. Save analysis to `skill-result/analyze-pr/analyze-pr-14317.md`

### Create Verification Checklist
```
/create-checklist 14317
```

Generates comprehensive test checklist based on ticket details.

## Troubleshooting

### MCP Server Not Loading
- Check that `dist/index.js` exists (run `npm run build`)
- Verify paths in settings.json use correct slashes for Windows
- Check token permissions in Azure DevOps

### Tools Not Available
- Restart Claude Code after changing settings
- Check Developer Tools console for MCP errors
- Verify environment variables are set correctly

### Permission Errors
- Ensure PAT token has "Code (Read)" and "Work Items (Read)" permissions
- Check organization URL is correct

## Development

To add new tools:
1. Add tool definition to `TOOLS` array in `src/index.ts`
2. Add case handler in `CallToolRequestSchema` switch statement
3. Implement method in `src/azure-devops-client.ts` if needed
4. Rebuild: `npm run build`
5. Restart Claude Code

## Security Notes

- Never commit `.env` file with tokens
- Use read-only PAT tokens when possible
- Rotate tokens regularly
- Keep `settings.json` secure (contains token)
