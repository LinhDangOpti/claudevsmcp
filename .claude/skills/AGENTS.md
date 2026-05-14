# Azure DevOps MCP Server - Skills Guide

This project includes **custom skills** that guide Claude Code interactions with Azure DevOps work items.

## 🎯 Available Skills

### 1. Summary Ticket (`/summary-ticket`)

**Purpose:** Quickly summarize Azure DevOps work items with comprehensive details.

**Use when:**
- You need a quick overview of a work item
- Before starting verification tasks
- To understand ticket requirements and context
- To review comments and discussions

**Example usage:**
```
summarize ticket 13080
give me details on #13724
what's in work item 13390
```

**What it provides:**
- Full work item details (title, type, state, assignee, tags)
- Description and acceptance criteria
- All comments with authors and dates
- Child work items list
- Linked Pull Requests
- Key insights and flags

---

### 2. Create Checklist (`/create-checklist`)

**Purpose:** Generate comprehensive verification checklists for testing and QA.

**Use when:**
- Before starting verification on a User Story
- To create systematic test coverage
- To ensure all acceptance criteria are tested
- After PR analysis to create targeted test scenarios

**Example usage:**
```
create checklist for ticket 13080
verification steps for #13724
generate test checklist 13390
```

**What it provides:**
- Pre-verification setup steps
- Acceptance criteria-based test cases
- Functionality testing (based on PR analysis if available)
- Edge cases and negative testing scenarios
- Regression testing items
- Browser/device compatibility checks
- Sign-off section

**Smart features:**
- Analyzes linked PRs to identify test areas
- Groups tests by functionality impact
- Prioritizes high-impact areas
- Customizes checklist based on work item type (User Story, Bug, Task)
- Flags missing acceptance criteria

---

### 3. Analyze PR (`/analyze-pr`)

**Purpose:** Analyze Pull Request changes to understand code impact and testing scope.

**Use when:**
- Before code review
- To prepare verification strategy
- To understand scope of changes
- To prioritize testing efforts

**Example usage:**
```
analyze PR for 13724
what changed in #13080
PR analysis for ticket 13390
```

**What it provides:**
- Summary of PRs and changed files
- Functionality impacts with severity (High/Medium/Low)
- Changed files categorized by type (UI, Backend, Styling)
- Testing recommendations prioritized
- Next steps for verification

**Smart features:**
- Reads existing PR analysis from `pr-analysis/` folder
- Categorizes files by impact severity
- Provides targeted testing recommendations
- Integrates with create-checklist skill

---

## 🚀 How to Use Skills

### Option 1: Natural Language (Recommended)
Just ask Claude Code in natural language:
```
"Can you summarize ticket 13080 for me?"
"I need a verification checklist for work item 13724"
"What PR changes were made in #13080?"
```

Claude Code will automatically recognize your intent and use the appropriate skill.

### Option 2: Explicit Skill Invocation
Use the `/` slash command:
```
/summary-ticket 13080
/analyze-pr 13724
/create-checklist 13724
```

---

## 📋 Typical Workflow

### Before Starting Work on a Ticket:

1. **Get the summary** to understand context:
   ```
   summarize ticket 13724
   ```

2. **Analyze PR changes** to see what code was modified:
   ```
   analyze PR for 13724
   ```

3. **Create verification checklist** based on requirements and code changes:
   ```
   create checklist for 13724
   ```

4. **Use the checklist** during testing to ensure complete coverage

### During Verification:

1. **Check off items** as you test
2. **Document findings** in the checklist
3. **Update ticket** with results

---

## 🔧 Skill Configuration

Skills are automatically loaded from the `.skills/` directory when you use Claude Code in this project.

### Adding Your Own Skills

To create a new skill:

1. Create a new `.md` file in `.skills/` directory
2. Add frontmatter with metadata:
   ```yaml
   ---
   name: your-skill-name
   description: What your skill does
   tags: [category1, category2]
   ---
   ```
3. Write clear instructions for Claude Code
4. Include examples of when and how to use it

**Skill file structure:**
```markdown
---
name: skill-name
description: Brief description
tags: [tag1, tag2]
---

# Skill Name

## Purpose
Why this skill exists

## When to Use
Situations where this skill is helpful

## Instructions
Step-by-step guide for Claude Code to follow

## Examples
Sample user requests and expected behavior
```

---

## 💡 Tips for Best Results

1. **Be specific with work item IDs**: Use the exact ID number
2. **Combine skills**: First summarize, then create checklist
3. **Update checklists**: Edit generated checklists to fit your specific needs
4. **Save checklists**: Keep them for documentation and future reference
5. **Use PR analysis**: Run `npm run test:pr {id}` first for better checklists

---

## 🔗 Integration with Other Tools

### MCP Tools
Skills use Azure DevOps MCP tools in the background:
- `azdo_get_work_item` - Fetch work item details
- `azdo_query_work_items` - Query multiple items
- `azdo_get_work_item_comments` - Get comments
- `azdo_get_pull_request` - Get PR details

### PR Analysis
Create checklist skill integrates with PR analysis:
```bash
# First, analyze PRs
npm run test:pr 13724

# Then create checklist (will use PR analysis data)
create checklist for 13724
```

---

## 📝 Example Session

```
You: "I need to verify ticket 13724, can you help?"

Claude: "I'll help you prepare for verifying #13724. Let me first summarize 
         the ticket to understand what needs to be tested."
         
         [Fetches and shows summary]
         
         "Now I'll create a comprehensive verification checklist based on 
         the acceptance criteria and linked PRs."
         
         [Generates checklist saved to checklist-13724.md]
         
         "The checklist is ready! I've included:
         - 5 acceptance criteria test cases
         - UI testing for Speaker Page and Start Page
         - Styling verification for 2 components
         - Browser compatibility checks
         - Regression testing items
         
         You can start verification using this checklist."
```

---

## 🎓 Learning Resources

- **Azure DevOps MCP Server**: See main [README.md](../README.md)
- **MCP Protocol**: Learn about Model Context Protocol integration
- **PR Analysis**: See [README.md](../README.md#-pr-analysis--verification-checklist-phase-1)

---

## 🚧 Future Skills (Ideas)

Want to add more skills? Here are some ideas:
- **analyze-pr**: Deep dive into PR changes and code review
- **find-duplicates**: Search for duplicate work items
- **sprint-report**: Generate sprint progress reports
- **bug-analysis**: Analyze bug patterns and trends
- **test-coverage**: Check test coverage for a work item

---

**Last Updated:** 2026-05-11
**Version:** 1.0.0
