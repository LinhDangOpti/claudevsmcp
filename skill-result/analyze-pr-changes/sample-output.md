## Affected Features Report — Ticket #14203

**Data source:** Azure DevOps PR #5678 (merged), PR #5690 (open)
**Repository:** Ericsson.DotCom
**Files changed:** 12 files (+342/-87 lines)
**Scope:** MODERATE
**Estimated testing effort:** 3-5 hours

---

### 📊 File Classification

**DI/Startup** — 1 file (HIGH priority)
- ✏️ `ServiceCollectionExtensions.cs` (+15/-3)

**Application Services** — 2 files (MEDIUM priority)
- ✅ `GleanSearchService.cs` (+234/-0, NEW)
- ✏️ `ContentSearchService.cs` (+12/-5)

**CMS Blocks** — 2 files (MEDIUM priority)
- ✏️ `StoryBlock.cs` (+2/-0)
- ✏️ `Views/Blocks/_StoryBlock.cshtml` (+8/-5)

**REST API** — 1 file (MEDIUM priority)
- ✏️ `WebAPI/Controllers/SearchController.cs` (+23/-8)

**Configuration** — 1 file (MEDIUM priority)
- ✏️ `appsettings.json` (+3/-1)

**Tests** — 3 files (NO user impact)
- ✅ `GleanSearchServiceTests.cs` (+156/-0, NEW)
- ✏️ `StoryBlockTests.cs` (+45/-0)
- ✏️ `SearchControllerTests.cs` (+34/-12)

**Skipped** — 2 files
- `packages.config` (dependency file)
- `Ericsson.Website.csproj` (project file)

---

### 🔴 HIGH Priority — Test These First

- [ ] **Dependency Injection / Application Startup**
      Files: `ServiceCollectionExtensions.cs` (+15/-3 lines)
      
      **What changed (lines 47-52):**
      ```csharp
      + services.AddScoped<IGleanSearchService, GleanSearchService>();
      + services.AddHttpClient<GleanSearchService>(client => {
      +   client.BaseAddress = new Uri("https://api.glean.com");
      +   client.Timeout = TimeSpan.FromSeconds(60);  // Changed from 30s
      + });
      ```
      
      **Change type:** DI registration + HTTP client configuration
      **Risk:** HIGH (affects application startup + all HTTP clients)
      **Dev test coverage:** ⚠️ No startup tests found
      
      **How to test:**
      1. Deploy to TEST environment → restart application
      2. Check application logs → verify no startup exceptions
      3. Navigate to https://test.wcm.ericsson.net → verify homepage loads
      4. Test search feature → verify Glean results appear
      5. Browser DevTools → Network tab → verify search requests timeout is 60s
      6. Test other API-dependent features → verify no timeout regressions
      
      **Environment:** https://test.wcm.ericsson.net

---

### 🟡 MEDIUM Priority

- [ ] **Glean Search — Application Service** (NEW FEATURE)
      Files: `GleanSearchService.cs` (+234 lines, NEW)
      
      **What changed:**
      - New service implementing `ISearchService` interface
      - Integrates with Glean API for enterprise search
      - Includes error handling, retry logic, and result caching
      - Methods: `SearchAsync()`, `GetSuggestionsAsync()`, `TrackSearchEvent()`
      
      **Change type:** New feature implementation
      **Risk:** MEDIUM (new code, external API dependency)
      **Dev test coverage:** ✅ Good (156 lines of unit tests added)
      
      **How to test:**
      1. Navigate to search page: https://test.wcm.ericsson.net/search
      2. Enter query "ericsson 5g" → verify results from Glean appear (look for Glean branding)
      3. Test edge cases:
         - Empty query → verify graceful error message
         - Special characters ("ericsson & nokia") → verify proper encoding
         - Very long query (200+ chars) → verify truncation or error
      4. Browser DevTools → Network tab:
         - Find request to `/api/glean/search`
         - Verify response status 200
         - Check response time < 3 seconds (timeout is 60s)
      5. Test search suggestions:
         - Type "eric" → verify autocomplete dropdown appears
         - Verify suggestions are relevant
      6. Verify tracking:
         - Perform search → check analytics events fired (if applicable)
      
      **Environment:** https://test.wcm.ericsson.net/search

