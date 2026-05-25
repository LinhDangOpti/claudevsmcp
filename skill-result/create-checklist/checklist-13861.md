# Verification Checklist: Ticket #13861 - Push information to Marketo

**Ticket ID**: 13861  
**Title**: Push information to Marketo  
**Type**: User Story  
**Assigned To**: Quang Pho (EXT)  
**Sprint**: ericssondotcom-vnext\Sprint 163  
**Test Environment**: ACC (then INTG/PROD)  
**Marketo Test Instance**: 873-HDO-560 (SandBox)

---

## Overview

This ticket implements a hidden Marketo form submission feature that automatically pushes signed-in user email addresses to Marketo for first-party data collection and personalization. The implementation includes:

- **Hidden form auto-submission** on user sign-in (eBiz users only)
- **8-hour cookie-based deduplication** to prevent excessive API calls
- **Email domain & account name filtering** (include/exclude rules in site settings)
- **Client-side JavaScript** using Fetch API (migrated from jQuery)
- **GDPR and security compliance** requirements

---

## Pre-requisites & Test Setup

### Environment Setup
- [ ] **ACC environment is accessible** - https://acc.my-access.ericsson.net/ or ewstest.ericsson.com
- [ ] **Test user accounts prepared**:
  - [ ] eBiz user with included email domain (e.g., @vodafone.com or @orange.com)
  - [ ] eBiz user with excluded email domain (e.g., @ericsson.com)
  - [ ] Non-eBiz user for negative testing
  - [ ] User with external account name containing "EXT" (for partial match testing)
- [ ] **Marketo SandBox access** - Instance ID: 873-HDO-560
- [ ] **Browser DevTools proficiency** - Know how to inspect Network tab, Cookies, Console
- [ ] **Site Settings CMS access** - Ability to configure Marketo settings in Optimizely CMS

### Configuration Verification
- [ ] **Marketo instance is configured** in site settings on ACC
- [ ] **Hidden Form ID is set** for the test Marketo instance (873-HDO-560)
- [ ] **Email domain filters configured**:
  - [ ] Include domains: vodafone.com, orange.com (or test domains)
  - [ ] Exclude domains: ericsson.com
- [ ] **Account name filters configured** (if applicable):
  - [ ] Document current filtering strategy (exact match vs partial match)

---

## 1. CMS Configuration Testing

### 1.1 Site Settings - Marketo Configuration

**Objective**: Verify CMS editors can configure Marketo integration settings correctly.

#### Test Steps:
- [ ] **Navigate to Site Settings** in Optimizely CMS admin panel
- [ ] **Locate Marketo Settings section**
  - [ ] Verify "Hidden Form ID" field is visible
  - [ ] Verify "Include Email Domains" field is visible
  - [ ] Verify "Exclude Email Domains" field is visible
  - [ ] Verify "Include Account Names" field is visible (if implemented)
  - [ ] Verify "Exclude Account Names" field is visible (if implemented)

#### Configuration Validation:
- [ ] **Set Hidden Form ID** to valid form ID (e.g., form ID from SandBox instance)
  - [ ] Save and verify value persists after page refresh
- [ ] **Configure Include Email Domains**: "vodafone.com, orange.com"
  - [ ] Save and verify value persists
- [ ] **Configure Exclude Email Domains**: "ericsson.com"
  - [ ] Save and verify value persists
- [ ] **Test field validation** (if implemented):
  - [ ] Enter invalid format → verify validation error
  - [ ] Enter empty value → verify behavior (should disable filtering or show error)

#### Localization:
- [ ] **Verify property labels** display correctly in English
- [ ] **Check PropertyNames.xml** was updated with new labels
- [ ] If multi-language site, verify labels in other languages (if applicable)

**Expected Results**:
- ✅ All Marketo configuration fields are visible in Site Settings
- ✅ Values save correctly and persist after refresh
- ✅ Field labels are clear and properly localized

---

## 2. Core Functionality - Hidden Form Submission

### 2.1 Successful Hidden Form Submission (eBiz User + Included Domain)

**Objective**: Verify hidden form submits user email to Marketo on sign-in for eligible users.

#### Test User Profile:
- User has **eBiz access** ✅
- User email domain is **included** in site settings (e.g., user@vodafone.com) ✅
- User has **NOT** submitted within last 8 hours ✅

