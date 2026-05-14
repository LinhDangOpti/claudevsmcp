# Azure DevOps MCP Server - Skills Documentation

## Overview

This MCP server provides two main skills for QA and development workflow:

1. **create-checklist** - Generate comprehensive verification checklists for work items
2. **analyze-pr** - Analyze pull request changes and assess testing impact

## Skills

### 1. create-checklist

**Purpose**: Generate comprehensive, actionable verification checklists for Azure DevOps tickets.

**Usage**:
```
/create-checklist <ticket-id>
```

**Example**:
```
/create-checklist 13861
```

**What it does**:
1. Reads work item from `cache/work-items.json`
2. Analyzes acceptance criteria, description, and comments
3. Categorizes testing needs (Functional, UI, Backend, Integration, Regression)
4. Generates comprehensive checklist with:
   - Acceptance Criteria verification
   - Functionality testing
   - Cross-browser testing
   - Edge cases & negative testing
   - Regression testing
   - Sign-off checklist

**Output**: `skill-result/create-checklist/checklist-{ticketId}.md`

**Role Context**: Acts as Senior QA Engineer on ericsson.com (Optimizely CMS)

---

### 2. analyze-pr

**Purpose**: Analyze pull request changes to understand code impact and testing scope.

**Usage**:
```
/analyze-pr <ticket-id>
```

**Example**:
```
/analyze-pr 14317
```

**What it does**:
1. Checks for existing analysis in `skill-result/analyze-pr/`
2. If not exists:
   - Calls `get_work_item_pull_requests(ticketId)` to get all PRs
   - For each PR, calls `get_pull_request_files()` to get changed files
   - Categorizes files by type:
     - UI Views (.cshtml) - Medium priority
     - Styling (.scss/.css) - Low priority
     - Backend (.cs) - High priority
     - Client Scripts (.js/.ts) - Medium priority
     - Configuration - Low priority
   - Assesses functionality impact severity
   - Generates testing recommendations
3. Saves analysis to markdown file

**Output**: `skill-result/analyze-pr/analyze-pr-{ticketId}.md`

**MCP Tools Used**:
- `get_work_item_pull_requests(workItemId)` - Get all PRs for a work item
- `get_pull_request_files(repositoryId, pullRequestId)` - Get changed files
- `get_pull_request_file_diffs(repositoryId, pullRequestId)` - Optional: Get detailed diffs

**Analysis Sections**:
- 📊 Summary (PR count, files changed, impact areas)
- 📁 Changed Files by Category
- 🎯 Functionality Impacts (High/Medium/Low priority)
- 🧪 Testing Recommendations (Priority 1/2/3)
- 📋 Next Steps

---

## Combined Workflow

**Recommended workflow for ticket verification**:

```bash
# Step 1: Analyze what changed in PRs
/analyze-pr 14317

# Step 2: Generate targeted verification checklist
/create-checklist 14317
```

**Benefits**:
1. **analyze-pr** shows WHAT changed and WHERE
2. **create-checklist** shows HOW to test based on acceptance criteria
3. Combined: Complete picture of testing scope and priorities

---

## MCP Tools Reference

### Work Item Tools

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| `get_my_current_sprint_tickets` | `userEmail` | Array of work items | Get user's tickets in current sprint |
| `get_tickets_by_state` | `state` | Array of work items | Filter tickets by state |
| `get_work_item_details` | `id` | Work item details | Get full work item information |
| `get_current_sprint_info` | - | Sprint info | Current sprint metadata |
| `list_all_current_sprint_tickets` | - | All work items | All tickets in sprint |
| `query_tickets` | `query` | Filtered work items | Natural language query |

### Pull Request Tools

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| `get_work_item_pull_requests` | `workItemId` | Array of PRs | All PRs linked to work item |
| `get_pull_request_details` | `repositoryId`, `pullRequestId` | PR details | Full PR information |
| `get_pull_request_files` | `repositoryId`, `pullRequestId` | Array of file changes | Changed files in PR |
| `get_pull_request_file_diffs` | `repositoryId`, `pullRequestId` | Array of diffs | Detailed line-by-line diffs |

---

## Setup Requirements

### 1. Build the Project
```bash
npm run build
```

### 2. Configure MCP Server in Claude Code

Copy `mcp-config.example.json` content into your Claude Code settings:

**Windows (VS Code/Claude Code Desktop)**:
- File → Preferences → Settings
- Search for "MCP Servers"
- Add configuration from `mcp-config.example.json`

**Or manually edit settings**:
- Location: `%APPDATA%\Code\User\settings.json` (VS Code)
- Location: `~/.claude/settings.json` (Claude CLI)

### 3. Restart Claude Code

After adding MCP server configuration, restart Claude Code to load the server.

### 4. Verify Setup

Try these commands to verify:
```
List all current sprint tickets
Get PRs for work item 14317
/analyze-pr 14317
/create-checklist 14317
```

