# Verification Checklist: Ticket #14310 - Small white border between menu and hero on Macbook

**Ticket ID**: 14310  
**Title**: Small white border between menu and hero on Macbook on start page  
**Type**: Bug  
**State**: UAT Approved  
**Assigned To**: Hung Le (EXT)  
**Sprint**: ericssondotcom-vnext\Sprint 163  
**Priority**: Low  
**Tags**: CodeFreeze, INCOMING, Low prio

---

## Overview

This ticket addresses a visual bug where a small white border appears between the menu and hero section on the start page when viewed on a 13" MacBook Air using Safari. The bug was device and browser-specific, appearing intermittently at different zoom levels.

**Key Details:**
- **Reported Device**: 13" MacBook Air
- **Reported Browser**: Safari Version 26.3.1 (21623.2.7.111.2)
- **Symptom**: Small white border between menu and hero sections
- **Behavior**: Border appears for most options, disappears when zooming out
- **Status**: UAT Approved (Joakim confirmed fix on 2026-05-21)

**Code Changes:**
- Modified `hero-video-html5-manager.ts` (TypeScript video player manager)
- Modified `_video.scss` (video player styles) - **twice** (PR #7572 and #7606)
- Changes suggest the border was caused by video player CSS/layout issues

---

## ⚠️ Important Note: Scope Discrepancy

**Reported Bug**: White border between menu and hero  
**PR Branch Name**: `features/14310-hero-video-issue-on-mac`  
**Changed Files**: Video player TypeScript and SCSS files

**Implication**: The white border was likely caused by video player CSS issues in the hero section. Test both:
1. Visual border issue (reported bug)
2. Video player functionality (actual fix location)

---

## Pre-requisites & Test Setup

### Required Test Devices

**Primary Test Device (Bug Report Match):**
- [ ] **13" MacBook Air** with Safari Version 26.3.1 (or latest)
- [ ] Access to original bug screenshot for visual comparison

**Secondary Test Devices:**
- [ ] MacBook Pro 13" (Safari)
- [ ] MacBook Pro 15"/16" (Safari)
- [ ] MacBook Air M1/M2 (Safari)
- [ ] Windows PC (Chrome, Edge, Firefox)
- [ ] iPad (Safari)
- [ ] iPhone (Safari)

### Environment Access
- [ ] **INTG environment** accessible
- [ ] **PROD environment** accessible (for final verification)
- [ ] Browser DevTools proficiency for inspecting CSS and DOM

### Reference Materials
- [ ] Original bug screenshot from ticket (showing white border)
- [ ] Joakim's approval comment dated 2026-05-21
- [ ] List of pages with hero sections (homepage, landing pages, campaign pages)

---

## 1. Primary Bug Verification - White Border Issue

### 1.1 Exact Bug Reproduction (MacBook Air Safari)

**Objective**: Verify the white border no longer appears on the exact device/browser from bug report.

#### Test Device: 13" MacBook Air + Safari 26.3.1

- [ ] **Navigate to start page** (homepage)
- [ ] **Inspect menu-to-hero transition**
  - [ ] NO white border visible between menu and hero section
  - [ ] Clean, seamless transition from menu to hero
  - [ ] No gaps, lines, or spacing issues

#### Zoom Level Testing (Critical)

Bug report states: "The border between menu and hero is available for most options, disappear sometime when zooming out."

- [ ] **100% zoom (default)**: NO white border visible
- [ ] **110% zoom**: NO white border visible
- [ ] **125% zoom**: NO white border visible
- [ ] **150% zoom**: NO white border visible
- [ ] **90% zoom**: NO white border visible
- [ ] **75% zoom**: NO white border visible
- [ ] **50% zoom**: NO white border visible

**Expected**: Border should NOT appear at any zoom level.

#### Screenshot Comparison

- [ ] **Take screenshot** of current menu-to-hero area on MacBook Air Safari
- [ ] **Compare with original bug screenshot** from ticket
- [ ] **Confirm fix**: White border is no longer visible

**Expected Result**:
- ✅ NO white border at any zoom level
- ✅ Menu and hero sections are seamlessly connected
- ✅ Visual comparison confirms fix

---

## 2. Hero Video Functionality Testing

**Rationale**: PRs modified video player files, suggesting the border was caused by video CSS issues.

### 2.1 Hero Video Playback on Mac

**Test on MacBook Air Safari (primary device):**

- [ ] **Navigate to start page** (homepage)
- [ ] **Verify hero video is present** (if homepage has video background/hero)
  - [ ] Video loads correctly
  - [ ] Video autoplays (if configured)
  - [ ] Video plays smoothly without stuttering
  - [ ] Video aspect ratio is correct (not stretched/squashed)

- [ ] **Video player controls** (if visible):
  - [ ] Play/pause button works
  - [ ] Volume control works
  - [ ] Mute/unmute button works
  - [ ] Fullscreen toggle works (if available)

- [ ] **Video loading states**:
  - [ ] Loading spinner/placeholder appears before video loads
  - [ ] Video poster image displays (if configured)
  - [ ] Video transitions smoothly from loading to playing

**Expected**: Hero video functions correctly on Mac Safari without causing visual layout issues.

### 2.2 Hero Video CSS/Layout

- [ ] **Video container does NOT create white border** above or below hero section
- [ ] **Video fits hero section** without overflow or gaps
- [ ] **Video maintains proper aspect ratio** at all viewport sizes
- [ ] **No white space artifacts** around video player

**Expected**: Video player CSS does not introduce spacing/border issues.

---

## 3. Cross-Browser Testing (Mac)

**Objective**: Verify fix is Safari-specific and doesn't break other browsers on Mac.

### 3.1 Mac Safari (Primary)

- [ ] **Safari latest version** on MacBook Air 13"
  - [ ] NO white border between menu and hero
  - [ ] Hero video plays correctly (if applicable)
  - [ ] All zoom levels tested (50%-150%)

### 3.2 Mac Chrome

- [ ] **Chrome latest version** on MacBook
  - [ ] NO white border (should not have had this bug originally)
  - [ ] Hero video plays correctly
  - [ ] NO regressions introduced

### 3.3 Mac Firefox

- [ ] **Firefox latest version** on MacBook
  - [ ] NO white border
  - [ ] Hero video plays correctly
  - [ ] NO regressions introduced

### 3.4 Mac Edge

- [ ] **Edge latest version** on MacBook (Chromium-based, may behave like Chrome)
  - [ ] NO white border
  - [ ] Hero video plays correctly
  - [ ] NO regressions introduced

**Expected**: Fix is Safari-specific, other browsers continue to work without issues.

---

## 4. Cross-Device Testing

**Objective**: Ensure fix doesn't introduce regressions on non-Mac devices.

### 4.1 Windows Desktop

- [ ] **Chrome on Windows**
  - [ ] NO white border
  - [ ] Hero video plays correctly
  - [ ] NO visual regressions

- [ ] **Edge on Windows**
  - [ ] NO white border
  - [ ] Hero video plays correctly
  - [ ] NO visual regressions

- [ ] **Firefox on Windows**
  - [ ] NO white border
  - [ ] Hero video plays correctly
  - [ ] NO visual regressions

### 4.2 Mobile Devices (iOS)

- [ ] **iPhone - Safari**
  - [ ] NO white border
  - [ ] Hero section displays correctly (responsive behavior)
  - [ ] Video plays or poster image shows (depending on mobile config)
  - [ ] NO layout issues

- [ ] **iPad - Safari**
  - [ ] NO white border
  - [ ] Hero section displays correctly
  - [ ] Video functionality works as expected
  - [ ] NO layout issues

### 4.3 Mobile Devices (Android)

- [ ] **Android - Chrome**
  - [ ] NO white border
  - [ ] Hero section displays correctly
  - [ ] Video functionality works as expected
  - [ ] NO layout issues

**Expected**: No regressions on any device or browser.

---

## 5. Responsive Behavior & Viewport Testing

### 5.1 Viewport Size Testing (MacBook Safari)

**Test at various viewport widths to ensure border doesn't appear at any breakpoint:**

- [ ] **Desktop (1920px)**: NO white border
- [ ] **Laptop (1440px)**: NO white border
- [ ] **MacBook Air 13" native (1440x900 Retina)**: NO white border
- [ ] **Tablet landscape (1024px)**: NO white border
- [ ] **Tablet portrait (768px)**: NO white border
- [ ] **Mobile landscape (667px)**: NO white border
- [ ] **Mobile portrait (375px)**: NO white border

### 5.2 Browser Window Resizing

- [ ] **Resize browser window** from full screen to narrow
  - [ ] Observe menu-to-hero transition at each breakpoint
  - [ ] NO white border appears during resizing
  - [ ] Layout transitions smoothly

**Expected**: No white border at any viewport size or during resize.

---

## 6. Page Coverage Testing

**Objective**: Verify fix doesn't break other pages, especially those with hero sections.

### 6.1 Homepage (Start Page)

- [ ] **Navigate to homepage** (primary test page from bug report)
  - [ ] NO white border between menu and hero
  - [ ] Hero section displays correctly
  - [ ] Hero video (if present) plays correctly
  - [ ] All menu items work
  - [ ] Page scrolls smoothly

### 6.2 Other Pages with Hero Sections

**Test on MacBook Air Safari:**

- [ ] **Landing pages** with hero sections
  - [ ] NO white border
  - [ ] Hero displays correctly
  - [ ] Video (if any) works correctly

- [ ] **Campaign pages** with hero sections
  - [ ] NO white border
  - [ ] Hero displays correctly
  - [ ] Video (if any) works correctly

- [ ] **Product pages** with hero sections
  - [ ] NO white border
  - [ ] Hero displays correctly
  - [ ] Video (if any) works correctly

### 6.3 Pages WITHOUT Hero Sections

**Sanity check to ensure CSS changes don't affect non-hero pages:**

- [ ] **Standard content pages** (no hero)
  - [ ] Menu displays normally
  - [ ] NO unexpected white borders or spacing issues
  - [ ] Page layout is unaffected

**Expected**: Fix is isolated to pages with hero sections (or specifically hero video components).

---

## 7. Menu Functionality (Regression Testing)

**Objective**: Ensure menu still functions correctly after CSS changes.

### 7.1 Menu Interaction

- [ ] **Top navigation menu**
  - [ ] Menu items are clickable
  - [ ] Dropdown menus work (if applicable)
  - [ ] Hover states work correctly
  - [ ] Active/selected states work correctly

- [ ] **Mobile menu** (hamburger icon)
  - [ ] Hamburger icon toggles menu
  - [ ] Mobile menu opens/closes smoothly
  - [ ] Menu items are clickable in mobile view
  - [ ] NO layout issues when menu is open

### 7.2 Menu-to-Content Transition

- [ ] **Scroll from menu to hero**
  - [ ] Transition is smooth
  - [ ] NO white border appears during scroll
  - [ ] Sticky menu (if applicable) works correctly

**Expected**: Menu functionality is unaffected by CSS changes.

---

## 8. Hero Section Visual Regression

**Objective**: Ensure hero section displays correctly after video CSS changes.

### 8.1 Hero Content

- [ ] **Hero headline/title** displays correctly
- [ ] **Hero subheading** displays correctly
- [ ] **Hero CTA buttons** display and function correctly
  - [ ] Buttons are clickable
  - [ ] Button hover states work
  - [ ] Buttons navigate to correct destinations

- [ ] **Hero background** (image or video)
  - [ ] Background image loads and displays correctly
  - [ ] Background video plays correctly (if applicable)
  - [ ] Background covers hero area without white gaps

### 8.2 Hero Layout

- [ ] **Hero height** is correct (not too tall or too short)
- [ ] **Hero content alignment** (centered, left-aligned, etc.) is correct
- [ ] **Hero overlays** (text overlays on video/image) display correctly
- [ ] **Hero gradients/filters** (if any) display correctly

**Expected**: Hero section looks visually correct with no layout issues.

---

## 9. Video Player Styling Consistency

**Rationale**: PR #7606 title mentions "refactor video player styles for consistency and readability."

### 9.1 Video Player UI Consistency

**Test on all pages with video players (not just hero sections):**

- [ ] **Video player controls** have consistent styling across pages
- [ ] **Video player buttons** (play, pause, volume) have consistent appearance
- [ ] **Video player progress bar** has consistent styling
- [ ] **Video player tooltips/labels** are readable and consistent

### 9.2 Video Player Readability

- [ ] **Control icons** are clear and easy to understand
- [ ] **Text labels** (if any) are readable (font size, color, contrast)
- [ ] **Hover states** provide clear visual feedback
- [ ] **Focus states** are visible (accessibility)

**Expected**: Video player UI is consistent and readable across the site.

---

## 10. CSS Specificity & Browser-Specific Fixes

**Objective**: Ensure CSS changes don't have unintended side effects.

### 10.1 Inspect CSS Changes (DevTools)

**On MacBook Air Safari:**

- [ ] **Open Browser DevTools** → Elements/Inspector
- [ ] **Inspect menu element** and check for:
  - [ ] Margin-bottom is set correctly (no extra margin causing border)
  - [ ] Padding is correct
  - [ ] NO unexpected white background

- [ ] **Inspect hero section** and check for:
  - [ ] Margin-top is set correctly (no extra margin causing border)
  - [ ] Padding is correct
  - [ ] NO unexpected white background
  - [ ] Video container (if present) has correct positioning

- [ ] **Check for Safari-specific CSS** (e.g., `-webkit-` prefixes or `@supports` rules)
  - [ ] Verify Safari-specific rules are applied correctly
  - [ ] Verify rules don't affect other browsers negatively

### 10.2 Browser Compatibility Check

- [ ] **CSS changes are compatible** with all target browsers
- [ ] **NO browser-specific hacks** that might break in future browser updates
- [ ] **Graceful degradation** for older browsers (if applicable)

**Expected**: CSS is clean, specific, and doesn't introduce side effects.

---

## 11. Performance & Loading

### 11.1 Page Load Performance

- [ ] **Homepage loads quickly** on MacBook Safari
  - [ ] No significant performance degradation after fix
  - [ ] Video loads efficiently without blocking page render

- [ ] **Lighthouse/PageSpeed Insights** (optional)
  - [ ] Performance score unchanged or improved
  - [ ] NO new warnings related to CSS or video

### 11.2 Video Loading Optimization

- [ ] **Hero video lazy loads** (if configured)
- [ ] **Video preloads** metadata only (not full video) to save bandwidth
- [ ] **Video placeholder/poster** shows quickly before video loads

**Expected**: No performance regressions.

---

## 12. Accessibility (WCAG Compliance)

### 12.1 Keyboard Navigation

- [ ] **Tab through menu** to hero section
  - [ ] NO white border appears when navigating with keyboard
  - [ ] Focus states are visible
  - [ ] Tab order is logical

### 12.2 Screen Reader Testing (Optional)

- [ ] **Hero video** has appropriate ARIA labels (if applicable)
- [ ] **Menu-to-hero transition** is logical for screen reader users

**Expected**: No accessibility regressions.

---

## 13. Edge Cases & Stress Testing

### 13.1 Multiple Zoom Levels (Extended Testing)

**On MacBook Air Safari, test additional zoom levels:**

- [ ] **200% zoom**: NO white border, hero displays correctly
- [ ] **250% zoom**: NO white border, layout remains usable
- [ ] **33% zoom** (minimum): NO white border

### 13.2 Browser Window Sizes (Edge Cases)

- [ ] **Very narrow window** (e.g., 320px width): NO white border
- [ ] **Very wide window** (e.g., 4K resolution): NO white border
- [ ] **Half-screen split** on MacBook: NO white border

### 13.3 Video Player Edge Cases

- [ ] **Slow network connection** (throttle to 3G in DevTools)
  - [ ] Video loading doesn't cause layout shift or white border
  - [ ] Loading spinner displays correctly

- [ ] **Video fails to load** (block video URL in DevTools)
  - [ ] Fallback image/placeholder displays
  - [ ] NO white border appears due to missing video

**Expected**: No white border in any edge case scenario.

---

## 14. UAT Approval Validation

**Objective**: Confirm Joakim's approval comment is accurate.

### 14.1 Joakim's Comment (2026-05-21)

**Comment**: "@Hung Le (EXT) Seems to be looking as it should now, thanks."

- [ ] **Test on same device/browser** Joakim likely used
- [ ] **Verify visual appearance** matches "as it should" expectation
- [ ] **Confirm fix is stable** (not intermittent)

### 14.2 Stakeholder Sign-Off

- [ ] **Product Owner** confirms fix addresses the bug
- [ ] **Business stakeholder** (Joakim or equivalent) approves for production
- [ ] **No new issues** reported during UAT period

**Expected**: Fix is stable and approved by stakeholders.

---

## 15. Production Readiness

### 15.1 Code Freeze Tag

**Ticket is tagged "CodeFreeze":**

- [ ] **Confirm deployment timeline** with release manager
- [ ] **Verify fix is included** in next production deployment
- [ ] **No breaking changes** that would block deployment

### 15.2 Rollback Plan

- [ ] **Document CSS changes** made in PRs #7572 and #7606
- [ ] **Identify rollback commit** if production issues arise
- [ ] **Test rollback scenario** (optional): Revert changes and verify border reappears

### 15.3 Monitoring

- [ ] **Set up visual regression alerts** (if available) to catch similar issues
- [ ] **Monitor support tickets** post-deployment for related bug reports
- [ ] **Check analytics** for Mac Safari users to ensure no negative impact on engagement

**Expected**: Fix is ready for production deployment with minimal risk.

---

## 16. Final Acceptance Criteria

### Acceptance Criteria (From Ticket)

**Expected Behavior**: No border should be visible

- [ ] ✅ **NO white border** between menu and hero on MacBook Air Safari
- [ ] ✅ Border does NOT appear at any zoom level
- [ ] ✅ Fix is specific to MacBook and doesn't break other devices
- [ ] ✅ Joakim's approval validated

### Implicit Requirements

- [ ] ✅ Hero video functionality works correctly (PRs modified video files)
- [ ] ✅ Menu functionality is unaffected
- [ ] ✅ Hero section displays correctly
- [ ] ✅ No regressions on other pages or browsers
- [ ] ✅ Video player styles are consistent and readable (PR #7606 goal)

---

## 17. Known Issues & Risks

### From Ticket Analysis:

**Risk 1: CSS Specificity**
- Fix may involve CSS changes that could affect other page layouts
- **Mitigation**: Test multiple pages with hero sections, not just homepage

**Risk 2: Browser-Specific Styling**
- Safari-specific fixes might behave differently on other WebKit browsers (e.g., Mobile Safari, Chrome on iOS)
- **Mitigation**: Test on iOS devices (iPhone, iPad)

**Risk 3: Zoom Level Consistency**
- Original bug appeared/disappeared at different zoom levels
- **Mitigation**: Test comprehensive zoom range (50%-250%)

**Risk 4: Regression on Other Devices**
- Fix might introduce white borders or spacing issues on other devices
- **Mitigation**: Test on Windows, Linux, iOS, Android

### From PR Analysis:

**Risk 5: Video Player Changes**
- Two PRs modified `_video.scss` (iterative refinement suggests complexity)
- **Mitigation**: Test video functionality thoroughly, not just visual appearance

**Risk 6: TypeScript Changes**
- `hero-video-html5-manager.ts` changed (potential for JavaScript errors)
- **Mitigation**: Check browser console for JavaScript errors during testing

---

## 18. Testing Sign-Off

### Test Execution Summary

**Test Environment**: INTG / PROD  
**Tested By**: [QA Name]  
**Test Date**: [Date]

| Test Category | Status | Notes |
|---------------|--------|-------|
| Primary Bug (MacBook Air Safari) | ⬜ PASS / ⬜ FAIL | |
| Zoom Level Testing | ⬜ PASS / ⬜ FAIL | |
| Hero Video Functionality | ⬜ PASS / ⬜ FAIL | |
| Cross-Browser (Mac) | ⬜ PASS / ⬜ FAIL | |
| Cross-Device Testing | ⬜ PASS / ⬜ FAIL | |
| Responsive Behavior | ⬜ PASS / ⬜ FAIL | |
| Menu Functionality | ⬜ PASS / ⬜ FAIL | |
| Visual Regression | ⬜ PASS / ⬜ FAIL | |
| Video Player Consistency | ⬜ PASS / ⬜ FAIL | |
| Performance | ⬜ PASS / ⬜ FAIL | |
| Accessibility | ⬜ PASS / ⬜ FAIL | |

### Overall Status: ⬜ PASS / ⬜ FAIL / ⬜ CONDITIONAL PASS

### Issues Found

**Critical Issues**: [List any blocking issues]

**Major Issues**: [List any major issues]

**Minor Issues**: [List any minor issues or improvements]

### Recommendations

- [ ] **Approve for Production** - All tests passed, fix is stable
- [ ] **Approve with Conditions** - Minor issues found, can be addressed post-deployment
- [ ] **Require Fixes** - Critical issues must be resolved before deployment
- [ ] **Retest Required** - Significant issues found, need full retest after fixes

### Sign-Off

- **QA Lead**: __________________ Date: __________
- **Product Owner**: __________________ Date: __________
- **Release Manager**: __________________ Date: __________

---

## Appendix: Test Data & Resources

### Test URLs

- **Start Page (Homepage)**: [URL on INTG]
- **Other Hero Pages**: [List URLs of pages with hero sections]

### Bug Screenshot

- **Original Screenshot**: [Link or path to screenshot from ticket]
- **Current Screenshot (Fixed)**: [Attach screenshot after testing]

### Browser Versions Tested

- **MacBook Air Safari**: Version ________
- **MacBook Chrome**: Version ________
- **MacBook Firefox**: Version ________
- **Windows Chrome**: Version ________
- **iOS Safari**: Version ________

### PR References

- **PR #7572**: #14310 merge video issue (2026-05-07)
  - Files: `hero-video-html5-manager.ts`, `_video.scss`
- **PR #7606**: feat: #14310 - refactor video player styles for consistency and readability (2026-05-18)
  - Files: `_video.scss`

### Files Changed

- `Static/js/dotcom/typescripts/hero-video-html5-manager.ts`
- `Static/sass/dotcomstyles/_video.scss`

---

**End of Checklist**
