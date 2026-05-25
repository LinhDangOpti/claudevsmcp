# PR Analysis: Ticket #13861 - Push information to Marketo

**Analysis Date**: 2026-05-25  
**Ticket**: #13861 - Push information to Marketo  
**Feature Branch**: features/13861-push-info-marketo

---

## PRs Found (7)

All PRs are **merged** to sprint branches.

### PR #7465 - Initial Refactor (Sprint 161)
- **Title**: #13861: refactor - marketo hidden form and marketo settings
- **Status**: Merged (2026-04-08)
- **Branch**: features/13861-push-info-marketo → SPRINTS/SPRINT-161
- **Files changed**: 5

### PR #7466 - Main Implementation (Sprint 163)
- **Title**: #13861: refactor - marketo hidden form and marketo settings
- **Status**: Merged (2026-05-06)
- **Branch**: features/13861-push-info-marketo → SPRINTS/SPRINT-163
- **Files changed**: 13

### PR #7490 - Marketo Info Push (Sprint 162)
- **Title**: #13861: marketo info push
- **Status**: Merged (2026-04-15)
- **Branch**: features/13861-push-info-marketo → SPRINTS/SPRINT-162
- **Files changed**: 8

### PR #7493 - jQuery to Fetch Migration (Sprint 162)
- **Title**: #13861: change from jquery into fetch
- **Status**: Merged (2026-04-15)
- **Branch**: features/13861-push-info-marketo → SPRINTS/SPRINT-162
- **Files changed**: 1

### PR #7515 - Session to Cookie Migration (Sprint 162)
- **Title**: #13861: refactor - move from session flag to cookies
- **Status**: Merged (2026-04-21)
- **Branch**: features/13861-push-info-marketo → SPRINTS/SPRINT-162
- **Files changed**: 6

### PR #7539 - ViewModel Fix (Sprint 162)
- **Title**: #13861: fix - use correct view model for marketo block
- **Status**: Merged (2026-04-28)
- **Branch**: features/13861-push-info-marketo → SPRINTS/SPRINT-162
- **Files changed**: 1

### PR #7617 - Email Domain Filtering (Sprint 163)
- **Title**: #13861: feat - add include/exclude email domain and account name for marketo hidden form submission
- **Status**: Merged (2026-05-21)
- **Branch**: features/13861-INT → SPRINTS/SPRINT-163
- **Files changed**: 3

---

## Changed Files by Component

### Ericsson.Core — 7 files
- ✏️ Modified: `Models/Blocks/MarketoSettingsBlock.cs`
- ✏️ Modified: `Models/Pages/SiteSettingsPage.cs`
- ✅ Added: `Models/ViewModels/Blocks/MarketoBlockViewModel.cs`
- ✏️ Modified: `Helpers/SessionHelper.cs`
- ✏️ Modified: `WebApi/Graph/ClaimConstants.cs`
- ✏️ Modified: `Global.cs`

### Ericsson.Website — 6 files
- ✏️ Modified: `Components/MarketoHiddenFormViewComponent.cs`
- ✏️ Modified: `Controllers/Blocks/MarketoBlockComponent.cs`
- ✏️ Modified: `WebAPI/Controllers/AccountControllers/AccountController.cs`
- ✏️ Modified: `Views/Shared/Components/MarketoHiddenForm/Default.cshtml`
- ✏️ Modified: `Views/Shared/Blocks/MarketoBlock.cshtml`
- ✏️ Modified: `Resources/LanguageFiles/PropertyNames.xml`

### Ericsson.Infrastructure — 1 file
- ✏️ Modified: `Extensions/CookieExtension.cs`

---

## Impact Analysis

### Core Domain Models

#### **MarketoSettingsBlock** (`Ericsson.Core/Models/Blocks/MarketoSettingsBlock.cs`)
- **What it does**: Content type/block for configuring Marketo integration settings in the CMS
- **Changes**: Added `HiddenFormId` property to configure the hidden form per Marketo instance
- **Downstream impact**: Site editors can now configure hidden form submission via CMS site settings
- **Risk level**: Low — configuration-only changes

#### **SiteSettingsPage** (`Ericsson.Core/Models/Pages/SiteSettingsPage.cs`)
- **What it does**: Site-wide settings page in Optimizely CMS
- **Changes**: Updated to include Marketo configuration options (likely email domain filters)
- **Downstream impact**: All pages/features that rely on site settings, specifically authentication and user tracking
- **Risk level**: Medium — central configuration point for site-wide behavior

