# Ticket Summary: #13861 - Push information to Marketo

**Type**: User Story  
**State**: Active  
**Assigned To**: Quang Pho (EXT)  
**Sprint**: ericssondotcom-vnext\Sprint 163  
**Created**: 2026-03-06  
**Last Updated**: 2026-05-25  
**Tags**: Commented after test, investigation, Low prio, MoveToNextSprint

---

## Description

As a business technical lead I want to investigate if we can push information to Marketo for signed-in users, so that we can collect more first party data which later can be used for personalization.

### Background

We earlier created a functionality that forwarded information about signed-in users to Marketo. As I recall this included information about email address and the value of the _mkto_trk cookie. The idea was that the Marketo team then should look-up the e-mail in Azure AD to get the remaining content they needed for the user. At that point they were not able to complete this work and we removed our functionality as well.

Now we want to explore if we can revisit this again since the Marketo tool is more mature and we have other possibilities.

We need to ensure that we can forward the data in a secure and GDPR compliant way. We need to make sure that we don't over utilize the API in Marketo. They need to provide us with API details, make sure they can receive the information in a good way, look up the remaining data they need and populate the fields in Marketo.

### Marketo Credentials (from ticket)

**Client Id**: d8c42314-c1f7-4d06-9bb2-b984e079f0e8  
**Client Secret**: ln7sVS3C4I3urSpAVOXwWZ0zV3wjC8qU  
**Authorized User**: dataobjectextract@ericsson.com  
**Documentation**: https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/home  
**Test Instance ID (SandBox)**: 873-HDO-560

---

## Acceptance Criteria / Repro Steps

No explicit acceptance criteria provided in the ticket.

---

## Implementation Summary (from comments)

### Current Implementation
The feature uses client-side Marketo Forms2 API with a hidden form submission mechanism.

**Key Components:**
- Hidden Marketo Form ID configured in Site Settings per Marketo instance
- Client-side JavaScript that loads and submits the Marketo form
- Session/cookie-based deduplication to prevent excessive submissions

**Submission Flow:**
1. User signs in → checks 4 conditions:
   - User has eBiz access
   - Marketo is configured
   - Hidden Form ID is configured
   - User has NOT submitted in the current session
2. If all conditions met → render hidden form JavaScript
3. JavaScript automatically loads the Marketo form and submits the user's email
4. On success → set a session/cookie flag
5. Form will not be re-submitted during the same session

### Recent Changes
- **Sprint 162**: Updated tracking mechanism from session-based (server-side, 20-minute timeout) to cookie-based (client-side, 8-hour persistence) to reduce number of submissions
- **May 12, 2026**: Fixed hidden form configuration for correct Marketo instance on ACC

### Configuration Approach
- **Decision**: Use site-settings for email domain and account name inclusion/exclusion (instead of visitor groups)
- **Validation Strategy**: Ongoing alignment discussion between:
  - Exact-match validation (e.g., complete email domain "google.com" or full account name "Joakim Rydell")
  - Partial-match validation (e.g., substring matching like "EXT" to catch all external users, or ".ext" for domain suffix)

---

## Key Discussion Points from Comments

### 1. Submission Frequency & Deduplication
- **Issue**: Session-based flag expires after 20 minutes, causing re-submissions
- **Solution**: Moved to cookie-based tracking with 8-hour persistence
- Form re-submits when:
  - User closes all browser windows (session cookie cleared)
  - User idle for >20 minutes with no background requests
  - Server restarts
  - User manually clears .AspNetCore.Session cookie
  - User logs out and logs in again

### 2. Visitor Group Filtering
- Requirement: Control which authenticated users are pushed to Marketo based on:
  1. Email domain (e.g., only Vodafone or Orange, exclude ericsson.com)
  2. Account name
- **Decision (May 19)**: Use site-settings properties instead of visitor groups for leaner backend logic

### 3. Security & Privacy
- **Current**: Direct browser → Marketo (no backend API calls)
- **Concern**: Email, formId, and munchkinId visible in browser DevTools Network tab
- **Action Required**: Security team review needed (flagged to Sanket Mahimkar)