#### Test Steps:
- [ ] **Clear browser cookies** (especially Marketo submission cookie)
- [ ] **Sign in** to ACC with test user (e.g., user@vodafone.com)
- [ ] **Open Browser DevTools** → Network tab
- [ ] **Monitor network requests** during/after sign-in

#### Verification Points:
- [ ] **Hidden form POST request appears** in Network tab
  - [ ] Request URL contains Marketo domain (e.g., `873-HDO-560.mktoweb.com`)
  - [ ] Request method is POST
  - [ ] Request payload includes:
    - [ ] `Email` field with user's email address
    - [ ] `_mkto_trk` cookie value (if applicable)
  - [ ] Request completes successfully (status 200 or 302)
- [ ] **API call to set submission flag**: `/api/account/set-has-submitted-hidden-email-form`
  - [ ] Request is sent after successful Marketo form submission
  - [ ] Response is successful (200 OK)
- [ ] **Marketo submission cookie is set**:
  - [ ] Open DevTools → Application/Storage → Cookies
  - [ ] Verify cookie name matches expected constant (check code for exact name)
  - [ ] Verify cookie expiration is ~8 hours from now
- [ ] **No JavaScript errors** in Console tab
- [ ] **User experience is seamless** - no visible form, no delays, no errors shown to user

**Expected Results**:
- ✅ Hidden form submits user email to Marketo automatically on sign-in
- ✅ Submission tracking cookie is set with 8-hour expiration
- ✅ No visible impact on user experience

### 2.2 Marketo Activity Log Verification

**Objective**: Confirm that submitted data appears in Marketo activity log.

#### Test Steps:
- [ ] **Access Marketo SandBox instance** (873-HDO-560)
- [ ] **Navigate to Lead Database** or **Activity Log**
- [ ] **Search for test user** by email address (e.g., user@vodafone.com)

#### Verification Points:
- [ ] **User record exists** in Marketo database (may be created on first submission)
- [ ] **"Fill Out Form" activity** is recorded
  - [ ] Activity timestamp matches test sign-in time
  - [ ] Form ID matches configured Hidden Form ID
- [ ] **User email address** is correctly stored
- [ ] **_mkto_trk cookie value** is associated with the user record
- [ ] **Subsequent page activities** are properly tracked and linked to the same user

**Expected Results**:
- ✅ User email appears in Marketo activity log
- ✅ "Fill Out Form" activity is recorded with correct timestamp
- ✅ User is properly tracked across subsequent page visits

---

## 3. Deduplication Mechanism - Cookie-Based (8-Hour Persistence)

**Objective**: Verify that cookie-based deduplication prevents excessive form submissions to Marketo.

### 3.1 No Re-submission Within 8-Hour Window

#### Test Steps:
- [ ] **Sign in with eligible user** (eBiz + included domain)
- [ ] **Verify hidden form submits** (check Network tab)
- [ ] **Verify submission cookie is set** (DevTools → Cookies)
- [ ] **Close browser completely** (all windows/tabs)
- [ ] **Reopen browser** and navigate back to ACC
- [ ] **Sign in with same user**
- [ ] **Monitor Network tab** for Marketo form submission

#### Verification Points:
- [ ] **NO new form submission** occurs on second sign-in (within 8 hours)
- [ ] **Submission cookie still exists** and has not expired
- [ ] **No POST request** to Marketo in Network tab
- [ ] **No call** to `/api/account/set-has-submitted-hidden-email-form`

**Expected Results**:
- ✅ Form does NOT re-submit within 8-hour window
- ✅ Cookie-based deduplication works correctly

### 3.2 Re-submission After 8-Hour Expiration

#### Test Steps:
- [ ] **Sign in with eligible user** (first submission)
- [ ] **Manually expire or delete** the Marketo submission cookie:
  - Option A: Use DevTools → Cookies → Delete specific cookie
  - Option B: Modify cookie expiration to past date (DevTools → Cookies → Edit)
- [ ] **Sign in again** (or refresh page if already signed in)
- [ ] **Monitor Network tab** for Marketo form submission

#### Verification Points:
- [ ] **New form submission occurs** after cookie expiration/deletion
- [ ] **New submission cookie is set** with fresh 8-hour expiration
- [ ] **Marketo activity log** shows second "Fill Out Form" activity

