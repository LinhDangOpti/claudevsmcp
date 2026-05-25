---
name: analyze-pr-changes
description: Analyze PR changes for Azure DevOps tickets and generate actionable QA checklist. Works from any directory using Pure MCP approach.
argument-hint: '<ticket-id>'
---

# Analyze PR Changes Skill

## Dependencies

- **MCP Server:** azure-devops (must be configured in .mcp.json)
- **MCP tools:** 
  - `mcp__azure-devops__get_work_item_pull_requests`
  - `mcp__azure-devops__get_pull_request_details`
  - `mcp__azure-devops__get_pull_request_files`
  - `mcp__azure-devops__get_pull_request_file_diffs`

## Purpose

Analyze Pull Request changes linked to Azure DevOps tickets to generate QA-ready testing checklist with:
- What code actually changed (file-by-file diff analysis)
- Which features are affected
- Actionable testing steps based on actual changes
- Priority classification (HIGH/MEDIUM/NONE)
- Scope assessment and risk level
- Changes beyond acceptance criteria

## When to Use

- Before QA testing a ticket
- To understand what code actually changed
- To generate testing checklist
- To identify scope of changes and potential risks
- To find out-of-scope changes needing additional testing

## Key Advantages (Pure MCP)

- ✅ **Works from any directory** - No need to be in target repo
- ✅ **No git dependency** - Pure Azure DevOps MCP approach
- ✅ **Fast parallel fetching** - All PR data in one call batch
- ✅ **QA-friendly output** - Actionable "How to test" steps
- ✅ **Token optimized** - Skip generated files, focus on implementation

## Workflow Overview

```
Pre-Flight → Fetch PRs → Parallel Fetch (Details + Files + Diffs) → Classify Files → Analyze Changes → Generate Checklist
```

---

## Execution Workflow

### Step 0: Pre-Flight Checks

**Input validation:**
- Accept `ticket_id` from user or skill arguments
- Format: `/analyze-pr-changes 14203` or user message "analyze PR changes for ticket 14364"

**MCP availability check:**
```typescript
if (!hasMCP('azure-devops')) {
  throw Error('❌ Azure DevOps MCP required. Please configure in .mcp.json');
}
```

---

### Step 1: Fetch Linked PRs

**Call Azure DevOps MCP:**
```typescript
const prs = await mcp__azure_devops__get_work_item_pull_requests({
  workItemId: ticketId
});

if (prs.length === 0) {
  return `### PRs Found (0)\nNo PRs found for ticket ${ticketId}.\n\nPossible reasons:\n- Ticket not started yet\n- PR not linked to ticket\n- PR in different repository`;
}

console.log(`📦 Repository: ${prs[0].repository.name}`);
console.log(`🔍 Found ${prs.length} PR(s)`);
```

---

### Step 2: Parallel Fetch All PR Data

**CRITICAL:** Fetch all data in parallel using single message with multiple MCP calls.

**For each PR, fetch 3 things simultaneously:**
```typescript
// Build array of all MCP calls
const allCalls = prs.flatMap(pr => [
  {
    tool: 'mcp__azure_devops__get_pull_request_details',
    params: {
      repositoryId: pr.repository.id,
      pullRequestId: pr.pullRequestId
    }
  },
  {
    tool: 'mcp__azure_devops__get_pull_request_files',
    params: {
      repositoryId: pr.repository.id,
      pullRequestId: pr.pullRequestId
    }
  },
  {
    tool: 'mcp__azure_devops__get_pull_request_file_diffs',
    params: {
      repositoryId: pr.repository.id,
      pullRequestId: pr.pullRequestId
    }
  }
]);

