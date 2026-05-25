# Analyze PR Changes Skill

Generate actionable QA testing checklist from Azure DevOps PR changes. Works from any directory using Pure MCP approach.

## Quick Start

```bash
/analyze-pr-changes 14203
```

## What It Does

1. **Finds PRs** linked to Azure DevOps ticket
2. **Analyzes actual code changes** from PR diffs
3. **Classifies files** by component (DI/Startup, Controllers, Services, etc.)
4. **Detects change patterns** (interface changes, DI registration, null safety, etc.)
5. **Generates QA checklist** with specific testing steps based on actual changes
6. **Identifies scope** (ISOLATED/MODERATE/BROAD) and testing effort
7. **Flags out-of-scope changes** not mentioned in acceptance criteria

## Key Features

### ✅ Works Anywhere
- No need to be in target repository directory
- Pure Azure DevOps MCP approach (no git dependency)

### ⚡ Fast Parallel Fetching
- Fetches all PR data in single call batch
- Typical analysis: 2-3 seconds for 3 PRs

### 🎯 QA-Friendly Output
- Actionable "How to test" steps with URLs
- Specific edge cases based on code changes
- Priority classification (HIGH/MEDIUM/NONE)
- Estimated testing effort

### 🔍 Smart Diff Analysis
- Detects breaking changes (interface, DI, shared utilities)
- Identifies risk levels (HIGH/MEDIUM/LOW)
- Shows actual code snippets (concise, relevant)
- Flags TODO/FIXME comments