**Expected Results**:
- ✅ Form re-submits after 8-hour cookie expiration
- ✅ New cookie is created with fresh 8-hour expiration

### 3.3 Session Timeout Does NOT Trigger Re-submission

#### Test Steps:
- [ ] **Sign in with eligible user** (first submission, cookie set)
- [ ] **Remain idle for >20 minutes** (session timeout period)
- [ ] **Interact with site** (navigate to another page or refresh)
- [ ] **Monitor Network tab** for form submission

#### Verification Points:
- [ ] **NO new form submission** occurs after session timeout (within 8-hour cookie window)
- [ ] **Session timeout does NOT affect** Marketo cookie deduplication
- [ ] **Cookie remains valid** for 8 hours regardless of session state

**Expected Results**:
- ✅ Session timeout does not trigger duplicate submissions (cookie-based, not session-based)

---

## 4. Email Domain & Account Name Filtering

**Objective**: Verify that include/exclude filtering rules control which users trigger hidden form submission.

### 4.1 Included Email Domain - Should Submit

#### Test User Profile:
- User has **eBiz access** ✅
- User email domain is **in the include list** (e.g., user@vodafone.com) ✅

#### Test Steps:
- [ ] **Configure site settings**: Include domains = "vodafone.com, orange.com"
- [ ] **Sign in with user from included domain** (e.g., user@vodafone.com)
- [ ] **Monitor Network tab** for form submission

#### Verification:
- [ ] **Form DOES submit** to Marketo
- [ ] **Submission cookie is set**
- [ ] **Marketo activity log** records the submission

**Expected Results**:
- ✅ Users from included domains trigger form submission

### 4.2 Excluded Email Domain - Should NOT Submit

#### Test User Profile:
- User has **eBiz access** ✅
- User email domain is **in the exclude list** (e.g., user@ericsson.com) ❌

#### Test Steps:
- [ ] **Configure site settings**: Exclude domains = "ericsson.com"
- [ ] **Sign in with user from excluded domain** (e.g., user@ericsson.com)
- [ ] **Monitor Network tab** for form submission

#### Verification:
- [ ] **Form does NOT submit** to Marketo
- [ ] **NO POST request** to Marketo in Network tab
- [ ] **NO submission cookie** is set
- [ ] **Marketo activity log** has no new activity for this user

**Expected Results**:
- ✅ Users from excluded domains do NOT trigger form submission

### 4.3 Non-Listed Email Domain - Default Behavior

#### Test User Profile:
- User has **eBiz access** ✅
- User email domain is **neither included nor excluded** (e.g., user@example.com) ❓

#### Test Steps:
- [ ] **Configure site settings**: Include = "vodafone.com", Exclude = "ericsson.com"
- [ ] **Sign in with user from non-listed domain** (e.g., user@example.com)
- [ ] **Monitor Network tab** for form submission

#### Verification:
- [ ] **Document observed behavior**:
  - [ ] If form submits → default is "allow unless explicitly excluded"
  - [ ] If form does NOT submit → default is "deny unless explicitly included"
- [ ] **Confirm behavior matches requirements** (check with PO/Dev if unclear)

**Expected Results**:
- ✅ Behavior for non-listed domains is consistent and documented

### 4.4 Account Name Filtering (If Implemented)

#### Test Scenarios:

**Scenario A: Exact Match**
- [ ] **Configure**: Include account names = "John Doe"
- [ ] **Sign in with user**: Account name = "John Doe" → Should submit ✅
- [ ] **Sign in with user**: Account name = "Jane Doe" → Should NOT submit ❌

**Scenario B: Partial Match** (if implemented)
- [ ] **Configure**: Exclude account names containing "EXT" (e.g., substring match)
- [ ] **Sign in with user**: Account name = "John Doe (EXT)" → Should NOT submit ❌
- [ ] **Sign in with user**: Account name = "External Consultant" → Verify behavior ❓
- [ ] **Sign in with user**: Account name = "John Doe" → Should submit ✅

#### Verification:
- [ ] **Document filtering strategy**: Exact match or partial/substring match
- [ ] **Test both positive and negative cases**
- [ ] **Verify no false positives/negatives**

**Expected Results**:
- ✅ Account name filtering works as designed (exact or partial match)
- ✅ No unintended users are included/excluded

### 4.5 Combined Filters - Email Domain AND Account Name

