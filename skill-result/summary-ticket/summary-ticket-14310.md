# Ticket Summary: #14310 - Small white border between menu and hero on Macbook on start page

**Type**: Bug  
**State**: UAT Approved  
**Assigned To**: Hung Le (EXT)  
**Sprint**: ericssondotcom-vnext\Sprint 163  
**Created**: 2026-04-21  
**Last Updated**: 2026-05-22  
**Tags**: CodeFreeze, INCOMING, Low prio

---

## Description

No description provided.

---

## Acceptance Criteria / Repro Steps

**Steps:**
- Go to start page on listed device
- The border between menu and hero is available for most options, disappear sometime when zooming out.

**Expected Behavior:**
No border should be visible

**Actual Behavior:**
Small border is visible

**Device:**
13" mackbook air

Safari
Version 26.3.1 (21623.2.7.111.2)

[Screenshot attached in original ticket showing the white border issue]

---

## Recent Comments

**Joakim Rydell X** (2026-05-21):
@Hung Le (EXT) Seems to be looking as it should now, thanks.

---

## Development Status

**Pull Requests**: 3 linked PRs  
**Commits**: 6 commits  
**Latest Commit**: 2026-05-22

---

## What to Test

### 1. Visual Regression - Menu/Hero Border on MacBook
- **Device**: 13" MacBook Air (Safari Version 26.3.1)
- **Test on start page**: Navigate to the start page
- **Verify no white border** between menu and hero sections
- **Test at different zoom levels**: Zoom in/out to confirm border does not appear at any zoom level
- **Screenshot comparison**: Compare with original bug screenshot to confirm fix

### 2. Cross-Device Testing
- **MacBook Pro** (13", 15", 16" models) - Safari latest version
- **Other browsers on Mac**: Chrome, Firefox, Edge
- **Verify fix is specific to MacBook** and doesn't introduce issues on other devices

### 3. Responsive Behavior
- Test at various viewport sizes on MacBook
- Verify menu-to-hero transition is seamless at all breakpoints
- Check mobile/tablet views to ensure no regression (fix should be MacBook-specific)

### 4. Menu Functionality
- Verify menu still functions correctly (navigation, dropdowns, interactions)
- Confirm hero section displays correctly (images, text, CTA buttons)
- Test scrolling behavior between menu and hero

### 5. Production Verification
- Replicate exact device and browser version from bug report if possible:
  - 13" MacBook Air
  - Safari Version 26.3.1 (21623.2.7.111.2)
- Confirm Joakim's approval comment ("Seems to be looking as it should now") is validated on INTG/PROD

---

## Risk Areas

1. **CSS Specificity**: Fix may involve CSS changes that could affect other page layouts
2. **Browser-Specific Styling**: Safari-specific fixes might behave differently on other WebKit browsers
3. **Zoom Levels**: Original bug appeared/disappeared at different zoom levels - ensure fix is consistent across all zoom states
4. **Regression**: Verify fix doesn't introduce white borders or spacing issues on other pages or devices

---

## Notes

- Bug was marked **UAT Approved** on 2026-05-22
- Joakim confirmed the fix looks correct (May 21 comment)
- Tagged as **CodeFreeze** and **Low prio** - verify deployment timeline
- Visual bug specific to **13" MacBook Air Safari** - edge case device/browser combination
- Fix likely involves CSS adjustments to menu or hero section spacing/margins
