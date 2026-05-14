# Archived CLI Tools

These tools have been replaced by MCP Server integration with Claude Code.

## Archived Files

### `cli.js`
- **Purpose:** Generic CLI tool for Azure DevOps operations
- **Replaced by:** MCP tools via `.mcp.json` configuration
- **Reason:** MCP server provides better integration with Claude Code
- **Archived date:** 2026-05-14

## Why Archived?

With MCP server setup, Claude Code can directly call Azure DevOps APIs via:
- `mcp__azure-devops__get_work_item_details`
- `mcp__azure-devops__list_all_current_sprint_tickets`
- `mcp__azure-devops__query_tickets`
- And many more tools...

These MCP tools provide:
- ✅ Better integration with Claude conversations
- ✅ No need to run separate CLI commands
- ✅ Real-time results in chat
- ✅ Type-safe parameters

## When to Use These Archived Tools?

Only if you need:
- Standalone CLI operations (without Claude)
- CI/CD pipeline integration
- Automated scripts without MCP server

## Migration Guide

Old way:
```bash
node cli.js get-ticket 14364
```

New way (in Claude Code):
```
User: Get details for ticket 14364
Claude: [calls mcp__azure-devops__get_work_item_details automatically]
```

---

**Note:** These files are kept for reference only. For active development, use MCP tools.
