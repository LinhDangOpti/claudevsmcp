---
name: affected-features
description: Identify which user-facing features to QA test based on a ticket number or branch name
prompt:
  - role: user
    content: |
      Identify all user-facing features that need QA testing based on the changed files in a ticket or branch.

      1. **Resolve the Input**
         - Check if the user provided an argument after `/affected-features`
         - Parse optional `--repo-path="path"` parameter for analyzing a different repository
         - If `--repo-path` is provided, set `REPO_PATH` variable and prefix all git commands with `git -C "{REPO_PATH}"`
         - If `--repo-path` is NOT provided, `REPO_PATH=""` and use git commands normally
         - Extract the ticket/branch argument (the non-flag argument):
           - If the argument is a pure number (e.g., `14203`), treat it as a ticket number
           - If it contains slashes or letter-dashes (e.g., `features/Vuong/162/14203-desc`), treat as a branch name
         - If no argument was given, detect current branch: `git -C "{REPO_PATH}" branch --show-current`
         
         Example usage:
         - `/affected-features 14310` — analyze ticket 14310 in current repo
         - `/affected-features 14310 --repo-path="E:\Coding\dotcom-net5"` — analyze ticket 14310 in dotcom-net5 repo
         - `/affected-features features/my-branch --repo-path="/path/to/repo"` — analyze specific branch in remote repo

      2. **Find the Branch and Changed Files**

         **Important:** If `REPO_PATH` is set, prefix ALL git commands below with `git -C "{REPO_PATH}"` instead of just `git`

         **Case A — Ticket number provided:**
         - Run: `git -C "{REPO_PATH}" branch -a --list "*{ticketNumber}*"` (or `git branch -a --list "*{ticketNumber}*"` if REPO_PATH is empty)
         - If one or more branches found, prefer the most specific local branch; use `remotes/origin/{branch}` if only remote branches exist
         - If NO branch found, search commit history:
           `git -C "{REPO_PATH}" log --all --oneline --grep="{ticketNumber}" -10`
         - If nothing found, report: "No branch or commit found for ticket {ticketNumber}" and stop

         **Case B — Branch name provided or current branch detected:**
         - Use the branch name directly

         **For any resolved branch — get changed files:**
         - First try: `git -C "{REPO_PATH}" diff origin/main...{branch} --name-only`
         - If that returns empty (branch already merged into main), run:
           `git -C "{REPO_PATH}" log origin/main --oneline --grep="{ticketNumber or last-segment-of-branch-name}" -5`
           to find the merge commit, then:
           `git -C "{REPO_PATH}" diff {mergeCommitHash}^1 {mergeCommitHash} --name-only`
         - If still empty, report: "No file changes detected. The ticket may not exist, not be started, or may have been reverted."

         **Multiple branches for the same ticket:**
         - Diff each branch and union all changed files; note which branch each file came from

      3. **Map Each Changed File to a User-Facing Feature**

         Apply the first matching rule to each file path. Extract feature names from the path segments shown in {braces}.

         **RULE 1 — Test files only (no user impact)**
         Pattern: path starts with `tests/`
         → No user-facing impact — omit from checklist

         **RULE 2 — DI / Service Registration**
         Pattern: `src/Ericsson.Website/Extensions/ServiceCollectionExtensions.cs`
         → Feature: "Dependency Injection / Application Startup"
         → Test: Restart the application. Verify all pages load and no startup exceptions occur. Check CMS admin loads.
         → Priority: HIGH

         **RULE 3 — App Startup / Initialization Modules**
         Pattern: `src/Ericsson.Website/Initialization/{ModuleName}.cs`
         → Feature: "{ModuleName} — Application Startup Module"
         → Test: Restart application. Verify behavior controlled by this module still works (routing, event handlers, indexing).
         → Priority: HIGH

         **RULE 4 — Configuration Classes**
         Pattern: `src/Ericsson.Configuration/` (any file)
         → Feature: "{filename without .cs} — Configuration"
         → Test: After deployment, verify the configured feature behaves correctly. Check appsettings for the relevant config section.
         → Priority: HIGH

         **RULE 5 — Infrastructure / Data Layer**
         Pattern: path starts with `src/Ericsson.Infrastructure/`
         → Feature: "Data / Repository Layer — {infer entity from path}"
         → Test: Verify all database-backed operations for the affected entity (create, read, update, delete as applicable).
         → Priority: HIGH

         **RULE 6 — Application Contracts (interfaces / DTOs)**
         Pattern: path starts with `src/Ericsson.Application.Contracts/{Feature}/`
         → Feature: "{Feature} — Service Contract / DTO"
         → Test: Test every feature that calls this service. Any consumer of this interface needs regression testing.
         → Priority: HIGH

         **RULE 7 — CMS Page Content Type**
         Pattern: `src/Ericsson.Core/Models/Pages/{Name}Page.cs`
         → Feature: "{Name} Page — CMS Content Type"
         → Test:
           (a) Open CMS editor → create or edit a {Name} page → verify all properties are editable and save correctly
           (b) View the published page on the website → verify it renders without errors
         → Priority: MEDIUM

         **RULE 8 — CMS Block Content Type**
         Pattern: `src/Ericsson.Core/Models/Blocks/{Name}Block.cs`
         → Feature: "{Name} Block — CMS Content Type"
         → Test:
           (a) Open CMS editor → place a {Name} block on a page → verify all properties are configurable and save correctly
           (b) View a page using this block on the website → verify it renders correctly
         → Priority: MEDIUM

         **RULE 9 — Page Controller**
         Pattern: `src/Ericsson.Website/Controllers/Pages/{Name}PageController.cs`
         → Feature: "{Name} Page — Page Rendering"
         → Test: Navigate to a {Name} page on the website. Verify page loads, data displays correctly, and no server errors occur.
         → Priority: MEDIUM

         **RULE 10 — Block Component**
         Pattern: `src/Ericsson.Website/Controllers/Blocks/{Name}BlockComponent.cs`
         → Feature: "{Name} Block — Block Rendering"
         → Test: Visit a page that contains a {Name} block. Verify the block renders correctly in all display options.
         → Priority: MEDIUM

         **RULE 11 — ViewComponent**
         Pattern: `src/Ericsson.Website/Components/{Name}ViewComponent.cs`
         → Feature: "{Name} — View Component"
         → Test: Visit a page that uses the {Name} component. Verify it renders and functions correctly.
         → Priority: MEDIUM

         **RULE 12 — REST API Controller**
         Pattern: `src/Ericsson.Website/WebAPI/Controllers/{Feature}` (any .cs file)
         → Feature: "{Feature} — REST API Endpoint"
         → Test: Test the affected API endpoint directly (browser DevTools Network tab or Postman). Also test the front-end feature that consumes this API.
         → Priority: MEDIUM

         **RULE 13 — CMS Admin Plugin**
         Pattern: `src/Ericsson.Website/Plugins/{PluginName}/` (any file)
         → Feature: "{PluginName} — CMS Admin Plugin"
         → Test: Log into CMS admin at /episerver/cms. Navigate to the {PluginName} plugin. Verify it loads and all functionality works correctly.
         → Priority: MEDIUM

         **RULE 14 — CMS Editor UI Extensions**
         Pattern: `src/Ericsson.Website/CmsEditorPlugins/`
         → Feature: "CMS Editor UI Extensions"
         → Test: Open CMS editor, edit a page. Verify the editor toolbar/UI enhancements work correctly.
         → Priority: MEDIUM

         **RULE 15 — Application Service Implementation**
         Pattern: `src/Ericsson.Application/{Feature}/` (any file)
         → Feature: "{Feature} — Application Service"
         → Test: Exercise any user-facing feature that depends on this service. Use /find-usage to locate controllers that inject it if unsure.
         → Priority: MEDIUM

         **RULE 16 — EPiForms Integration**
         Pattern: `src/Ericsson.Core/Business/EPiForms/`
         → Feature: "EpiServer Forms — Form Processing"
         → Test: Submit a form on the website. Verify form data is captured correctly, form confirmation/redirect works, and any email notifications are sent. Test all form field types if validation logic changed.
         → Priority: MEDIUM

         **RULE 17 — Core Business Logic**
         Pattern: `src/Ericsson.Core/Business/` (any sub-path not matched above)
         → Feature: "Core Business Logic — {subfolder name}"
         → Test: Identify what feature uses this logic (search for class name usage). Test that feature end-to-end.
         → Priority: MEDIUM

         **RULE 18 — Scheduled Jobs**
         Pattern: path contains `Schedulers/` or `ScheduledJobs/`
         → Feature: "{infer job name from file} — Scheduled Job"
         → Test: In CMS admin go to Admin > Scheduled Jobs. Find the job and run it manually. Verify it completes without errors and produces the expected result.
         → Priority: MEDIUM

         **RULE 19 — GST Site Search**
         Pattern: path starts with `src/Ericsson.GSTSearch/`
         → Feature: "GST Site Search"
         → Test: Use the site search on the website. Verify search results appear and are accurate. Test with known search terms.
         → Priority: MEDIUM

         **RULE 20 — Optimizely Find Search**
         Pattern: path starts with `src/Ericsson.FindSearch/`
         → Feature: "Optimizely Find Search (legacy)"
         → Test: Use the site search. Verify indexed content appears in results. Check any listing pages that use Find for filtering.
         → Priority: MEDIUM

         **RULE 21 — Frontend Static Assets (website JS/CSS)**
         Pattern: `src/Ericsson.Website/Static/`
         → Feature: "Frontend — Website UI"
         → Test: In a browser, visit pages that use the changed component or script. Check browser console for JS errors. Verify visual rendering and interactions work correctly.
         → Priority: MEDIUM

         **RULE 22 — CMS Client Resources**
         Pattern: `src/Ericsson.Website/wwwroot/ClientResources/`
         → Feature: "CMS Editor — Client-Side Scripts/Styles"
         → Test: Open CMS editor. Verify the editor UI loads without JS errors in the browser console. Test any editor interactions related to the changed script area.
         → Priority: MEDIUM

         **RULE 23 — Shared / Abstractions**
         Pattern: `src/Ericsson.Shared/` OR `src/Ericsson.Abstractions/` OR `src/Ericsson.Models/`
         → Feature: "Shared / Cross-Cutting — {infer from path}"
         → Test: Identify consumers via /find-usage. Test all features that use the changed type.
         → Priority: HIGH if interface/base class, MEDIUM if utility/extension method

         **RULE 24 — Catch-all**
         → Note the file path, describe what it appears to be from the path, and flag it for developer clarification.
         → Priority: MEDIUM

      4. **Consolidate and Deduplicate**
         - If multiple files map to the same feature, merge them into one checklist item listing all files
         - If both Application.Contracts AND Application changed for the same feature, list once at HIGH priority
         - If a Plugin has both backend and frontend files changed, treat as one plugin checklist item

      5. **Generate the Testing Report**

         Output a structured report in this exact format:

         ```
         ## Affected Features Report — [Ticket #{number} | Branch: {branch}]

         **Repository:** {REPO_PATH if set, otherwise "Current repository"}
         **Branch:** {branch-name}
         **Status:** [Active branch | Merged into main]
         **Changed files:** {count}

         ---

         ### HIGH Priority — Test These First
         - [ ] **{Feature Name}**
               Files: `{file1}`, `{file2}`
               What changed: {1-2 sentence plain-English summary of what the code does}
               How to test: {Specific, actionable steps a tester can follow without reading code. Include URLs.}
               Environment: https://test.wcm.ericsson.net [+ /episerver/cms if CMS work]

         ### MEDIUM Priority
         - [ ] **{Feature Name}**
               Files: `{file}`
               What changed: {summary}
               How to test: {steps}
               Environment: {url}

         ### No User-Facing Impact
         - `{file}` — test file only

         ---
         ### Quick Reference
         - Local website: https://test.wcm.ericsson.net
         - CMS admin: https://test.wcm.ericsson.net/episerver/cms
         - Scheduled jobs: https://test.wcm.ericsson.net/episerver/cms#/scheduled-jobs
         ```

         Rules for the "What changed" and "How to test" fields:
         - Write in plain English — testers should not need to read code to follow the steps
         - "What changed" = describe the purpose/behavior of the code, not the code itself
         - "How to test" = specific, step-by-step actions (click here, type this, verify that)
         - Include concrete URLs, menu paths, and field names where possible
         - If the change is in a shared component, note which pages/features are most likely to show the effect

      6. **Handle Edge Cases**
         - **Multiple branches for same ticket:** Union all changed files, note source branch per file
         - **Already-merged ticket:** Note "Merged into main" in status, use merge commit diff
         - **No changes found:** "No file changes detected for this ticket/branch. Possible reasons: not yet started, rebased, or reverted."
         - **Current branch has no diff vs main:** "Current branch has no changes compared to origin/main. Are you on a feature branch?"
         - **Only test files changed:** "This ticket only modified test files. No user-facing features require QA verification."
---
