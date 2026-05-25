---
name: qa-prep
description: Complete QA preparation workflow - analyze ticket summary, PR changes, and generate comprehensive testing checklist in one command
argument-hint: '<ticket-id>'
---

# QA Prep Skill

## Purpose
Execute a complete, end-to-end QA preparation workflow for an Azure DevOps ticket. This orchestrator skill chains together three specialized skills to provide comprehensive testing context.

## When to Use
- When starting QA work on a new ticket
- When you need complete context (what changed, why, and how to test)
- When you want all testing artifacts generated in one command
- Before creating a test plan or starting verification

## Workflow

This skill orchestrates three existing skills with smart caching:

```
1. Check for existing results in skill-result/ folder
   ├─ If found: Reuse existing summary-ticket & analyze-pr results (saves 20K-40K tokens)
   └─ If missing: Execute full workflow below

2. summary-ticket   → Understand ticket requirements & context (conditional)
3. analyze-pr       → Analyze code changes & affected features (conditional)
4. create-checklist → Generate comprehensive verification checklist (always runs)
5. Present summary  → Show results and key testing focus areas
```

Each step builds on the previous one's output, stored in `skill-result/` directories for reuse.

## Execution Steps

**IMPORTANT**: Execute autonomously without asking permission. User invoking this skill = authorization for all steps.

### Step 1: Check for Existing Results

**Optimize token usage by reusing existing analysis files.**

Check if the following files already exist in `skill-result/` folder:
- `skill-result/summary-ticket/summary-ticket-{ticket-id}.md`
- `skill-result/analyze-pr/analyze-pr-{ticket-id}.md`

**Decision logic**:
- ✅ **If BOTH files exist**: Skip steps 2-3, proceed directly to step 4 (create-checklist will reuse these files)
- ❌ **If EITHER file is missing**: Execute full workflow starting from step 2

This optimization saves 20K-40K tokens by avoiding redundant Azure DevOps API calls and PR analysis when results already exist from a previous run.

### Step 2: Summarize Ticket (Conditional)

**Only execute if Step 1 determined files are missing.**

Invoke the `summary-ticket` skill:
```
/summary-ticket {ticket-id}
```

This fetches ticket details from Azure DevOps and generates:
- Ticket summary with title, description, AC, comments
- "What to Test" section derived from requirements
- Saved to: `skill-result/summary-ticket/summary-ticket-{id}.md`

**Wait for completion** before proceeding to Step 3.

### Step 3: Analyze PR Changes (Conditional)

**Only execute if Step 1 determined files are missing.**

Invoke the `analyze-pr` skill:
```
/analyze-pr {ticket-id}
```

This fetches linked PRs and analyzes:
- Changed files grouped by component
- Impact analysis using codebase knowledge files
- Affected features and pages
- Testing recommendations
- Saved to: `skill-result/analyze-pr/analyze-pr-{id}.md`

**Wait for completion** before proceeding to Step 4.

**Handle "No PRs found" case**: If analyze-pr reports no PRs found, that's OK - continue to step 4. The checklist will be based on ticket AC only.

### Step 4: Create Comprehensive Checklist

**Always execute this step** (checklist should be generated fresh each time).

Invoke the `create-checklist` skill:
```
/create-checklist {ticket-id}
```

This generates a comprehensive testing checklist by:
- Reusing context from summary-ticket & analyze-pr (reads the skill-result files from steps 2-3 OR from previous runs)
- Combining ticket requirements + code changes analysis
- Producing structured, actionable test cases
- Saved to: `skill-result/create-checklist/checklist-{id}.md`

**Wait for completion** before proceeding to Step 5.

### Step 5: Present Final Summary

After all steps complete successfully, present a concise summary:

```markdown
## ✅ QA Prep Complete for Ticket #{ticket-id}

### Generated Artifacts
- 📋 [Ticket Summary](skill-result/summary-ticket/summary-ticket-{id}.md)
- 🔍 [PR Analysis](skill-result/analyze-pr/analyze-pr-{id}.md)
- ✅ [Test Checklist](skill-result/create-checklist/checklist-{id}.md)

### Key Testing Focus Areas
{2-3 bullet points synthesizing the most critical areas from all 3 outputs}

### Next Steps
1. Review the comprehensive checklist
2. Start verification on INTG environment
3. Update ticket with testing progress
```

**Note**: If Step 1 found existing files and skipped steps 2-3, mention this in the summary:
```
ℹ️ Reused existing summary-ticket and analyze-pr results from previous run (saved ~30K tokens)
```

## Error Handling

- **Ticket not found**: Report to user, suggest verifying ticket ID, stop workflow
- **No PRs found**: Continue to checklist generation (will be based on AC only)
- **Any skill fails**: Report which step failed, provide error details, stop workflow

## Token Optimization

- **Smart caching**: Checks for existing results before invoking skills (saves 20K-40K tokens on re-runs)
- Each skill manages its own token budget
- Context sharing via files prevents redundant API calls
- `create-checklist` always reuses existing `summary-ticket` and `analyze-pr` results
- **First run**: 40K-60K tokens for a standard ticket
- **Subsequent runs** (with cached results): 10K-20K tokens (only generates fresh checklist)

## Example Invocations

```
/qa-prep 14310
/qa-prep 13724
qa prep ticket 14205
prepare QA for 14343
```

## Permission Model

- User invoking this skill = authorization for all sub-skills
- Each sub-skill is configured for autonomous execution
- No permission prompts should appear during the workflow
- All MCP calls, file operations, and bash commands are auto-allowed

## Notes

- This is an **orchestrator skill** - it does not duplicate logic, only coordinates existing skills
- Each sub-skill remains independently usable (can still run `/summary-ticket` alone)
- Context files in `skill-result/` enable efficient information reuse and caching
- **Smart caching**: Automatically detects and reuses existing analysis files to save tokens
- The workflow is **sequential** - each step depends on the previous one completing
- To force a fresh run, manually delete files in `skill-result/summary-ticket/` and `skill-result/analyze-pr/` before invoking