#### Test Scenario:
- [ ] **Configure**: 
  - Include domains = "vodafone.com"
  - Exclude account names containing "Test"
- [ ] **Sign in with user**: Email = user@vodafone.com, Account = "Test User"
  - [ ] Verify behavior (likely excluded due to account name filter)
- [ ] **Sign in with user**: Email = user@vodafone.com, Account = "John Doe"
  - [ ] Verify behavior (likely included - passes both filters)

**Expected Results**:
- ✅ Combined filters work as expected (AND logic or OR logic - confirm with dev)

---

## 5. Edge Cases & Error Handling

### 5.1 User Without eBiz Access - Should NOT Submit

#### Test User Profile:
- User does **NOT have eBiz access** ❌

#### Test Steps:
- [ ] **Sign in with non-eBiz user**
- [ ] **Monitor Network tab** for form submission

#### Verification:
- [ ] **Form does NOT submit**
- [ ] **NO POST request** to Marketo
- [ ] **NO submission cookie** is set

**Expected Results**:
- ✅ Non-eBiz users do NOT trigger form submission

### 5.2 Marketo Not Configured - Should NOT Submit

#### Test Steps:
- [ ] **Navigate to Site Settings** in CMS
- [ ] **Remove or clear Hidden Form ID** field
- [ ] **Save settings**
- [ ] **Sign in with eligible eBiz user**
- [ ] **Monitor Network tab**

#### Verification:
- [ ] **Form does NOT submit** (missing configuration)
- [ ] **NO JavaScript errors** in Console
- [ ] **User experience is unaffected** (no error messages shown)

**Expected Results**:
- ✅ Missing Marketo configuration gracefully prevents submission without errors

### 5.3 Missing _mkto_trk Cookie - Form Submission Behavior

#### Test Steps:
- [ ] **Clear all Marketo-related cookies** (especially `_mkto_trk`)
- [ ] **Sign in with eligible user**
- [ ] **Monitor Network tab** for form submission

#### Verification:
- [ ] **Document behavior**:
  - [ ] If form still submits → Marketo creates new `_mkto_trk` cookie on submission
  - [ ] If form does NOT submit → `_mkto_trk` is required pre-condition
- [ ] **Check if `_mkto_trk` is created** after submission
- [ ] **Confirm expected behavior** with Dev/PO

**Expected Results**:
- ✅ Behavior is documented and matches requirements

### 5.4 Network Failure - Marketo Form Submission Fails

#### Test Steps:
- [ ] **Block Marketo domain** in browser (DevTools → Network → Block requests containing "mktoweb.com")
- [ ] **Sign in with eligible user**
- [ ] **Monitor Console for errors**

#### Verification:
- [ ] **Form submission fails** (expected due to network block)
- [ ] **Error is logged** in Console (check for Fetch API error)
- [ ] **Submission cookie is NOT set** (API call to set-has-submitted may also fail)
- [ ] **User is NOT impacted** - sign-in succeeds despite Marketo failure
- [ ] **No error message shown** to user (failure is silent)

**Expected Results**:
- ✅ Marketo submission failure does not block user sign-in or show error messages
- ✅ Errors are logged to Console for debugging

### 5.5 API Endpoint Failure - /api/account/set-has-submitted-hidden-email-form

#### Test Steps:
- [ ] **Sign in with eligible user** (form submission succeeds)
- [ ] **Monitor network** for `/api/account/set-has-submitted-hidden-email-form` request
- [ ] **If possible, simulate API failure** (e.g., server returns 500 error)

#### Verification:
- [ ] **Cookie may not be set** if API call fails
- [ ] **User may re-submit on next sign-in** (deduplication fails)
- [ ] **User experience is unaffected** (no error shown)

**Expected Results**:
- ✅ API failure does not block user sign-in but may cause duplicate submissions

---

## 6. Security & GDPR Compliance

### 6.1 Data Transmission Security

#### Test Steps:
- [ ] **Sign in with eligible user**
- [ ] **Open DevTools → Network tab**
- [ ] **Inspect Marketo form submission request**

#### Verification - Data Minimization:
- [ ] **Only email address is transmitted** (no other PII)
- [ ] **Verify payload** does NOT include:
  - [ ] Full name
  - [ ] Phone number
  - [ ] Physical address
  - [ ] Credit card or payment info
  - [ ] Social security or national ID
  - [ ] Any sensitive personal data beyond email