- [ ] **Content Search Service — Enhanced**
      Files: `ContentSearchService.cs` (+12/-5 lines)
      
      **What changed (lines 34-38):**
      ```csharp
      - var results = await _findClient.SearchAsync<IContent>(query);
      + var gleanResults = await _gleanService.SearchAsync(query);
      + var findResults = await _findClient.SearchAsync<IContent>(query);
      + var results = MergeResults(gleanResults, findResults);
      ```
      
      **Change type:** Service integration (now calls two search providers)
      **Risk:** MEDIUM (behavior change in existing feature)
      **Dev test coverage:** ✅ Tests updated
      
      **How to test:**
      1. Perform search with various queries
      2. Verify results include content from BOTH Glean and Find
      3. Check result ordering/ranking is logical
      4. Test with queries that only Find has results for
      5. Test with queries that only Glean has results for
      6. Verify no duplicate results in merged list
      
      **Environment:** https://test.wcm.ericsson.net/search

- [ ] **Story Block — Block Rendering**
      Files: `StoryBlock.cs` (+2/-0), `_StoryBlock.cshtml` (+8/-5)
      
      **What changed (StoryBlock.cs line 12):**
      ```csharp
      + public string? ImageUrl { get; set; }  // Now nullable (was required)
      ```
      
      **What changed (_StoryBlock.cshtml lines 23-28):**
      ```razor
      + @if (!string.IsNullOrEmpty(Model.ImageUrl)) {
      +   <img src="@Model.ImageUrl" alt="@Model.Title" class="story-image" />
      + } else {
      +   <div class="story-image-placeholder"></div>
      + }
      - <img src="@Model.ImageUrl" alt="@Model.Title" />
      ```
      
      **Change type:** Defensive coding (null safety) + UI enhancement
      **Risk:** LOW (backwards compatible, improves robustness)
      **Dev test coverage:** ✅ Tests added for null scenario
      
      **How to test:**
      1. CMS Editor: https://test.wcm.ericsson.net/episerver/cms
      2. Edit existing Story block WITH image:
         - Verify image still displays correctly
         - Check image saves correctly
      3. Create new Story block WITHOUT image:
         - Leave ImageUrl empty
         - Save → verify no errors
         - View on frontend → verify placeholder appears (not broken image)
      4. Frontend → check responsive layout:
         - Desktop view
         - Tablet view
         - Mobile view
      5. Browser DevTools → Console → verify no JavaScript errors
      6. Browser DevTools → Elements → verify CSS classes applied:
         - `.story-image` for image scenario
         - `.story-image-placeholder` for no-image scenario
      
      **Environment:** 
      - CMS: https://test.wcm.ericsson.net/episerver/cms
      - Frontend: https://test.wcm.ericsson.net (any page with Story block)

- [ ] **Search API Endpoint**
      Files: `SearchController.cs` (+23/-8)
      
      **What changed (lines 45-52):**
      ```csharp
      - var results = await _searchService.SearchAsync(query);
      + var results = await _searchService.SearchAsync(query);
      + var enrichedResults = await EnrichWithMetadata(results);  // NEW
      + await _analytics.TrackSearch(query, results.Count);       // NEW
      + return Ok(enrichedResults);
      - return Ok(results);
      ```
      
      **Change type:** API response enhancement + analytics
      **Risk:** MEDIUM (API contract change if metadata structure differs)
      **Dev test coverage:** ✅ API tests updated
      
      **How to test:**
      1. Browser DevTools → Network tab
      2. Perform search on frontend
      3. Find API call to `/api/search?query={term}`
      4. Inspect response JSON:
         - Verify new metadata fields present (check structure matches expected)
         - Verify existing fields still present (backwards compatibility)
      5. Test various search terms:
         - Products: "ericsson router"
         - Articles: "5g network"
         - Mixed content
      6. Verify analytics:
         - Check application logs for tracking events
         - Or verify analytics dashboard (if applicable)
      
      **Environment:** https://test.wcm.ericsson.net/api/search

- [ ] **Search Configuration**
      Files: `appsettings.json` (+3/-1)
      
      **What changed (lines 78-81):**
      ```json
      "Search": {
      -   "Provider": "Optimizely.Find",
      +   "Providers": ["Glean", "Optimizely.Find"],
      +   "DefaultProvider": "Glean",
          "Timeout": 30
      }
      ```
      
      **Change type:** Configuration change (single → multiple providers)
      **Risk:** MEDIUM (config-dependent feature, could affect multiple areas)
      **Dev test coverage:** ⚠️ No config tests (config usually not unit tested)
      
      **How to test:**
      1. After deployment, verify configuration applied:
         - Check application logs on startup
         - Look for "Search providers initialized: Glean, Optimizely.Find"
      2. Test search uses Glean as default (verify via results branding)
      3. Test fallback scenario:
         - If possible, simulate Glean API failure
         - Verify search falls back to Find (or shows graceful error)
      4. Verify no regression in existing Find-based searches
      
      **Environment:** https://test.wcm.ericsson.net