#### **MarketoBlockViewModel** (`Ericsson.Core/Models/ViewModels/Blocks/MarketoBlockViewModel.cs`) — NEW FILE
- **What it does**: ViewModel for Marketo block rendering (separates presentation from domain model)
- **Changes**: New file added for proper MVVM architecture
- **Downstream impact**: Improved maintainability for Marketo block rendering
- **Risk level**: Low — new code, no modification to existing logic

### Session & Authentication

#### **SessionHelper** (`Ericsson.Core/Helpers/SessionHelper.cs`)
- **What it does**: Utility for managing user session state
- **Changes**: Likely removed session-based tracking flag for Marketo form submission (moved to cookies)
- **Downstream impact**: All session-dependent features should be unaffected (scope limited to Marketo tracking)
- **Risk level**: Low — isolated change for Marketo-specific session flag

#### **ClaimConstants** (`Ericsson.Core/WebApi/Graph/ClaimConstants.cs`)
- **What it does**: Defines constants for user claims (email, account name, etc.)
- **Changes**: May have added constants for extracting user email/account name for Marketo submission
- **Downstream impact**: User authentication and claims processing
- **Risk level**: Low — adding constants, not modifying existing authentication flow

#### **Global** (`Ericsson.Core/Global.cs`)
- **What it does**: Global constants and configuration values
- **Changes**: Added cookie name constant for Marketo form submission tracking (8-hour cookie)
- **Downstream impact**: Cookie-based deduplication across the site
- **Risk level**: Low — new constant for new feature

### Presentation & Controllers

#### **MarketoHiddenFormViewComponent** (`Ericsson.Website/Components/MarketoHiddenFormViewComponent.cs`)
- **What it does**: Renders the hidden Marketo form for signed-in users
- **Changes**: 
  - Added logic to check 4 conditions (eBiz access, Marketo configured, Hidden Form ID, not submitted)
  - Added email domain & account name filtering (include/exclude logic)
  - Changed from session-based to cookie-based submission tracking
- **Downstream impact**: Sign-in flow and user onboarding experience
- **Risk level**: High — core component for new Marketo integration feature

#### **MarketoBlockComponent** (`Ericsson.Website/Controllers/Blocks/MarketoBlockComponent.cs`)
- **What it does**: Controller for rendering Marketo blocks in the CMS
- **Changes**: Updated to use new MarketoBlockViewModel
- **Downstream impact**: Any page containing Marketo blocks
- **Risk level**: Low — refactoring to use proper ViewModel pattern

#### **AccountController** (`Ericsson.Website/WebAPI/Controllers/AccountControllers/AccountController.cs`)
- **What it does**: Handles user account API endpoints (sign-in, sign-out, profile, etc.)
- **Changes**: 
  - Added endpoint `/api/account/set-has-submitted-hidden-email-form`
  - Sets 8-hour cookie to prevent duplicate form submissions
  - Changed from session flag to cookie-based tracking
- **Downstream impact**: User authentication flow, sign-in/sign-out processes
- **Risk level**: Medium — modification to critical authentication controller

### Infrastructure & Utilities

#### **CookieExtension** (`Ericsson.Infrastructure/Extensions/CookieExtension.cs`)
- **What it does**: Extension methods for cookie management
- **Changes**: Added methods to set/get the Marketo submission tracking cookie (8-hour expiration)
- **Downstream impact**: All cookie-dependent features (authentication, preferences, tracking)
- **Risk level**: Low — new utility methods for new feature

### Views & Frontend

#### **MarketoHiddenForm/Default.cshtml** (`Ericsson.Website/Views/Shared/Components/MarketoHiddenForm/Default.cshtml`)
- **What it does**: Frontend template that renders the hidden Marketo form
- **Changes**: 
  - Updated JavaScript from jQuery to native Fetch API
  - Renders hidden form that auto-submits user email to Marketo
  - Calls `/api/account/set-has-submitted-hidden-email-form` on success
- **Downstream impact**: All pages where signed-in users with eBiz access land
- **Risk level**: Medium — client-side JavaScript executed on every eligible page load