---

## Cache Management

Work items are cached in `cache/work-items.json` for performance.

**Refresh cache**:
```bash
npm run refresh
```

**Query cache** (for debugging):
```bash
npm run query
```

The cache includes:
- Work item metadata (ID, title, state, assignedTo, etc.)
- Description and acceptance criteria
- Comments and discussion
- Development links (PRs and commits)

**Note**: PR file details are fetched in real-time via MCP tools, not cached.

---

## File Structure

```
azure-devops-mcp-server/
├── src/
│   ├── index.ts                    # MCP server entry point & tool definitions
│   ├── azure-devops-client.ts      # Azure DevOps API client
│   ├── utils/
│   │   ├── config.ts               # Environment config
│   │   ├── cache-manager.ts        # Cache utilities
│   │   └── logger.ts               # Logging utilities
│   └── scripts/
│       ├── refresh-cache.ts        # Cache refresh script
│       ├── query-cache.ts          # Cache query tool
│       └── analyze-pr-files.ts     # PR analysis helper script
├── .claude/
│   └── skills/
│       ├── create-checklist/
│       │   └── SKILL.md            # Checklist generation skill
│       └── analyze-pr/
│           └── SKILL.md            # PR analysis skill
├── cache/
│   └── work-items.json             # Cached work items
├── skill-result/
│   ├── create-checklist/           # Generated checklists
│   │   └── checklist-{id}.md
│   └── analyze-pr/                 # PR analyses
│       └── analyze-pr-{id}.md
├── mcp-config.example.json         # MCP server config template
├── MCP_SETUP.md                    # Setup instructions
└── SKILLS.md                       # This file
```

---

## Troubleshooting

### Skills Not Working

**Problem**: `/analyze-pr` or `/create-checklist` not recognized

**Solution**:
1. Check skills are in `.claude/skills/` directory
2. Verify SKILL.md files have correct frontmatter
3. Restart Claude Code

### MCP Tools Not Available

**Problem**: `get_work_item_pull_requests` not found

**Solution**:
1. Verify MCP server is in settings: `mcp-config.example.json`
2. Check server is running: `npm run build && npm start`
3. Restart Claude Code
4. Check Claude Code Developer Tools console for errors

### Cache Out of Date

**Problem**: Work item not found or has old data

**Solution**:
```bash
npm run refresh
```

### Permission Errors

**Problem**: 401 Unauthorized or 403 Forbidden

**Solution**:
1. Check Azure DevOps PAT token is valid
2. Verify token has "Code (Read)" and "Work Items (Read)" permissions
3. Update token in `.env` and `mcp-config.example.json`

---

## Development

### Adding New Tools

1. **Define tool schema** in `src/index.ts`:
   ```typescript
   {
     name: 'my_new_tool',
     description: 'What it does',
     inputSchema: {
       type: 'object',
       properties: { /* ... */ },
       required: [/* ... */]
     }
   }
   ```

2. **Implement handler** in `CallToolRequestSchema`:
   ```typescript
   case 'my_new_tool': {
     const arg = args.argName as string;
     // Implementation
     return { content: [{ type: 'text', text: result }] };
   }
   ```

3. **Add client method** (if needed) in `src/azure-devops-client.ts`

4. **Build and test**:
   ```bash
   npm run build
   # Restart Claude Code
   ```

### Adding New Skills

1. Create skill directory: `.claude/skills/my-skill/`
2. Create `SKILL.md` with frontmatter:
   ```markdown
   ---
   name: my-skill
   description: What it does
   argument-hint: '<args>'
   ---
   # Skill content
   ```
3. Restart Claude Code
4. Use: `/my-skill <args>`

---

## Best Practices

### For QA Workflow

1. **Always analyze PRs first**: Understand code changes before testing
2. **Use checklists systematically**: Don't skip sections
3. **Update checklists**: Adapt based on actual PR changes
4. **Cache management**: Refresh cache at sprint start
5. **Document findings**: Add notes to checklist items

### For Development

1. **Keep tools focused**: One tool = one responsibility
2. **Use caching wisely**: Cache work items, fetch PRs real-time
3. **Error handling**: Return helpful error messages
4. **Type safety**: Use TypeScript interfaces
5. **Logging**: Use logger for debugging, not console.log

---

## Future Enhancements

Potential improvements:

- [ ] Add `get_pull_request_comments` tool
- [ ] Generate diff summaries for large PRs
- [ ] Auto-update checklists when PRs change
- [ ] Integration with test management tools
- [ ] PR approval workflow automation
- [ ] Automated regression test suggestions
- [ ] Code coverage analysis integration

---

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/azure-devops-mcp-server/issues)
- **Documentation**: See `MCP_SETUP.md` for installation
- **Skills**: See `.claude/skills/*/SKILL.md` for usage

---

**Last Updated**: 2026-05-11