---

### ⚪ No User-Facing Impact

- `GleanSearchServiceTests.cs` (+156 lines, NEW)
  - **Dev coverage:** ✅ Excellent (tests cover success, error, timeout, retry scenarios)
  
- `StoryBlockTests.cs` (+45 lines)
  - **Dev coverage:** ✅ Good (added tests for null ImageUrl scenario)
  
- `SearchControllerTests.cs` (+34/-12)
  - **Dev coverage:** ✅ Good (updated for API changes, added metadata tests)

- `packages.config` — Dependency version updates only
- `Ericsson.Website.csproj` — Project file (NuGet reference added)

---

### ⚠️ Changes Beyond Acceptance Criteria

**AC asked for:**
- ✅ Integrate Glean search API
- ✅ Add Story block image support

**PRs also implemented:**

- ⚠️ **HTTP client timeout change** (30s → 60s) — NOT mentioned in AC
  - **Impact:** Affects ALL HttpClient instances globally (not just Glean)
  - **Needs testing:** All API integrations and external service calls
  - **Justification:** Likely needed because Glean API is slower, but affects entire app
  
- ⚠️ **Search result metadata enrichment** — Enhancement beyond AC
  - **Impact:** API response structure changed
  - **Needs testing:** All consumers of search API (frontend components)
  - **Risk:** MEDIUM (could break frontend if not handled)
  
- ⚠️ **Analytics tracking for searches** — New functionality not in AC
  - **Impact:** Adds tracking events to search flow
  - **Needs testing:** Verify tracking works, check for PII in logged data
  - **Privacy concern:** Ensure user queries don't contain sensitive data before logging

---

### 📈 Scope Assessment

**Scope:** MODERATE

**Justification:**
- 12 files changed across 5 components (DI, Services, Blocks, API, Config)
- Includes 1 shared component change (ServiceCollectionExtensions)
- New external API integration (Glean - new dependency)
- Configuration change with application-wide impact (timeout)
- Existing feature modification (search now multi-provider)
- Good test coverage (3 test files updated/added)

**Recommended testing effort:** 4-6 hours
- 2 hours: Glean search integration (new feature, multiple scenarios)
- 1 hour: Story block changes (simple change, good test coverage)
- 1 hour: Search API changes (metadata enrichment, analytics)
- 1 hour: Regression testing (HTTP timeout impact, multi-provider search)
- 30 min: Configuration verification
- 30 min: Out-of-scope changes review

---

### 🎯 Testing Alerts

- 🔥 **High-risk change:** HTTP timeout change affects entire application (not just search)
- 🆕 **New external dependency:** Glean API (requires network access, API key)
- ⚠️ **API contract change:** Search results now include metadata (verify frontend handles it)
- ✅ **Good test coverage:** Dev added 235 lines of tests across 3 files
- 🔍 **Privacy check needed:** Search query tracking - ensure no PII logged
- ⚠️ **Out-of-scope work:** 3 changes not mentioned in AC need review

---

### 📋 Quick Reference
- **TEST environment:** https://test.wcm.ericsson.net
- **CMS admin:** https://test.wcm.ericsson.net/episerver/cms
- **Search page:** https://test.wcm.ericsson.net/search
- **Search API:** https://test.wcm.ericsson.net/api/search?query={term}
- **Application logs:** Check with DevOps or via monitoring dashboard

---

### 📝 Notes for QA

**Before testing:**
- Verify Glean API credentials configured in TEST environment
- Check if TEST environment has access to Glean API (network/firewall)
- Confirm timeout change deployed (check appsettings in TEST)

**During testing:**
- Keep browser DevTools open (Console + Network tabs)
- Compare results with PROD (if Glean only in TEST, compare Find results)
- Document any API errors or timeouts

**Regression areas:**
- Any feature using HttpClient (APIs, integrations, external services)
- Existing search functionality (should still work)
- Story blocks on existing pages (backwards compatibility)

**Potential issues to watch:**
- Glean API rate limiting (if test account has limits)
- Timeout too long (60s might be excessive, users might wait too long)
- Merged search results ordering (Glean vs Find ranking conflicts)
- Story block CSS placeholder styling (might not match design)
