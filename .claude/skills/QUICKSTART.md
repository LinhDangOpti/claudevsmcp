# Skills Quick Start Guide

Follow these steps to test your new skills in Claude Code.

## 🚀 Setup (One-time)

Skills are already configured in the `.skills/` directory. Claude Code will automatically load them when you work in this project.

## ✅ Test Your Skills

### Test 1: Summary Ticket

Open Claude Code and try:

```
summarize ticket 13080
```

Or any ticket ID you have access to. Claude Code will:
1. Fetch the work item from Azure DevOps
2. Extract all details (description, comments, child items, PRs)
3. Present a formatted summary

**Expected output:**
- Work item title, type, state, assignee, tags
- Full description and acceptance criteria
- All comments with authors
- Child work items list
- Linked PRs

---

### Test 2: Analyze PR

First, generate PR analysis data:

```bash
npm run test:pr 13724
```

Then ask Claude Code:

```
analyze PR for 13724
```

Claude Code will:
1. Read the PR analysis file from `pr-analysis/` folder
2. Show functionality impacts with severity
3. Provide testing recommendations
4. Prioritize test areas

**Expected output:**
- PR summary (count, files changed)
- Functionality impacts (High/Medium/Low)
- Changed files by category
- Testing recommendations

---

### Test 3: Create Checklist

Ask Claude Code:

```
create checklist for ticket 13724
```

Claude Code will:
1. Fetch work item details
2. Extract acceptance criteria
3. Analyze linked PRs (if available)
4. Generate comprehensive test checklist
5. Save to `checklist-13724.md`

**Expected output:**
- Pre-verification setup steps
- AC-based test cases
- Functionality testing scenarios
- Edge cases and regression items
- Browser/device compatibility checks

---

## 🎯 Complete Workflow Example

Try this complete flow:

1. **Summarize**:
   ```
   summarize ticket 13080
   ```

2. **Analyze PRs**:
   ```bash
   # First generate PR data
   npm run test:pr 13080
   ```
   
   ```
   # Then analyze
   analyze PR for 13080
   ```

3. **Create Checklist**:
   ```
   create checklist for 13080
   ```

4. **Review checklist**:
   ```
   open checklist-13080.md
   ```

---

## 💡 Tips for Testing

1. **Use real ticket IDs** from your Azure DevOps project
2. **Have cache refreshed**: Run `npm run refresh` first
3. **Generate PR analysis** before using analyze-pr skill
4. **Try natural language**: Claude Code understands variations like:
   - "what's in ticket 13080?"
   - "give me verification steps for #13724"
   - "what code changed in work item 13390?"

---

## 🐛 Troubleshooting

### Skill not working?

1. **Check .skills directory exists**:
   ```bash
   ls -la .skills/
   ```
   Should show: AGENTS.md, summary-ticket.md, create-checklist.md, analyze-pr.md

2. **Verify you're in the right directory**:
   Skills only work when Claude Code is opened in this project folder

3. **Try explicit slash command**:
   Instead of natural language, use:
   ```
   /summary-ticket 13080
   ```

### Azure DevOps connection issues?

1. **Check .env file** has correct credentials
2. **Refresh cache**: `npm run refresh`
3. **Test connection**: `npm run cli my-verify`

### PR analysis not found?

1. **Generate it first**: `npm run test:pr {id}`
2. **Check pr-analysis folder**: `ls pr-analysis/`
3. The skill will guide you if data is missing

---

## 📚 Next Steps

After testing:

1. **Customize skills** to fit your workflow
2. **Add new skills** for other common tasks
3. **Share with team** - commit the `.skills/` folder
4. **Update AGENTS.md** with your new skills

---

## 🎓 Creating Your Own Skill

Want to create a new skill? Here's a quick template:

1. Create `.skills/my-new-skill.md`
2. Add this structure:

```markdown
---
name: my-new-skill
description: What this skill does in one sentence
tags: [category1, category2]
---

# My New Skill

## Purpose
Why this skill exists

## When to Use
Situations where this is helpful

## Instructions
Step-by-step guide for Claude Code:

1. Get input from user
2. Process the data
3. Present results in format X

## Examples

**User:** "do something"

**Assistant:**
- Does X
- Shows Y
- Saves Z
```

3. Test it:
   ```
   /my-new-skill
   ```

---

**Need help?** See [AGENTS.md](./AGENTS.md) for complete documentation.
