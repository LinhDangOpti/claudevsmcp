---
name: summary-ticket
description: 'Analyze an Azure DevOps ticket by ID. Fetches full ticket details including title, type, state, assignee, description, acceptance criteria, technical solution and comments from Azure DevOps. Then presents a clean summary to the user to help them understand the ticket content, context and what they need to test.'
argument-hint: '<ticket-id>'
---

# Summary Ticket

## When to Use
- User says "summary ticket 12345"
- User says "tóm tắt ticket 12345"
- User asks about a specific ticket ID
- User wants to know details of a work item

## Execution Guidelines

**IMPORTANT**: This skill must execute autonomously without asking user permission:
- DO NOT ask user to run commands - execute them directly
- DO NOT suggest "you can run X" - just run it automatically
- All MCP tool calls and file operations must happen without user confirmation
- User has already invoked this skill - that is authorization to perform all necessary steps

## Workflow

1. **Fetch ticket data** directly from Azure DevOps API:
   - Run `node dist/scripts/get-ticket-direct.js <ticket-id>` to fetch ticket details
   - The script returns full ticket details as JSON from Azure DevOps API
   - Parse the JSON response
2. If ticket **not found** (error from script):
   - Inform user the ticket was not found and suggest checking the ticket ID
3. If ticket **found**, present a clean summary covering:
   - **Title**, Type, State, Assigned To, Sprint, Tags
   - **Description** (strip all HTML tags, decode `&nbsp;` as space)
   - **Acceptance Criteria / Repro Steps** (`reproSteps` field, strip HTML)
   - **Technical Solution** (`description` field if separate, strip HTML)
   - **Recent Comments** (author, date, strip HTML from `text` field)
5. End the summary with a **"What to Test"** section that clearly lists the key areas a QA should verify, derived from the ticket content:
   - Extract testable requirements from description and acceptance criteria
   - Identify affected features, pages, or components
   - Call out any edge cases or risk areas mentioned in comments
   - Keep it concise — bullet points, actionable, no fluff
   - Example format:
     ```
     ## What to Test
     - Verify that [main feature/fix] works as expected
     - Check [affected page/component] on INTG environment
     - Test edge case: [specific scenario from ticket]
     - Confirm [mentioned risk area] is not broken
     ```
   - Save the results in `skill-result/summary-ticket/summary-ticket-{ticketId}.md` for future reference and caching

## Script Response Structure

The `get-ticket-direct.js` script returns:
```json
{
  "id": number,
  "title": string,
  "type": string,
  "description": string (HTML),
  "reproSteps": string | null (HTML - Acceptance Criteria),
  "state": string,
  "assignedTo": string,
  "createdDate": string,
  "changedDate": string,
  "tags": string,
  "comments": [
    { "author": string, "date": string, "text": string (HTML) }
  ],
  "development": {
    "hasPullRequests": boolean,
    "hasCommits": boolean,
    "pullRequests": [...],
    "commits": [...]
  }
}
```

## Example Invocation
```
analyze ticket 14205
summary ticket 14205
tóm tắt ticket 14205
```

## Technical Notes
- Calls Azure DevOps API directly via `get-ticket-direct.js` script - fetches fresh data
- Strip all HTML tags when presenting: remove `<[^>]*>` and decode `&nbsp;` → space
- If `reproSteps` is present and not null, label it as **Acceptance Criteria / Repro Steps**
- If `reproSteps` is null/empty, check comments for AC or look in description

## Permission Model
- User invoking this skill = authorization to execute all necessary operations
- Bash commands are auto-allowed via `.claude/settings.json` configuration
- No permission prompts should appear - the skill executes autonomously
- Execute all workflow steps autonomously - this is a fully automated skill

