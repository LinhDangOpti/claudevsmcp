# PR Analysis for Ticket #14365: Bulk tagging content - cont 1

**Analysis Date:** 2026-05-14  
**Ticket State:** In ACC  
**Assignee:** Vuong Nguyen (EXT)

---

## PRs Found (3)

All PRs are **merged** and target the same branch from iterative refinements:

- **PR #7565:** feat: enhance BulkTaggingJob to support draft version updates and improve warning messages for tag actions
  - **Status:** Merged
  - **Branch:** `features/Vuong/163/14365-bulk-tagging-cont-1` → `SPRINTS/SPRINT-163`
  - **Merged:** 2026-05-06
  - **Files changed:** 1

- **PR #7570:** feat: adjust BulkTaggingJob to save published version before draft version for correct version panel order
  - **Status:** Merged
  - **Branch:** `features/Vuong/163/14365-bulk-tagging-cont-1` → `SPRINTS/SPRINT-163`
  - **Merged:** 2026-05-07
  - **Files changed:** 1

- **PR #7576:** feat: ensure draft saves have a later timestamp than published saves for correct version panel order
  - **Status:** Merged
  - **Branch:** `features/Vuong/163/14365-bulk-tagging-cont-1` → `SPRINTS/SPRINT-163`
  - **Merged:** 2026-05-07
  - **Files changed:** 1

---

## Changed Files by Component

**Ericsson.Website** — 1 file changed (3 incremental updates)
- ✏️ Modified: `/src/Ericsson.Website/Plugins/BulkTagging/ScheduledJobs/BulkTaggingJob.cs`
  - PR #7565: +1 line (draft version support + warning messages)
  - PR #7570: +1 line (save order adjustment)
  - PR #7576: +1 line (timestamp fix)

---

## Impact Analysis

### **BulkTaggingJob.cs** (`/src/Ericsson.Website/Plugins/BulkTagging/ScheduledJobs/BulkTaggingJob.cs`)
- **What it does:** Scheduled job that performs bulk tagging operations on content. Supports adding/replacing tags on multiple content items via Excel file upload.
- **Changes made:**
  1. **Draft version support** - Extended to update both draft AND published versions (not just published)
  2. **Save order fix** - Ensures published version is saved before draft version
  3. **Timestamp correction** - Guarantees draft saves have later timestamps than published saves
- **Why:** The version panel displays content versions chronologically. If draft has an earlier timestamp than published, the ordering appears incorrect in the CMS UI.
- **Downstream impact:**
  - **Content editors using bulk tagging feature** - Version history panel will now show correct chronological order
  - **Bulk tagging Excel upload workflow** - Both draft and published versions are updated in a single operation
  - **Version management UI** - Proper timestamp ordering prevents confusion in version history
- **Risk level:** **Medium**
  - Changes affect data persistence timing and versioning logic
  - Impacts all content items processed through bulk tagging
  - Small code changes but critical for data integrity

---

## Affected Features & Pages

1. **Bulk Tagging Tool** — Core functionality enhanced to support dual-version updates
   - Affected because: BulkTaggingJob now updates both draft and published versions simultaneously
   - Version panel ordering fix ensures correct display in CMS

2. **Content Version History Panel** — UI display order corrected
   - Affected because: Timestamp logic ensures draft appears after published in chronological view
   - Previously, draft might appear before published due to save timing

3. **Excel-based Tag Upload** — Warning messages improved
   - Affected because: PR #7565 mentions "improve warning messages for tag actions"
   - Related to validation issue noted in comments (3-item limit for "add" vs "replace" operations)

---

## Context from Ticket Comments

**Business requirement (May 8th):**  
> "For no 1 I can see that the draft is now updated, but can we make it so that **both the draft and current version is updated**?"

This is the primary driver for the changes - ensuring both versions are updated, not just draft.

**Validation concern (May 10th):**  
> "The error message is there, if I tried to 'add' more than 3 items, but I can select replace and add more than three items and all are added. Can we validate this already at upload of excel file?"

PR #7565's "improve warning messages" likely addresses this validation feedback.

**Latest update (May 11th):**  
Confirms the second point (validation) was also fixed and asks business to verify.

---

## Testing Recommendations

### High Priority
1. **Version panel ordering**
   - Upload Excel file with bulk tag operations
   - Verify version panel shows **published version BEFORE draft version** chronologically
   - Check that timestamps are correct (draft timestamp > published timestamp)

2. **Dual-version updates**
   - Perform bulk tagging operation
   - Verify BOTH published and draft versions receive the tag updates
   - Confirm tags are applied correctly to both versions

3. **Excel upload validation**
   - Test "add" operation with >3 items - should show validation error
   - Test "replace" operation with >3 items - should allow (or validate at upload if fixed)
   - Verify warning messages are clear and accurate

### Medium Priority
4. **Scheduled job execution**
   - Monitor BulkTaggingJob scheduled task execution
   - Check logs for any timing issues or errors
   - Verify job completes successfully with correct version ordering

5. **Content types coverage**
   - Test bulk tagging on different content types (pages, blocks, media)
   - Ensure version ordering works consistently across all types

### Low Priority
6. **Regression testing**
   - Verify existing bulk tagging functionality still works (basic add/replace operations)
   - Check that single-item tagging operations are unaffected

---

## Changes Beyond Original Ticket Scope

**Iterative refinements:**
The three PRs represent bug fixes discovered during implementation/testing:
1. PR #7565: Initial implementation - added draft version support
2. PR #7570: First fix - adjusted save order (published → draft)
3. PR #7576: Second fix - ensured timestamp ordering

**Additional validation improvements:**
PR #7565 mentions "improve warning messages" which addresses the Excel validation concern from ticket #13966 (comment no. 2).

---

## Discrepancies

**Ticket asks for:** Bulk tagging tool continuation from #13966  
**PRs implement:** 
- ✅ Dual-version updates (draft + published) - confirmed in comments as requested enhancement
- ✅ Version panel ordering fix (not explicitly in ticket but essential for correct UI)
- ✅ Warning message improvements (addresses validation issue from previous ticket)

**Additional testing needed:**
- Version timestamp ordering (technical fix, not user-facing requirement)
- Save sequence validation (published before draft)

**Scope alignment:** Changes align with business feedback provided during Sprint 163. The iterative nature (3 PRs fixing the same logic) suggests this was refined during development based on testing observations.

---

## Risk Assessment Summary

| Aspect | Risk Level | Notes |
|--------|-----------|-------|
| Code changes | Low | Small, focused modifications (3 lines total) |
| Data integrity | Medium | Affects version timestamps and save order |
| UI impact | Low | Fixes visual ordering, no breaking changes |
| Feature scope | Medium | Extends functionality to dual-version updates |
| Regression risk | Low | Isolated to bulk tagging scheduled job |

**Overall Risk:** **Medium** - Critical timing/ordering logic but well-isolated scope.

---

## Summary

Three incremental PRs fixed version ordering issues in the bulk tagging scheduled job. The main enhancement allows updating both draft and published versions simultaneously (per business request), with careful timestamp management to ensure correct chronological display in the version panel. Testing should focus on version ordering, dual-version updates, and Excel upload validation messages.