// Execute ALL calls in a single message (parallel)
// DO NOT call them sequentially - use parallel tool invocation
```

**Extract from results:**
- **Details:** PR title, description, status (merged/open), source/target branch
- **Files:** List of changed files + change type (add/edit/delete/rename)
- **Diffs:** Actual code changes for each file

---

### Step 3: Token Optimization - Smart File Filtering

**Skip these files entirely (no analysis needed):**
```typescript
function shouldSkip(filePath: string): boolean {
  return /\.(csproj|sln|user|generated\.cs)$/.test(filePath)
    || /^(bin|obj|packages|node_modules)\//.test(filePath)
    || filePath.includes('package-lock.json')
    || filePath.includes('packages.config')
    || filePath.includes('.min.js')
    || filePath.includes('.min.css');
}
```

**Analyze implementation files carefully:**
- `*.cs` services, controllers, models, blocks → Full diff analysis
- `*.cshtml` razor views → Full diff analysis
- `*.json` config files (appsettings, web.config) → Full diff analysis

**Skim test files only:**
- `*.test.cs`, `*Tests.cs` → Count +lines, note new test methods, DON'T analyze full diff
- Reason: Tests are verbose and rarely reveal new scenarios beyond implementation

**Target:** < 30K tokens per analysis (typical: 8-12 files)

---

### Step 4: Classify Files by Component

**Map each file to component category:**

| File Pattern | Category | Priority | Test Focus |
|--------------|----------|----------|------------|
| `ServiceCollectionExtensions.cs` | DI/Startup | HIGH | App startup, service registration |
| `Initialization/*.cs` | App Startup Module | HIGH | Routing, event handlers |
| `Configuration/*.cs` | Configuration | HIGH | Config-dependent features |
| `Infrastructure/**/*.cs` | Data Layer | HIGH | Database operations |
| `Application.Contracts/**/*.cs` | Service Contract | HIGH | All consumers of this service |
| `Models/Pages/*Page.cs` | CMS Page Type | MEDIUM | CMS editor + frontend |
| `Models/Blocks/*Block.cs` | CMS Block Type | MEDIUM | Block placement + rendering |
| `Controllers/Pages/*Controller.cs` | Page Controller | MEDIUM | Page rendering logic |
| `Controllers/Blocks/*Component.cs` | Block Component | MEDIUM | Block rendering |
| `Components/*ViewComponent.cs` | View Component | MEDIUM | Component usage |
| `WebAPI/Controllers/*.cs` | REST API | MEDIUM | API endpoint + frontend |
| `Plugins/**/*.cs` | CMS Plugin | MEDIUM | CMS admin functionality |
| `Application/**/*Service.cs` | Application Service | MEDIUM | Features using service |
| `Business/EPiForms/*.cs` | Forms Processing | MEDIUM | Form submission flow |
| `Schedulers/*.cs`, `ScheduledJobs/*.cs` | Scheduled Job | MEDIUM | Job execution |
| `GSTSearch/**/*.cs` | GST Search | MEDIUM | Search functionality |
| `FindSearch/**/*.cs` | Find Search | MEDIUM | Search/filtering |
| `Static/**/*.js`, `Static/**/*.css` | Frontend Assets | MEDIUM | Browser UI/interactions |
| `wwwroot/ClientResources/*.js` | CMS Client Scripts | MEDIUM | CMS editor UI |
| `Shared/*.cs`, `Abstractions/*.cs` | Shared/Cross-Cutting | HIGH | All consumers |
| `**/*.test.cs`, `**/*Tests.cs` | Tests | NONE | No user impact |

If file doesn't match any pattern → Category: "Other", Priority: MEDIUM, flag for review

---

### Step 5: Analyze Diffs for Change Patterns

**For each implementation file, detect change types:**

```typescript
const CHANGE_PATTERNS = {
  // Breaking changes (HIGH risk)
  interfaceChange: /interface\s+I\w+/,
  methodSignatureChange: /(public|protected)\s+\w+\s+\w+\s*\([^)]*\)/,
  
  // DI changes (HIGH risk)
  diRegistration: /services\.Add\w+(<[\w,\s]+>)?/,
  httpClientConfig: /AddHttpClient|HttpClient.*Timeout/,
  
  // Configuration changes (MEDIUM-HIGH risk)
  configSection: /"[\w:]+"\s*:\s*{/,
  appSettings: /Configuration\[/,
  
  // Data model changes (MEDIUM risk)
  propertyAdded: /public\s+\w+\s+\w+\s*{\s*get;/,
  attributeAdded: /\[\w+(\([^\]]*\))?\]/,
  
  // Safety improvements (LOW risk)
  nullCheck: /if\s*\([^)]*==\s*null\)|[?]\./,
  tryParse: /\.TryParse\(/,
  
  // Potential issues (flag for review)
  todoComment: /\/\/\s*(TODO|FIXME|HACK)/,
  commentedCode: /\/\/\s*(var|public|private|protected)\s+\w+/
};

function analyzeChange(filePath: string, diff: string) {
  const detected = [];
  
  if (CHANGE_PATTERNS.interfaceChange.test(diff)) {
    detected.push({ type: 'Interface Change', risk: 'HIGH' });
  }
  
  if (CHANGE_PATTERNS.diRegistration.test(diff)) {
    detected.push({ type: 'DI Registration', risk: 'HIGH' });
  }
  
  if (CHANGE_PATTERNS.nullCheck.test(diff)) {
    detected.push({ type: 'Null Safety', risk: 'LOW' });
  }
  
  // ... check other patterns
  
  return detected;
}
```

**Extract specific changes from diff:**
- Line numbers of changes
- Added/removed code snippets (keep concise - max 5 lines per snippet)
- Changed constants/config values
- New method calls or dependencies

---

### Step 6: Generate Actionable "How to Test"

**For each changed file, generate specific testing steps based on:**
1. File category (from classification table)
2. Actual changes detected (from diff analysis)
3. Change patterns found (interface change, DI, null safety, etc.)

**Template:**
```markdown
- [ ] **{Feature Name}** — {Component Category}
      Files: `{file1}` (+X/-Y lines), `{file2}` (+A/-B lines)
      
      **What changed (lines X-Y):**
      ```csharp
      {key code snippet showing the change - max 5 lines}
      ```
      
      **Change type:** {e.g., "DI registration + HTTP timeout change"}
      **Risk:** {HIGH/MEDIUM/LOW based on patterns detected}
      
      **How to test:**
      1. {Specific step 1 - include URL if applicable}
      2. {Specific step 2 - include expected result}
      3. {Specific step 3 - include edge case}
      4. {Browser DevTools check if relevant}
      
      **Environment:** https://test.wcm.ericsson.net{/path}
```

**Enhance generic steps with diff context:**

**Generic (before diff analysis):**
```markdown
How to test: Visit a page using Story block. Verify it renders correctly.
```

**Specific (after diff analysis):**
```markdown
How to test:
1. Test Story block WITH image → verify renders correctly
2. Test Story block WITHOUT image → verify no errors (new null check at line 23)
3. Check responsive CSS on mobile/desktop (updated classes line 27-31)
Risk: LOW (defensive code, backwards compatible)
```

---

### Step 7: Identify Changes Beyond AC

**Compare PR changes with ticket scope:**
- Flag files/changes in different feature areas than AC describes
- Flag shared utility refactors not mentioned in AC
- Flag config changes not in AC (timeouts, endpoints, feature flags)
- Flag new dependencies or service registrations

**Output as separate section:**
```markdown
### ⚠️ Changes Beyond Acceptance Criteria

**AC asked for:**
- ✅ {Item from AC}
- ✅ {Another item from AC}

**PRs also implemented:**
- ⚠️ **{Out-of-scope change}** — NOT mentioned in AC
  - **Impact:** {Who/what is affected}
  - **Needs testing:** {Additional testing required}
```

---

### Step 8: Assess Scope

**Calculate scope level:**
```typescript
function assessScope(files: ChangedFile[], changePatterns: ChangePattern[]) {
  const fileCount = files.filter(f => !shouldSkip(f.path)).length;
  const hasSharedChanges = files.some(f => 
    f.path.includes('Shared/') ||
    f.path.includes('Extensions/') ||
    f.path.includes('ServiceCollectionExtensions.cs')
  );
  const hasBreakingChanges = changePatterns.some(p => p.risk === 'HIGH');
  
  if (fileCount < 5 && !hasSharedChanges && !hasBreakingChanges) {
    return {
      scope: 'ISOLATED',
      effort: '1-2 hours',
      reason: `${fileCount} files, single feature, low risk`
    };
  }
  
  if (fileCount > 15 || hasSharedChanges || hasBreakingChanges) {
    return {
      scope: 'BROAD',
      effort: '6-8 hours',
      reason: `${fileCount} files${hasSharedChanges ? ', shared utilities' : ''}${hasBreakingChanges ? ', breaking changes' : ''}`
    };
  }
  
  return {
    scope: 'MODERATE',
    effort: '3-5 hours',
    reason: `${fileCount} files, related features`
  };
}
```

---

### Step 9: Save and Present Results

**Save markdown report:**
```typescript
const reportPath = `skill-result/analyze-pr-changes/analyze-pr-changes-${ticketId}.md`;
await Write({ file_path: reportPath, content: generatedReport });
```

**Present concise summary to user:**
```markdown
✅ Analysis complete for ticket #{ticketId}

📊 **Summary:**
- PRs found: {count}
- Files changed: {count} ({+additions}/-{deletions} lines)
- Scope: {ISOLATED/MODERATE/BROAD}
- Estimated testing effort: {hours}

📝 Full report saved to: {reportPath}

🔴 **HIGH Priority items:** {count}
🟡 **MEDIUM Priority items:** {count}
⚠️ **Changes beyond AC:** {count}
```

---

## Output Format

```markdown
## Affected Features Report — Ticket #{ticketId}

**Data source:** Azure DevOps PR #{number} ({status})
**Repository:** {repoName}
**Files changed:** {count} (+{additions}/-{deletions} lines)
**Scope:** {ISOLATED/MODERATE/BROAD}
**Estimated testing effort:** {hours}

---

### 📊 File Classification

**{Category}** — {count} files ({priority} priority)
- ✅ `NewFile.cs` (+234/-0, NEW)
- ✏️ `ExistingFile.cs` (+12/-5)
- ❌ `RemovedFile.cs` (-45 lines)

---

### 🔴 HIGH Priority — Test These First

- [ ] **{Feature Name}** — {Component Category}
      Files: `{file}` (+X/-Y lines)
      
      **What changed (lines X-Y):**
      ```csharp
      {concise code snippet showing key change}
      ```
      
      **Change type:** {e.g., "DI registration", "Interface change"}
      **Risk:** HIGH
      **Dev test coverage:** {✅ Has tests / ⚠️ No tests found}
      
      **How to test:**
      1. {Specific actionable step with URL}
      2. {Expected result}
      3. {Edge case to verify}
      4. {DevTools check if relevant}
      
      **Environment:** https://test.wcm.ericsson.net{/path}

---

### 🟡 MEDIUM Priority

- [ ] **{Feature Name}** — {Component Category}
      Files: `{file}`
      
      **What changed:** {brief description}
      **Change type:** {type}
      **Risk:** MEDIUM
      
      **How to test:**
      1. {Step}
      2. {Step}

---

### ⚪ No User-Facing Impact

- `{TestFile.cs}` — unit tests only (dev coverage: ✅ good)
- `{ConfigFile}` — skipped (generated file)

---

### ⚠️ Changes Beyond Acceptance Criteria

**AC asked for:**
- ✅ {Item from AC}

**PRs also implemented:**
- ⚠️ **{Out-of-scope change}** — NOT in AC
  - **Impact:** {Who/what affected}
  - **Needs testing:** {Additional testing needed}

---

### 📈 Scope Assessment

**Scope:** {ISOLATED/MODERATE/BROAD}

**Justification:**
- {X} files changed across {Y} components
- {Includes/Excludes} shared utility changes
- {Has/No} breaking changes detected
- {Has/No} configuration changes

**Recommended testing effort:** {1-2 / 3-5 / 6-8} hours
- {X} hours: {Feature area}
- {Y} hours: {Another area}
- {Z} hours: Regression testing

---

### 🎯 Testing Alerts

- 🔥 **High-risk change:** {Description}
- 🆕 **New feature:** {Description}
- ✅ **Good coverage:** {Description}
- ⚠️ **Missing tests:** {Description}

---

### 📋 Quick Reference
- TEST environment: https://test.wcm.ericsson.net
- CMS admin: https://test.wcm.ericsson.net/episerver/cms
- {Other relevant URLs}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Azure DevOps MCP not available | Throw error with setup instructions |
| No PRs found for ticket | Return empty report with helpful message |
| PR files/diffs fetch failed | Skip that PR, continue with others |
| Diff too large (>1000 files) | Summarize by file count, note limitation |
| Invalid ticket ID | Return error with correct format example |

---

## Notes

- **No git dependency:** Pure Azure DevOps MCP approach
- **Works from anywhere:** No need to be in target repo directory
- **Token optimized:** Skip tests/generated files, focus on implementation
- **QA-friendly:** Actionable steps based on actual code changes
- **Fast:** Parallel MCP fetching (all PRs in single call batch)


