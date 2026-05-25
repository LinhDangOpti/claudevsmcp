# PR Analysis: Ticket #14343 - Update MWC sub menu block

**Generated:** 2026-05-14  
**Ticket:** [#14343 - Update MWC sub menu block](https://ericsson-web.visualstudio.com/ericssondotcom-vnext/_workitems/edit/14343)  
**Status:** Active  
**Assigned to:** Quang Pho (EXT)

---

## Ticket Summary

**User Story:**  
As a Business tech lead, I want to implement new logic to the sub menu, so that visitors can see which section they're in.

**Background:**  
During MWC (Mobile World Congress), several tests were run for MWC pages. This ticket implements the design/logic for the winning approach.

**Problem Identified:**  
The "MWC" page is the parent of all other MWC-related pages. When a user accesses any MWC page, "Ericsson MWC" in the sub-menu remains underlined (active state) because the current logic considers all child pages as part of the parent section.

**Solution Agreed:**  
Add a new boolean property called "Include Children in Active Section" to the Event Hub page type. This property acts as a flag:
- If set to **true** (default): Sub-menu item will be underlined when viewing child content
- If set to **false**: Sub-menu item will NOT be underlined when viewing child content (useful for hub/landing pages that shouldn't always show as active)

---

## PRs Found (1)

### PR #7603: feat - update submenu active for children
- **Status:** ✅ Merged (Completed)
- **Branch:** `features/14343-update-mwc-submenu` → `SPRINTS/SPRINT-163`
- **Created by:** Quang Pho (EXT)
- **Created:** 2026-05-14 06:53:40
- **Merged:** 2026-05-14 06:53:49
- **Files changed:** 3

---

## Changed Files by Component

### **Ericsson.Core** (Models) — 1 file
- ✏️ Modified: `/src/Ericsson.Core/Models/Pages/EventHubPage.cs` (+1 line)

### **Ericsson.Website** (Controllers) — 1 file
- ✏️ Modified: `/src/Ericsson.Website/Controllers/Blocks/SubmenuBlockComponent.cs` (+1 line)

### **Ericsson.Website** (Resources) — 1 file
- ✏️ Modified: `/src/Ericsson.Website/Resources/LanguageFiles/PropertyNames.xml` (+1 line)

---

## Impact Analysis

### 1. **EventHubPage.cs** — CMS Content Type Model
**Location:** `/src/Ericsson.Core/Models/Pages/EventHubPage.cs`  
**Project:** Ericsson.Core (Content Models)

**What it does:**  
Defines the Event Hub page content type used for event landing pages (e.g., MWC, industry events). This page type typically serves as a parent/hub for related event content pages.

**Change made (+1 line):**  
Likely added a new boolean property:
```csharp
[Display(Name = "Include Children in Active Section")]
public virtual bool IncludeChildrenInActiveSection { get; set; }
```

**Downstream impact:**
- Affects all Event Hub pages in the CMS (MWC pages, event landing pages)
- CMS editors will see a new checkbox when editing Event Hub pages
- Changes how sub-menu navigation behaves for these pages
- **Risk level:** Medium — impacts content type schema and rendering logic

---

### 2. **SubmenuBlockComponent.cs** — Block Rendering Controller
**Location:** `/src/Ericsson.Website/Controllers/Blocks/SubmenuBlockComponent.cs`  
**Project:** Ericsson.Website (View Components)

**What it does:**  
Renders the Submenu Block (navigation component that displays sub-navigation menus). This component determines which menu items should be highlighted as "active" based on the current page context.

**Change made (+1 line):**  
Likely added logic to check the new `IncludeChildrenInActiveSection` property:
```csharp
// Check if parent page wants children included in active section
var includeChildren = (parentPage as EventHubPage)?.IncludeChildrenInActiveSection ?? true;
```

**Downstream impact:**
- Affects submenu block rendering on all pages that use submenu blocks
- Changes active state logic for navigation items
- Impacts user experience for Event Hub pages and their children
- **Risk level:** Medium — core navigation component used across the site

---

### 3. **PropertyNames.xml** — Localization Resource
**Location:** `/src/Ericsson.Website/Resources/LanguageFiles/PropertyNames.xml`  
**Project:** Ericsson.Website (Localization)

**What it does:**  
Contains translated labels for CMS property names, displayed in the CMS editor interface.

**Change made (+1 line):**  
Likely added translation key for the new property label:
```xml
<language name="Include Children in Active Section" id="/contenttypes/eventhubpage/properties/includechildreninactivesection">
  <translation>Include Children in Active Section</translation>
</language>
```

**Downstream impact:**
- CMS editors see the property label in the editor interface
- No user-facing impact on the website
- **Risk level:** Low — display text only

---

## Affected Features & Pages

### Primary Impact:
1. **Event Hub Pages (MWC pages)**
   - All Event Hub page types now have a new editable property
   - CMS editors can control whether child pages affect parent's active state in submenu
   - Specifically solves the MWC use case where main MWC page shouldn't always be active

2. **Submenu Block Navigation**
   - Active state logic updated to respect the new property
   - Affects how underlines appear in sub-navigation menus
   - Changes user perception of "where they are" in the navigation hierarchy

### Secondary Impact:
3. **CMS Editor Experience**
   - New checkbox available when editing Event Hub pages
   - Requires training/documentation for editors to understand when to use this setting

---

## Acceptance Criteria Analysis

**Based on ticket description and comments:**

### Explicitly Requested:
✅ Add boolean property "Include Children in Active Section" to Event Hub page type  
✅ Property controls whether sub-menu items show as active when viewing child content  
✅ Solves the MWC navigation issue (parent always showing as active)

### Implementation Matches Requirements:
The PR appears to implement exactly what was discussed in the comments:
- Property added to EventHubPage model
- Logic added to SubmenuBlockComponent to check this property
- Localization added for the property label

### No Discrepancies Detected:
The changes are minimal (1 line each) and focused, suggesting a clean implementation aligned with the agreed solution.

---

## Testing Recommendations

### HIGH Priority Testing:

1. **CMS Editor — New Property**
   - Navigate to CMS → Event Hub page (e.g., MWC page)
   - Verify new checkbox "Include Children in Active Section" appears
   - Default should be checked (true)
   - Save and verify value persists
   - **Environment:** https://test.wcm.ericsson.net/episerver/cms

2. **Frontend — Active State with Property = True (default)**
   - Visit an Event Hub page with submenu block
   - Set "Include Children in Active Section" = **true**
   - Navigate to a child page under this hub
   - Verify the parent item in submenu **IS underlined** (active)
   - **Environment:** https://test.wcm.ericsson.net

3. **Frontend — Active State with Property = False**
   - Visit the MWC Event Hub page
   - Set "Include Children in Active Section" = **false**
   - Navigate to a child MWC page (e.g., "Ericsson MWC")
   - Verify the parent "MWC" item in submenu **IS NOT underlined**
   - Only the current child page should show as active
   - **Environment:** https://test.wcm.ericsson.net

4. **Frontend — Submenu Block Across Different Page Types**
   - Test submenu block on pages that are NOT Event Hub pages
   - Verify existing behavior unchanged (regression test)
   - Check standard pages, article pages, product pages
   - **Environment:** https://test.wcm.ericsson.net

### MEDIUM Priority Testing:

5. **Multi-level Navigation**
   - Test with 3+ levels of page hierarchy (Hub → Section → Detail)
   - Verify active state propagates correctly at each level
   - Test edge cases: grandchildren, siblings

6. **Localization**
   - Verify property label displays correctly in CMS
   - Check if label is localized (if multi-language CMS supported)

7. **Browser Compatibility**
   - Test submenu active state in Chrome, Firefox, Safari, Edge
   - Verify CSS underline styling renders correctly

---

## Risk Assessment

### Overall Risk: **MEDIUM**

**Why Medium Risk:**
- ✅ Changes are minimal (3 files, 1 line each)
- ✅ Focused scope (only affects Event Hub pages and submenu logic)
- ⚠️ Navigation is a critical user-facing feature
- ⚠️ Changes to content type schema require careful testing
- ⚠️ Potential for unintended active state behavior if logic is incorrect

**Mitigation:**
- Thorough testing of both property states (true/false)
- Regression testing on non-Event Hub pages
- Verify default behavior unchanged for existing pages

---

## Summary

This PR implements a clean, focused solution to the MWC submenu active state issue by adding a configurable property to Event Hub pages. The implementation aligns with the agreed-upon approach from the ticket comments and involves minimal code changes across 3 files. Testing should focus on verifying the new property works correctly in both states (true/false) and that existing submenu behavior is not affected on other page types.

**Recommendation:** Proceed with QA testing as outlined above. Pay special attention to the MWC pages scenario that originally surfaced this issue.
