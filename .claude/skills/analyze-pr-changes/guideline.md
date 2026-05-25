# Analyze PR Changes - Implementation Guidelines

## Token Optimization Strategy

**Target:** < 30,000 tokens per analysis (typical: 8-12 changed files)

### File Filtering Rules

**SKIP entirely (no tokens spent):**
```typescript
const SKIP_PATTERNS = [
  /\.(csproj|sln|user|suo|cache)$/,
  /\.generated\.cs$/,
  /^(bin|obj|packages|node_modules)\//,
  /package-lock\.json$/,
  /packages\.config$/,
  /\.min\.(js|css)$/,
  /\.Designer\.cs$/,
  /\.g\.i?\.cs$/  // WPF/XAML generated files
];
```

**READ carefully (full diff analysis):**
- `*.cs` (services, controllers, models, blocks)
- `*.cshtml` (Razor views)
- `appsettings*.json`
- `web.config`
- `*.js` / `*.css` (non-minified)

**SKIM only (count lines, note method names):**
- `*.test.cs`
- `*Tests.cs`
- `*Test.cs`

**Why skim tests?**
- Test diffs are verbose (arrange/act/assert boilerplate)
- Rarely reveal new scenarios beyond implementation
- Still useful to know: "Dev added 45 lines of tests" = good coverage signal

### Token Budget Breakdown

For typical 12-file PR:
- PR metadata (title, desc, branch): ~500 tokens
- File classification: ~200 tokens
- Diff analysis (8 impl files × 50 lines avg): ~2,000 tokens
- Test file skims (4 files × 10 lines): ~200 tokens
- Generated output: ~1,500 tokens
- **Total:** ~4,400 tokens ✅

---

## Change Pattern Detection

### HIGH Risk Patterns

**Interface/Contract Changes:**
```csharp
// Adding new method to interface
interface IProductService {
+   Task<Product> GetBySlug(string slug);  // NEW - all implementations must add this
}

// Changing method signature
- Task<List<Product>> GetProducts(int page);
+ Task<PagedResult<Product>> GetProducts(int page, int pageSize);  // Breaking change
```
**Impact:** All implementations/consumers must be updated
**Testing:** Verify ALL usages still work

**DI Container Changes:**
```csharp
// In ServiceCollectionExtensions.cs
+ services.AddScoped<IGleanService, GleanService>();           // New service
+ services.AddHttpClient<ApiClient>(client => {
+     client.Timeout = TimeSpan.FromSeconds(60);              // Timeout change affects ALL HttpClients
+ });
```
**Impact:** Application startup + all HttpClient instances
**Testing:** Restart app, verify startup + all API calls

**Shared Utility Changes:**
```csharp
// In Shared/Extensions/StringExtensions.cs
- public static string Truncate(this string str, int length)
+ public static string Truncate(this string str, int length, string suffix = "...")  // Default added
```
**Impact:** All files calling this method (potentially hundreds)
**Testing:** Regression test common scenarios using this utility

### MEDIUM Risk Patterns

**Configuration Changes:**
```json
// appsettings.json
"Search": {
-   "Provider": "Optimizely.Find",
+   "Provider": "Glean",
    "Timeout": 30
}
```
**Impact:** Features reading this config
**Testing:** Verify config-dependent features still work

**Property Additions:**
```csharp
public class StoryBlock : BlockData {
    public string Title { get; set; }
+   public string? ImageUrl { get; set; }  // New optional property
}
```
**Impact:** CMS editor + frontend rendering
**Testing:** Create/edit with and without new property

### LOW Risk Patterns

**Null Safety Improvements:**
```csharp
- <img src="@Model.ImageUrl" />
+ @if (!string.IsNullOrEmpty(Model.ImageUrl)) {
+     <img src="@Model.ImageUrl" />
+ }
```
**Impact:** Prevents crashes, backwards compatible
**Testing:** Test with null/empty values

**Code Cleanup:**
```csharp
- var result = service.GetData();
- return result;
+ return service.GetData();  // Simplified
```
**Impact:** None (behavior unchanged)
**Testing:** Minimal (rely on existing tests)

---

## Identifying "Changes Beyond AC"

A change is **beyond AC** if:

### 1. Feature Area Mismatch
**AC:** "Add Glean search integration"
**PR also changes:** `StoryBlock.cs`, `ProductController.cs`
→ Flag: Story block and product changes not mentioned in AC

### 2. Shared Component Refactors
**AC:** "Fix bug in product detail page"
**PR changes:** `Shared/Extensions/StringExtensions.cs`
→ Flag: Shared utility affects more than just product page

### 3. Configuration Changes
**AC:** "Update search API endpoint"
**PR changes:** `appsettings.json` → HTTP timeout from 30s to 60s
→ Flag: Timeout change not in AC, affects all APIs

### 4. Dependency Additions
**AC:** "Display product reviews"
**PR adds:** New NuGet package `Serilog.Sinks.Elasticsearch`
→ Flag: Logging infrastructure change not in AC

### 5. Breaking Changes
**AC:** "Add sorting to product list"
**PR changes:** `IProductService` interface signature
→ Flag: Interface change affects all consumers, not just sorting

---

## Actionable Testing Steps

### Generic → Specific Transformation

**Generic (bad):**
```markdown
How to test: Test the Story block feature
```

**Specific (good):**
```markdown
How to test:
1. CMS: https://test.wcm.ericsson.net/episerver/cms
2. Edit existing Story block WITH image → verify saves & displays
3. Create new Story block WITHOUT image → verify no errors (new null check)
4. Frontend → check mobile + desktop responsive layout
5. Browser console → verify no JavaScript errors
```