### 📊 Token Optimized
- Skips generated files, lock files
- Skims test files (counts lines, doesn't analyze full diffs)
- Focuses on implementation files
- Target: < 30K tokens per analysis

## Output Example

```markdown
## Affected Features Report — Ticket #14203

**Data source:** Azure DevOps PR #5678 (merged)
**Repository:** Ericsson.DotCom
**Files changed:** 12 (+342/-87 lines)
**Scope:** MODERATE
**Estimated testing effort:** 3-5 hours

---

### 📊 File Classification

**DI/Startup** — 1 file (HIGH priority)
- ✏️ `ServiceCollectionExtensions.cs` (+15/-3)

**Application Services** — 2 files (MEDIUM priority)
- ✅ `GleanSearchService.cs` (+234/-0, NEW)
- ✏️ `ContentSearchService.cs` (+12/-5)

**Tests** — 3 files (NO user impact)
- ✅ `GleanSearchServiceTests.cs` (+156/-0, NEW)

---

### 🔴 HIGH Priority — Test These First

- [ ] **Dependency Injection / Application Startup**
      Files: `ServiceCollectionExtensions.cs`
      
      **What changed (lines 47-49):**
      ```csharp
      + services.AddScoped<IGleanSearchService, GleanSearchService>();
      + services.AddHttpClient<GleanSearchService>(client => {
      +   client.Timeout = TimeSpan.FromSeconds(60);
      ```
      
      **Change type:** DI registration + HTTP timeout change
      **Risk:** HIGH (affects app startup + all HTTP clients)
      
      **How to test:**
      1. Deploy → restart application
      2. Check logs → verify no startup errors
      3. Test search → verify Glean results
      4. DevTools Network → timeout should be 60s
      5. Test other APIs → verify no timeout regressions
      
      **Environment:** https://test.wcm.ericsson.net

---

### ⚠️ Changes Beyond Acceptance Criteria

**AC asked for:**
- ✅ Integrate Glean search API

**PRs also implemented:**
- ⚠️ **HTTP timeout change** (30s → 60s) — NOT in AC
  - **Impact:** ALL HttpClient instances globally
  - **Needs testing:** All API integrations
```

## Comparison with Other Skills

| Feature | analyze-pr | analyze-pr-changes | affected-features |
|---------|-----------|-------------------|------------------|
| **Input** | Ticket ID | Ticket ID | Ticket ID or branch |
| **Works from any dir** | ❌ | ✅ | ❌ (needs git repo) |
| **Analyzes diffs** | ✅ | ✅ | ❌ (file paths only) |
| **QA checklist** | ❌ | ✅ | ✅ |
| **Change detection** | Basic | Advanced (patterns) | None |
| **Token usage** | ~30K | ~30K (optimized) | ~5K |
| **Speed** | Moderate | Fast (parallel) | Fast |
| **Actionable steps** | ❌ | ✅ | ✅ |

## When to Use

### Use `analyze-pr-changes` when:
- ✅ You need QA testing checklist
- ✅ You want to understand actual code changes
- ✅ You're not in the target repository directory
- ✅ You need scope assessment and risk levels
- ✅ You want to find out-of-scope changes

### Use `analyze-pr` when:
- You need knowledge base integration (Ericsson-specific)
- You want downstream dependency analysis from docs

### Use `affected-features` when:
- You're already in the target git repository
- You only need file-path-based analysis (faster)
- PRs not yet created/linked

## Requirements

### Azure DevOps MCP Configuration

In `.mcp.json`:
```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": ["path/to/azure-devops-mcp-server/build/index.js"],
      "env": {
        "AZURE_DEVOPS_ORG_URL": "https://dev.azure.com/your-org",
        "AZURE_DEVOPS_PAT": "your-personal-access-token",
        "AZURE_DEVOPS_PROJECT": "YourProject"
      }
    }
  }
}
```

### Required MCP Tools

The skill uses these Azure DevOps MCP tools:
- `mcp__azure-devops__get_work_item_pull_requests`
- `mcp__azure-devops__get_pull_request_details`
- `mcp__azure-devops__get_pull_request_files`
- `mcp__azure-devops__get_pull_request_file_diffs`

## Usage Examples

### Basic Usage
```bash
/analyze-pr-changes 14203
```

### What User Sees
```
✅ Analysis complete for ticket #14203

📊 Summary:
- PRs found: 2
- Files changed: 12 (+342/-87 lines)
- Scope: MODERATE
- Estimated testing effort: 3-5 hours

📝 Full report saved to: skill-result/analyze-pr-changes/analyze-pr-changes-14203.md

🔴 HIGH Priority items: 1
🟡 MEDIUM Priority items: 8
⚠️ Changes beyond AC: 1
```

### User can then read full report
```bash
# Report is auto-saved to:
skill-result/analyze-pr-changes/analyze-pr-changes-14203.md
```

## Error Handling

### No MCP Configured
```
❌ Azure DevOps MCP not found. Add to .mcp.json:
{
  "azure-devops": {
    "command": "node",
    "args": ["path/to/server/build/index.js"],
    ...
  }
}
```

### No PRs Found
```
### PRs Found (0)

No PRs linked to ticket 14203.

Possible reasons:
- Ticket not started yet
- PR not linked to work item
- PR in different Azure DevOps project
```

### Partial Failure
```
⚠️ 1 PR failed to fetch. Continuing with 2 successful PRs.
```

## Advanced Features

### File Classification
Automatically classifies 20+ file patterns:
- DI/Startup (HIGH priority)
- Application Services (MEDIUM)
- CMS Blocks/Pages (MEDIUM)
- REST APIs (MEDIUM)
- Tests (NONE - no user impact)

### Change Pattern Detection
Detects 10+ change patterns:
- Interface changes (HIGH risk)
- DI registration (HIGH risk)
- HTTP timeout changes (HIGH risk)
- Null safety improvements (LOW risk)
- TODO/FIXME comments (flag for review)

### Scope Assessment
Calculates scope based on:
- Number of files changed
- Shared utility modifications
- Breaking changes detected
- Configuration impact

**Scope Levels:**
- **ISOLATED:** < 5 files, single feature (1-2 hours)
- **MODERATE:** 5-15 files, related features (3-5 hours)
- **BROAD:** > 15 files or shared utilities (6-8 hours)

## Troubleshooting

### "MCP not available"
Check `.mcp.json` configuration and restart Claude Code

### "No PRs found" but PRs exist
Verify:
- PR is linked to work item in Azure DevOps
- You have access to the Azure DevOps project
- Ticket ID is correct

### "Diff too large"
PR has 1000+ files - skill will show summary only
(Fetching full diffs would exceed reasonable limits)

## Development

### File Structure
```
.claude/skills/analyze-pr-changes/
├── SKILL.md           # Main skill definition (loaded by Claude)
├── guideline.md       # Implementation guidelines (loaded by Claude)
└── README.md          # Documentation (this file)
```

### Token Budget
- Target: < 30K tokens per analysis
- Typical: 4-5K tokens for 12-file PR
- Maximum: 50K tokens (triggers warning)

### Performance
- Parallel fetching: 3 PRs × 3 calls = ~2-3 seconds
- Sequential would be: ~18 seconds
- **Always use parallel MCP calls!**