- [ ] **_mkto_trk cookie value** (if included, confirm this is acceptable)

#### Verification - Transport Security:
- [ ] **Request uses HTTPS** (not HTTP)
- [ ] **Certificate is valid** for Marketo domain

**Expected Results**:
- ✅ Only minimal PII (email) is transmitted
- ✅ Transmission is over HTTPS with valid certificate

### 6.2 Browser DevTools Visibility (Security Concern)

#### Test Steps:
- [ ] **Sign in with eligible user**
- [ ] **Open DevTools → Network tab**
- [ ] **Inspect form submission request payload**

#### Verification:
- [ ] **Email address is visible** in plaintext in Network tab (expected for client-side submission)
- [ ] **formId and munchkinId are visible** (expected)
- [ ] **Document this visibility** as a known limitation of client-side submission

#### Security Review:
- [ ] **Confirm security team approval** was obtained (flagged to Sanket Mahimkar per ticket comments)
- [ ] **GDPR assessment completed** - client-side transmission is acceptable
- [ ] **User consent obtained** (if required by GDPR) - check if consent banner covers this use case

**Expected Results**:
- ✅ Email visibility in DevTools is acknowledged and approved by security team
- ✅ GDPR compliance is confirmed

### 6.3 Cookie Security

#### Test Steps:
- [ ] **Sign in and verify submission cookie is set**
- [ ] **Open DevTools → Application/Storage → Cookies**
- [ ] **Inspect Marketo submission cookie**

#### Verification:
- [ ] **Cookie attributes**:
  - [ ] `HttpOnly` flag: Should be `true` (prevents JavaScript access) - confirm requirement
  - [ ] `Secure` flag: Should be `true` (HTTPS only)
  - [ ] `SameSite` attribute: Verify value (Lax, Strict, or None) - confirm requirement
  - [ ] `Expiration`: ~8 hours from creation
- [ ] **Cookie name** does not expose sensitive info
- [ ] **Cookie value** is not human-readable sensitive data

**Expected Results**:
- ✅ Cookie is configured with appropriate security flags
- ✅ Cookie does not expose sensitive information

---

## 7. Regression Testing - Existing Marketo Form Blocks

**Objective**: Ensure refactoring of `MarketoBlockComponent` and `MarketoBlock.cshtml` did not break existing visible Marketo forms.

### 7.1 Visible Marketo Form Rendering

#### Test Steps:
- [ ] **Navigate to page with Marketo form block** (e.g., newsletter signup, contact form)
- [ ] **Verify form renders correctly**
- [ ] **Fill out form with test data**
- [ ] **Submit form**

#### Verification:
- [ ] **Form displays correctly** (layout, styling, fields)
- [ ] **Form submission succeeds**
- [ ] **Success message displays** (or redirect occurs)
- [ ] **Marketo activity log** records the form submission
- [ ] **No JavaScript errors** in Console
- [ ] **No visual regressions** compared to previous version

**Expected Results**:
- ✅ Existing Marketo form blocks work correctly
- ✅ No regressions in rendering or submission

### 7.2 Marketo Block in CMS Editor

#### Test Steps:
- [ ] **Log in to Optimizely CMS** as editor
- [ ] **Create or edit a page**
- [ ] **Add Marketo Block** to content area
- [ ] **Configure block** (select form, set properties)
- [ ] **Publish page**
- [ ] **Preview page** on front-end

#### Verification:
- [ ] **Block appears in CMS editor**
- [ ] **Block properties are editable**
- [ ] **Block uses new `MarketoBlockViewModel`** (check code, no visible change expected)
- [ ] **Published page displays Marketo form correctly**

**Expected Results**:
- ✅ Marketo block works correctly in CMS editor
- ✅ ViewModel refactoring is transparent to editors and end-users

---

## 8. Frontend & Cross-Browser Testing

### 8.1 JavaScript - Fetch API Migration

**Objective**: Verify migration from jQuery to Fetch API is successful.

#### Test Steps:
- [ ] **Sign in with eligible user**
- [ ] **Open DevTools → Console**
- [ ] **Monitor for JavaScript errors**

#### Verification:
- [ ] **NO jQuery-related errors** ($.ajax is no longer used)
- [ ] **Fetch API is used** (check Network tab → request initiated by Fetch)
- [ ] **Hidden form submission succeeds**
- [ ] **Browser compatibility** - Fetch API supported in target browsers (IE11 not supported, but likely not a requirement)

