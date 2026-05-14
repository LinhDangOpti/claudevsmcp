---
name: analyze-pr
description: Find PRs linked to an Azure DevOps ticket, read diffs, classify code changes, and identify scope discrepancies between ticket AC and actual implementation. Use when you need to understand what code actually changed for a ticket.
argument-hint: '<ticket-id>'
---

# Analyze PR Skill

## Dependencies

- **MCP Server:** azure-devops (must be configured in .mcp.json)
- **MCP tools:** `mcp__azure-devops__get_work_item_pull_requests`, `mcp__azure-devops__get_pull_request_files`, `mcp__azure-devops__get_pull_request_details`, `mcp__azure-devops__get_pull_request_file_diffs`
- **Knowledge files:** `ericsson-code-base/dotcom-net5/project-knowledge/*.md`

## Purpose
Analyze Pull Request changes linked to an Azure DevOps ticket to understand:
- What code changed
- Which functionalities are affected
- Testing scope and priorities
- Impact severity

## When to Use
- Before code review
- To prepare verification strategy
- To understand scope of changes
- To prioritize testing efforts
- To avoid potential regression risks

## Workflow Overview

```
Get Ticket ID -> Fetch PRs -> Fetch Files & PR Diffs -> Map to Knowledge Files -> Analyze Impact -> Generate Report
```

## Execute workflow

**TOKEN OPTIMIZATION CRITICAL**:
- **NEVER Read entire knowledge files** (they are 1,000-2,000 lines each)
- **ALWAYS use Grep** to search for specific classes/services (~20 lines per match)
- Target: < 30K tokens per analysis (typical: 8-10 files)
- If you exceed 50K tokens, you're doing it wrong - grep more, read less

When the user asks to analyze PRs for a ticket:

1. **Get the ticket ID** from the user's request or skill arguments
   - Accept formats: "analyze PR for 13724", "what changed in #13080", "PR analysis for ticket 13390"
   - Or from command: `/analyze-pr 14364`

2. **Fetch PRs linked to the ticket**:
   - Call MCP tool `mcp__azure-devops__get_work_item_pull_requests` with workItemId parameter
   - If no PRs found, output "No PRs found" and stop

3. **Fetch files and PR details** (in parallel for each PR):
   - `mcp__azure-devops__get_pull_request_details` → title, description, status, branch
   - `mcp__azure-devops__get_pull_request_files` → list of changed file paths + change type (add/edit/delete/rename)
   - `mcp__azure-devops__get_pull_request_file_diffs` → detailed diffs for each changed file

4. **Extract class/service names from changed files**:
   - From file paths, extract the class name:
     ```
     /src/Ericsson.Core/Models/Blocks/StoryBlock.cs → "StoryBlock"
     /src/Ericsson.Application/Glean/GleanService.cs → "GleanService"
     /src/Ericsson.Website/Extensions/ServiceCollectionExtensions.cs → "ServiceCollectionExtensions"
     ```
   - Build a list of `(className, projectName, filePath)` tuples

5. **Search knowledge files efficiently (TOKEN OPTIMIZATION)**:
   - **DO NOT Read entire knowledge files** - this wastes 1000s of tokens
   - Instead, use Grep to search for specific classes:
     ```bash
     Grep(pattern="StoryBlock", 
          glob="**/Ericsson.Core-knowledge.md", 
          output_mode="content", 
          -A=15, -B=5)  # Get 15 lines after, 5 before
     ```
   - Map file paths to knowledge files:
     ```
     /src/Ericsson.Application/      → Ericsson.Application-knowledge.md
     /src/Ericsson.Application.Contracts/ → Ericsson.Application.Contracts-knowledge.md
     /src/Ericsson.Website/          → Ericsson.Website-knowledge.md
     /src/Ericsson.Core/             → Ericsson.Core-knowledge.md
     /src/Ericsson.Infrastructure/   → Ericsson.Infrastructure-knowledge.md
     /src/Ericsson.Shared/           → Ericsson.Shared-knowledge.md
     /src/Ericsson.Configuration/    → Ericsson.Configuration-knowledge.md
     /src/Ericsson.FindSearch/       → Ericsson.FindSearch-knowledge.md
     /src/Ericsson.GSTSearch/        → Ericsson.GSTSearch-knowledge.md
     /src/EPiBootstrapArea/          → EPiBootstrapArea-knowledge.md
     /src/EPiServer.CdnSupport/      → EPiServer.CdnSupport-knowledge.md
     ```
   - All knowledge files are in `ericsson-code-base/dotcom-net5/project-knowledge/`
   - **Only grep for classes that actually changed** — skip unrelated sections
   - If Grep returns no results, that class may not be documented (note this in report)

6. **Analyze impact using grep results**:
   - From grep context (20-30 lines per class), extract:
     - What the service/class does (from "Purpose" or description)
     - What it depends on (from "Dependencies" section)
     - What depends on it (from "Used By" or "Downstream" sections)
   - Use this to infer which **features, pages, or components** are affected
   - If grep context insufficient, only then read specific sections with offset/limit

7. **Generate and save the analysis**:
   - Synthesize findings from grep results into the output format below
   - For classes not found in knowledge files, use generic descriptions based on naming patterns
   - Save the markdown report to `skill-result/analyze-pr/analyze-pr-{ticketId}.md`
   - Present a concise summary to the user

**Token Budget Awareness:**
- Target: Use < 30,000 tokens for typical PR analysis (8-10 changed files)
- If analysis exceeds 50,000 tokens, you're reading too much - switch to grep-only approach
- Priority: Accurate impact analysis > Comprehensive knowledge coverage

## Output Format

```markdown
### PRs Found ({count})

For each PR:
- **PR #{number}:** {title}
- **Status:** {merged/open}
- **Branch:** {source} → {target}
- **Files changed:** {count}

### Changed Files by Component

Group files by their project component and change type:

**{ProjectName}** — {count} files changed
- ✅ Added: `path/to/NewFile.cs`
- ✏️ Modified: `path/to/ExistingFile.cs`, `path/to/AnotherFile.cs`
- ❌ Deleted: `path/to/RemovedFile.cs`
- 🔄 Renamed: `OldName.cs` → `NewName.cs`

### Impact Analysis

For each changed service/class (derived from knowledge files):
- **{ServiceName}** (`path/to/File.cs`)
  - **What it does:** {brief description from knowledge}
  - **Downstream impact:** {features/pages/components that use this service}
  - **Risk level:** {Low/Medium/High}

### Affected Features & Pages
- {Feature or page name} — because {ServiceX} was changed which powers {feature}
- ...

### Changes Beyond AC
- {description of each change not in the ticket}

### Testing Recommendations
- {Specific area to test based on impact analysis}
- ...

### Discrepancies
- **AC asks for:** {X}
- **PRs implement:** {X + Y + Z}
- **Additional changes needing testing:** {list}
```

If no PRs found:
```markdown
### PRs Found (0)
No PRs found for {TICKET_ID}. Analysis limited to ticket AC only.
```

---


**Cost optimization:** Progress Tracking, Error Handling, Self-Correction, and Notes sections are in guidelines.md to reduce auto-loaded context size.