### Testing Step Template

```markdown
**How to test:**
1. {Environment + URL}
2. {Setup/navigation step}
3. {Action that triggers changed code}
4. {Expected result - be specific}
5. {Edge case related to change}
6. {DevTools check if relevant}
```

### When to Include DevTools Steps

**Include for:**
- API changes → Network tab, response inspection
- JavaScript changes → Console tab, error checking
- CSS changes → Elements tab, computed styles
- Performance changes → Performance tab, timing

**Example:**
```markdown
4. Browser DevTools → Network tab:
   - Find request to `/api/glean/search`
   - Verify response status 200
   - Check response time < 3 seconds
5. Browser DevTools → Console tab:
   - Verify no errors during search
```

---

## Scope Assessment Logic

### ISOLATED (< 5 files, single feature)
```
Files: 3
- ProductController.cs
- ProductService.cs
- ProductView.cshtml

Justification: All files in single feature area (product), no shared changes
Testing effort: 1-2 hours (focused on product feature only)
```

### MODERATE (5-15 files, related features)
```
Files: 9
- SearchController.cs
- GleanService.cs (NEW)
- ContentSearchService.cs
- appsettings.json (timeout change)
- 5 view files

Justification: Search-related features, config change has moderate scope
Testing effort: 3-5 hours (search features + config impact)
```

### BROAD (> 15 files OR shared utilities)
```
Files: 7 (but includes shared utilities)
- ServiceCollectionExtensions.cs  ← Affects entire app
- Shared/Extensions/StringExtensions.cs  ← Used by 50+ files
- 5 feature files

Justification: Shared utility changes affect many features
Testing effort: 6-8 hours (feature testing + broad regression)
```

**Key factors:**
- File count
- Shared/cross-cutting changes
- Breaking changes (interface, DI)
- Configuration changes with broad impact

---

## Error Handling & Recovery

### Graceful Degradation

```typescript
// Step 1: Try to fetch PRs
let prs;
try {
  prs = await mcp__azure_devops__get_work_item_pull_requests({ workItemId });
} catch (error) {
  return `❌ Failed to fetch PRs: ${error.message}\n\nPlease verify:\n- Azure DevOps MCP is configured in .mcp.json\n- Ticket ID ${workItemId} exists\n- You have access to the project`;
}

// Step 2: Handle empty results
if (prs.length === 0) {
  return `### PRs Found (0)\n\nNo PRs linked to ticket ${workItemId}.\n\nPossible reasons:\n- Ticket not started\n- PR not linked to work item\n- PR in different Azure DevOps project`;
}

// Step 3: Partial failure handling
const results = await Promise.allSettled([...allMcpCalls]);
const successful = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');

if (failed.length > 0) {
  console.warn(`⚠️ ${failed.length} PR(s) failed to fetch. Continuing with ${successful.length} successful.`);
}
```

### Common Error Messages

| Error | User-Friendly Message |
|-------|----------------------|
| MCP not configured | ❌ Azure DevOps MCP not found. Add to `.mcp.json`: `{"azure-devops": {...}}` |
| Invalid ticket ID | ❌ Ticket ${id} not found. Format should be a number (e.g., 14203) |
| No PRs found | 📭 No PRs linked to ticket. Has development started? |
| PR diff too large | ⚠️ PR has 1000+ files. Showing summary only (full diff would exceed limits) |
| Network timeout | ⚠️ Azure DevOps API timeout. Retrying... |

---

## Performance Optimization

### Parallel Fetching (Critical!)

**❌ WRONG (Sequential - slow):**
```typescript
for (const pr of prs) {
  const details = await getPRDetails(pr.id);    // Wait
  const files = await getPRFiles(pr.id);        // Wait
  const diffs = await getPRDiffs(pr.id);        // Wait
}
// 3 PRs × 3 calls × 2 seconds = 18 seconds total
```

**✅ CORRECT (Parallel - fast):**
```typescript
const allCalls = prs.flatMap(pr => [
  { tool: 'get_pull_request_details', params: {...} },
  { tool: 'get_pull_request_files', params: {...} },
  { tool: 'get_pull_request_file_diffs', params: {...} }
]);

// All calls in single message - Claude Code executes in parallel
// 3 PRs × 3 calls in parallel = ~2-3 seconds total
```

### Diff Analysis Optimization

**Skip large diffs:**
```typescript
if (diff.additions + diff.deletions > 500) {
  return `⚠️ Large diff (${diff.additions}+/${diff.deletions}-). Summary: ${file.status} operation on ${file.path}`;
}
```

**Extract key snippets only:**
```typescript
// Don't include entire diff in output
// Extract only changed method signatures, config values, etc.
const keyChanges = extractKeyChanges(diff);  // Max 5 lines per file
```

---

## Testing Priorities

### Always HIGH Priority

1. **Application Startup Changes**
   - ServiceCollectionExtensions.cs
   - Program.cs / Startup.cs
   - Initialization modules

2. **Interface/Contract Changes**
   - Any file in `Application.Contracts/`
   - Interface definitions

3. **Database Schema Changes**
   - Migrations
   - Entity models with attributes

4. **Shared Utilities**
   - Files in `Shared/`, `Extensions/`, `Helpers/`

### Conditional HIGH Priority

- **Config changes affecting multiple features**
- **Changes with no test coverage** (risky)
- **Changes in files with >10 dependents** (broad impact)

### Usually MEDIUM Priority

- Feature-specific controllers/services
- CMS content types (pages/blocks)
- View files (*.cshtml)
- Frontend scripts/styles

### Always NO Impact

- Test files only
- Documentation changes
- Generated files