**Expected Results**:
- ✅ Fetch API works correctly
- ✅ No jQuery dependencies for hidden form submission

### 8.2 Cross-Browser Testing

#### Browsers to Test:
- [ ] **Chrome** (latest version)
- [ ] **Edge** (latest version)
- [ ] **Firefox** (latest version)
- [ ] **Safari** (latest version, macOS/iOS)

#### Test for Each Browser:
- [ ] **Sign in with eligible user**
- [ ] **Verify hidden form submits**
- [ ] **Verify cookie is set correctly**
- [ ] **Verify deduplication works** (sign in twice within 8 hours → no duplicate submission)
- [ ] **Check Console for errors**

**Expected Results**:
- ✅ Hidden form submission works consistently across all major browsers
- ✅ Cookie behavior is consistent

### 8.3 Device Testing

#### Devices to Test:
- [ ] **Desktop** (Windows/Mac)
- [ ] **Mobile** (iOS Safari, Android Chrome)
- [ ] **Tablet** (iOS/Android)

#### Test for Each Device:
- [ ] **Sign in on device**
- [ ] **Verify hidden form submits** (use remote debugging to inspect Network tab if needed)
- [ ] **Verify cookie is set**

**Expected Results**:
- ✅ Hidden form submission works on desktop and mobile devices

---

## 9. Performance & API Quota Monitoring

### 9.1 Marketo API Quota Usage

**Objective**: Ensure cookie-based deduplication prevents excessive API calls to Marketo.

#### Test Steps:
- [ ] **Access Marketo SandBox dashboard** (873-HDO-560)
- [ ] **Navigate to API usage statistics** (if available)
- [ ] **Monitor submission rate** during testing period
- [ ] **Calculate submissions per user**: Should be ~1 submission per 8 hours per user

#### Verification:
- [ ] **No excessive submissions** from single user
- [ ] **Deduplication is effective** - multiple sign-ins within 8 hours do NOT create multiple submissions
- [ ] **API quota is within limits** set by Marketo

**Expected Results**:
- ✅ API usage is optimized by 8-hour cookie deduplication
- ✅ No risk of exceeding Marketo API quota

### 9.2 Page Load Performance

#### Test Steps:
- [ ] **Sign in with eligible user**
- [ ] **Use DevTools → Performance/Network tab** to measure page load time
- [ ] **Compare with baseline** (if available from before this feature)

#### Verification:
- [ ] **Hidden form submission does NOT significantly impact page load time** (<100ms added)
- [ ] **Form submission is asynchronous** - does not block page rendering
- [ ] **No visible delay** for end-user

**Expected Results**:
- ✅ Page load performance is not negatively impacted

---

## 10. Acceptance Criteria Validation

### Business Requirements (From Ticket Description)

- [ ] ✅ **Push user email to Marketo on sign-in** for signed-in users
  - [ ] Implemented: Hidden form submits email automatically
- [ ] ✅ **Include _mkto_trk cookie value** for Marketo tracking
  - [ ] Implemented: Cookie is included in submission (verify in Network tab)
- [ ] ✅ **Secure and GDPR compliant data transmission**
  - [ ] Verified: HTTPS, minimal PII, security review completed
- [ ] ✅ **Prevent over-utilization of Marketo API**
  - [ ] Implemented: 8-hour cookie-based deduplication
- [ ] ✅ **Control which users trigger submission** (email domain/account name filtering)
  - [ ] Implemented: Include/exclude filters in site settings

### Additional Features Implemented (Beyond Original Scope)

- [ ] ✅ **Cookie-based deduplication** (8-hour persistence) instead of session-based
- [ ] ✅ **Email domain and account name filtering** via site settings
- [ ] ✅ **Migration from jQuery to Fetch API** for frontend
- [ ] ✅ **MVVM refactoring** with MarketoBlockViewModel
- [ ] ✅ **Per-instance Marketo configuration** (Hidden Form ID in site settings)

---

## 11. Known Issues & Discrepancies

### From Ticket Comments & PR Analysis:

- [ ] **Exact vs Partial Match Validation** - Clarify implementation:
  - [ ] Test exact match: "vodafone.com" matches only @vodafone.com
  - [ ] Test partial match: "EXT" matches all account names containing "EXT"
  - [ ] Document which strategy is implemented
  - [ ] Confirm with Dev/PO if matches requirements