### 4. Testing Environment
- Initially deployed to ACC but encountered Marketo form issues
- Form configuration corrected on May 12
- Still testing exact vs partial match validation logic

---

## Development Status

**Pull Requests**: 9 linked PRs  
**Commits**: 21 commits  
**Latest Commit**: 2026-05-25

---

## What to Test

### 1. Hidden Form Submission Flow
- Sign in to MyEricsson with a user that has eBiz access
- Verify hidden form submission triggers automatically
- Check browser Network tab (F12) to confirm form POST to Marketo
- Verify user email is included in the payload

### 2. Deduplication Mechanism (Cookie-based, 8-hour persistence)
- Sign in and verify form submits on first login
- **Within 8 hours**: Close browser and reopen → form should NOT re-submit
- **After 8 hours**: Sign in again → form should re-submit
- **Manual cookie clear**: Delete the Marketo submission cookie → form should re-submit
- Verify session timeout (20 min idle) does NOT cause re-submission within 8-hour window

### 3. Email Domain & Account Name Filtering (Site Settings Configuration)
- Verify site-settings correctly configured with:
  - Included email domains (e.g., "vodafone.com", "orange.com")
  - Excluded email domains (e.g., "ericsson.com")
  - Account name inclusion/exclusion rules
- Test with users from different domains:
  - **Included domain user** (e.g., @vodafone.com) → form SHOULD submit
  - **Excluded domain user** (e.g., @ericsson.com) → form should NOT submit
  - **Non-listed domain user** → verify expected behavior based on configuration

### 4. Validation Logic (Exact vs Partial Match)
- Test exact-match validation:
  - Full email domain "google.com" → matches only @google.com
  - Full account name "Joakim Rydell" → matches only exact name
- Test partial-match validation (if implemented):
  - Substring "EXT" → catches all users with "EXT" in account name
  - Domain suffix ".ext" → catches domains ending with .ext

### 5. Marketo Instance Configuration
- Verify hidden form ID configured correctly in site-settings
- **Test Environment (ACC)**: Use SandBox instance ID `873-HDO-560`
- **Production**: Use production instance ID `891-BLC-619`
- Confirm form submissions appear in Marketo activity log

### 6. Security & GDPR Compliance
- Verify no sensitive data beyond email address is transmitted
- Check _mkto_trk cookie is properly set before form submission
- Confirm data visible in DevTools is acceptable per security review
- Validate GDPR compliance of data transmission method

### 7. Edge Cases
- **User without eBiz access** → form should NOT submit
- **Marketo not configured** → form should NOT submit
- **Hidden Form ID missing** → form should NOT submit
- **No _mkto_trk cookie** → verify form submission behavior

### 8. Marketo Activity Log Verification
- After form submission, check Marketo activity log for the user
- Verify "Fill out form" activity is recorded
- Confirm subsequent page activities are properly tracked and linked to the user
- Validate email address and _mkto_trk cookie association

### 9. Cross-browser Testing
- Test on major browsers (Chrome, Edge, Firefox, Safari)
- Verify cookie persistence across browser sessions
- Confirm JavaScript form submission works consistently

### 10. Performance & API Usage
- Monitor Marketo API quota usage to ensure we're not over-utilizing
- Verify form submissions are batched or rate-limited appropriately
- Check no excessive submissions from single user session

---

## Risk Areas

1. **Security**: Email visible in browser DevTools Network tab - needs security team approval
2. **GDPR Compliance**: Data transmission method must be GDPR compliant
3. **API Quota**: Risk of over-utilizing Marketo API if deduplication fails
4. **Submission Frequency**: Cookie-based deduplication must work reliably to prevent spam
5. **Filtering Logic**: Exact vs partial match still under discussion - implementation may change

---

## Related Documentation

- Marketo Developer Documentation: https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/home
- _mkto_trk Cookie: https://purplemeup.substack.com/p/understanding-the-_mkto_trk-cookie
- Marketo Lead Tracking: https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/javascriptapi/leadtracking/lead-tracking
- Marketo Leads API: https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/rest/lead-database/leads
