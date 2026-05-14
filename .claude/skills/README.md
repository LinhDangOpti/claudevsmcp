# Skills Directory

This directory contains **custom skills** for Claude Code to help with Azure DevOps work item analysis and verification.

## 📁 Structure

```
.skills/
├── AGENTS.md              # Main documentation and skill guide
├── summary-ticket.md      # Skill: Summarize Azure DevOps work items
├── create-checklist.md    # Skill: Generate verification checklists
└── README.md             # This file
```

## 🎯 Quick Start

Skills are automatically loaded when you use Claude Code in this project.

### Try it now:
```
summarize ticket 13080
create checklist for 13724
```

## 📚 Documentation

See [AGENTS.md](./AGENTS.md) for complete skill documentation including:
- Available skills and their purposes
- Usage examples
- How to create new skills
- Best practices and tips

## 🔧 Adding New Skills

1. Create a new `.md` file in this directory
2. Add YAML frontmatter with metadata
3. Write clear instructions for Claude Code
4. Test your skill with Claude Code

**Template:**
```markdown
---
name: your-skill-name
description: Brief description of what the skill does
tags: [category1, category2]
---

# Your Skill Name

## Purpose
...

## When to Use
...

## Instructions
...

## Examples
...
```

## 🎓 Learn More

- [Azure DevOps MCP Server README](../references/README.md)
- [AGENTS.md](./AGENTS.md) - Complete skill guide