- [ ] **Security Review Status** - Confirm completion:
  - [ ] Security team review was requested (Sanket Mahimkar) - was it completed?
  - [ ] Document any findings or required changes

- [ ] **GDPR Compliance Approval** - Obtain confirmation:
  - [ ] Legal/compliance team approval for client-side submission
  - [ ] User consent mechanism (if required)

---

## 12. Sign-Off Checklist

### Functional Testing
- [ ] ✅ Hidden form submission works for eligible users (eBiz + included domain)
- [ ] ✅ Form does NOT submit for ineligible users (non-eBiz or excluded domain)
- [ ] ✅ 8-hour cookie deduplication prevents duplicate submissions
- [ ] ✅ Email domain and account name filtering works as expected
- [ ] ✅ Marketo activity log records submissions correctly

### CMS Configuration
- [ ] ✅ Site Settings allow configuration of Marketo integration
- [ ] ✅ Hidden Form ID, include/exclude filters are editable and persist

### Security & Compliance
- [ ] ✅ Only email address is transmitted (minimal PII)
- [ ] ✅ HTTPS is used for all requests
- [ ] ✅ Security team review completed and approved
- [ ] ✅ GDPR compliance confirmed

### Regression Testing
- [ ] ✅ Existing Marketo form blocks work correctly
- [ ] ✅ Authentication flow is unaffected
- [ ] ✅ Session and cookie management for other features is unaffected

### Performance & Monitoring
- [ ] ✅ Page load performance is acceptable
- [ ] ✅ Marketo API quota usage is within limits

### Cross-Browser & Device
- [ ] ✅ Tested on Chrome, Edge, Firefox, Safari
- [ ] ✅ Tested on desktop and mobile devices

### Documentation
- [ ] ✅ Test results documented in this checklist
- [ ] ✅ Any deviations from expected behavior are logged as bugs or clarified with Dev/PO
- [ ] ✅ Known issues and workarounds are documented

---

## 13. Final Verification Summary

**Ticket #13861: Push information to Marketo**

**Test Environment**: ACC (SandBox Instance: 873-HDO-560)  
**Tested By**: [QA Name]  
**Test Date**: [Date]

### Overall Status: ⬜ PASS / ⬜ FAIL / ⬜ CONDITIONAL PASS

### Summary of Findings:
- **Critical Issues**: [List any blocking issues]
- **Major Issues**: [List any major issues that need fixing]
- **Minor Issues**: [List any minor issues or improvements]
- **Passed Test Cases**: [X] / [Total]
- **Failed Test Cases**: [X]
- **Blocked Test Cases**: [X]

### Recommendations:
- [ ] **Approve for INTG** - All critical tests passed
- [ ] **Approve for PROD** - All tests passed, security/GDPR approved
- [ ] **Require fixes** - Critical issues must be resolved before promotion

### Sign-Off:
- **QA Lead**: __________________ Date: __________
- **Product Owner**: __________________ Date: __________
- **Technical Lead**: __________________ Date: __________

---

## Appendix: Test Data

### Test User Accounts
| User Type | Email | Account Name | eBiz Access | Domain Filter | Expected Behavior |
|-----------|-------|--------------|-------------|---------------|-------------------|
| Eligible User 1 | user@vodafone.com | John Doe | Yes | Included | Form submits ✅ |
| Eligible User 2 | user@orange.com | Jane Smith | Yes | Included | Form submits ✅ |
| Excluded User | user@ericsson.com | Internal User | Yes | Excluded | Form does NOT submit ❌ |
| Non-eBiz User | user@example.com | External User | No | Not listed | Form does NOT submit ❌ |
| External Account | user@company.com | John Doe (EXT) | Yes | Not listed | Test partial match ❓ |

### Marketo Configuration
- **SandBox Instance ID**: 873-HDO-560
- **Hidden Form ID**: [Document actual form ID used for testing]
- **Production Instance ID**: 891-BLC-619 (NOT to be used during ACC testing)

### Browser Versions
- Chrome: [Version]
- Edge: [Version]
- Firefox: [Version]
- Safari: [Version]

---

## Notes & Observations

[Use this section to document any observations, edge cases discovered during testing, or clarifications needed from Dev/PO]

---

**End of Checklist**