#### **MarketoBlock.cshtml** (`Ericsson.Website/Views/Shared/Blocks/MarketoBlock.cshtml`)
- **What it does**: View template for visible Marketo form blocks (not the hidden form)
- **Changes**: Updated to use new MarketoBlockViewModel
- **Downstream impact**: Pages with Marketo form blocks (e.g., newsletter signup, contact forms)
- **Risk level**: Low — refactoring for better architecture

#### **PropertyNames.xml** (`Ericsson.Website/Resources/LanguageFiles/PropertyNames.xml`)
- **What it does**: Localization file for CMS property names
- **Changes**: Added labels for new Marketo settings (e.g., "Hidden Form ID", "Include Email Domains", "Exclude Account Names")
- **Downstream impact**: CMS editor experience (site settings UI)
- **Risk level**: Low — localization only

---

## Affected Features & Pages

### 1. **User Sign-In Flow** (HIGH IMPACT)
- **Why**: `AccountController` modified, hidden form submission triggers on sign-in
- **Affected Components**: MarketoHiddenFormViewComponent, AccountController
- **What to test**: 
  - Sign in with eBiz user → verify hidden form submission
  - Sign in with non-eBiz user → verify NO form submission
  - Sign in within 8 hours of previous submission → verify NO duplicate submission

### 2. **Site Settings & Configuration** (MEDIUM IMPACT)
- **Why**: `SiteSettingsPage` and `MarketoSettingsBlock` modified
- **Affected Components**: CMS Admin UI, site-wide Marketo config
- **What to test**:
  - Navigate to Site Settings → verify Marketo configuration fields appear
  - Configure Hidden Form ID → verify it saves correctly
  - Configure email domain include/exclude → verify validation works

### 3. **Marketo Form Blocks** (LOW IMPACT)
- **Why**: `MarketoBlockComponent` and `MarketoBlock.cshtml` refactored
- **Affected Components**: All pages with visible Marketo forms
- **What to test**:
  - Pages with Marketo form blocks → verify forms still render and submit correctly
  - No regression in existing Marketo form functionality

### 4. **MyEricsson Pages (All Pages with eBiz Users)** (HIGH IMPACT)
- **Why**: Hidden form renders on any page for signed-in eBiz users
- **Affected Components**: Every page after sign-in
- **What to test**:
  - Sign in and navigate to various pages → verify hidden form submission happens once
  - Browser DevTools → verify form POST to Marketo in Network tab
  - Verify _mkto_trk cookie is set

### 5. **Cookie & Session Management** (LOW IMPACT)
- **Why**: `CookieExtension`, `SessionHelper`, and `Global` modified
- **Affected Components**: Cookie-based features across the site
- **What to test**:
  - Verify new Marketo submission cookie is set with 8-hour expiration
  - Verify no interference with existing authentication cookies
  - Verify session behavior unchanged for other features

---

## Evolution of Implementation (PR Timeline)

### Phase 1: Initial Setup (PR #7465, #7466)
- Refactored Marketo settings to be per-instance in site settings
- Added `HiddenFormId` configuration property
- Created `MarketoHiddenFormViewComponent` for rendering hidden form

### Phase 2: Core Implementation (PR #7490)
- Implemented hidden form submission logic
- Added conditions: eBiz access, Marketo configured, form ID present, not submitted
- Initial session-based deduplication

### Phase 3: Frontend Migration (PR #7493)
- Migrated from jQuery to native Fetch API for form submission
- Modernized frontend code

### Phase 4: Deduplication Enhancement (PR #7515) — KEY CHANGE
- **Critical change**: Moved from session-based (20-min timeout) to cookie-based (8-hour) tracking
- Added `/api/account/set-has-submitted-hidden-email-form` endpoint
- Updated `CookieExtension` with cookie management utilities
- **Reason**: Reduce excessive API calls to Marketo (session expires too quickly)

### Phase 5: ViewModel Fix (PR #7539)
- Fixed view model usage in `MarketoBlockComponent`
- Ensured proper MVVM architecture

### Phase 6: Email Filtering (PR #7617) — NEWEST FEATURE
- **Latest addition**: Include/exclude email domains and account names
- Added site settings for configuring which users should trigger form submission
- Examples: Only submit for Vodafone/Orange, exclude @ericsson.com

---

## Changes Beyond Original Ticket Scope

The ticket described investigating and implementing Marketo push functionality. The PRs implemented:

### ✅ Within Scope (Expected from Ticket):
1. Push user email to Marketo on sign-in
2. Include `_mkto_trk` cookie value
3. Ensure GDPR compliance and secure data transmission
4. Prevent over-utilization of Marketo API

### ⚠️ Additional Changes (Not Explicitly in Ticket AC):
1. **Cookie-based deduplication** (8-hour persistence) — added to optimize API usage
2. **Email domain and account name filtering** — added to control which users are pushed
3. **Migration from jQuery to Fetch API** — technical debt cleanup
4. **MVVM refactoring** — improved code architecture
5. **Per-instance configuration** — each Marketo instance can have different hidden form ID

### 🔍 Discrepancies Needing Attention:
- **Exact vs Partial Match Validation**: Ticket comments show ongoing discussion about validation strategy (exact match vs substring match for email domains/account names). **Latest PR (#7617) implements this, but validation logic not confirmed.**
- **Security Review**: Ticket flagged need for security team review (Sanket Mahimkar) — unclear if completed
- **GDPR Compliance**: Ticket mentioned need for GDPR-compliant transmission — implementation uses client-side form POST (email visible in DevTools)

---

## Testing Recommendations

### Priority 1: Core Functionality (Must Test)
1. **Sign-in with eBiz user** → verify hidden form auto-submits to Marketo
2. **Marketo activity log** → confirm user email and `_mkto_trk` association appears
3. **8-hour deduplication** → sign in, close browser, return within 8 hours → NO re-submission
4. **Email domain filtering** → test with included domain (should submit) vs excluded domain (should NOT submit)
5. **Non-eBiz user** → verify form does NOT submit

### Priority 2: Edge Cases (Should Test)
6. **Cookie expiration** → sign in, wait >8 hours, return → verify re-submission
7. **Missing Marketo config** → remove Hidden Form ID from site settings → verify no form submission
8. **Browser DevTools** → inspect Network tab → verify form POST payload contains only email
9. **_mkto_trk cookie missing** → clear Marketo cookies → verify behavior (should form still submit?)
10. **Account name filtering** → test with account names containing "EXT" or other patterns (if partial match implemented)

### Priority 3: Regression Testing (Nice to Have)
11. **Existing Marketo form blocks** → verify visible forms still work (not affected by refactoring)
12. **Authentication flow** → verify no disruption to sign-in/sign-out
13. **Session management** → verify other session-dependent features unaffected
14. **Cookie management** → verify no conflicts with existing authentication cookies

### Priority 4: Performance & Security
15. **API quota monitoring** → check Marketo dashboard for submission rate
16. **Security validation** → confirm only email is transmitted (no PII beyond email)
17. **GDPR compliance** → verify data transmission method meets legal requirements
18. **Cross-browser testing** → test on Chrome, Edge, Firefox, Safari

---

## Risk Assessment

### High Risk Areas
- **AccountController** — Critical authentication controller modified
- **MarketoHiddenFormViewComponent** — New component executes on every page load for eBiz users
- **Cookie-based tracking** — New 8-hour cookie could interfere with other features if not implemented correctly

### Medium Risk Areas
- **SiteSettingsPage** — Central configuration point for site behavior
- **Email filtering logic** — Exact vs partial match still under discussion (per ticket comments)

### Low Risk Areas
- **ViewModel refactoring** — Architectural improvement, minimal functional change
- **jQuery to Fetch migration** — Frontend modernization, well-tested pattern
- **Localization changes** — UI labels only

---

## Summary

**Total PRs**: 7  
**Total Unique Files Changed**: 14  
**Components Affected**: 3 projects (Core, Website, Infrastructure)  
**Feature Scope**: Marketo hidden form integration with email domain filtering and cookie-based deduplication

**Key Implementation Highlights**:
1. Hidden form auto-submits user email to Marketo on sign-in (for eBiz users only)
2. 8-hour cookie prevents duplicate submissions (optimizes Marketo API usage)
3. Email domain and account name filtering controls which users trigger submission
4. Refactored to proper MVVM architecture with dedicated ViewModel
5. Migrated frontend from jQuery to native Fetch API

**Critical Testing Focus**:
- Sign-in flow with various user types (eBiz vs non-eBiz, included vs excluded domains)
- Cookie-based deduplication over 8-hour window
- Marketo activity log validation
- Security and GDPR compliance verification
