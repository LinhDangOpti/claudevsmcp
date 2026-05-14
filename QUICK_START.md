# Quick Start Guide - Azure DevOps MCP Server

## 🚀 Setup in 3 Steps

### Step 1: Build the Server
```bash
cd e:\Coding\mcp\azure-devops-mcp-server
npm run build
```

### Step 2: Add to Claude Code Settings

**Option A: Copy from example file**
1. Open `mcp-config.example.json`
2. Copy the entire JSON content
3. Open Claude Code Settings
4. Paste into MCP Servers section

**Option B: Manual configuration**

Add this to your Claude Code settings:

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": ["e:\\Coding\\mcp\\azure-devops-mcp-server\\dist\\index.js"],
      "env": {
        "AZURE_DEVOPS_ORG_URL": "https://ericsson-web.visualstudio.com",
        "AZURE_DEVOPS_TOKEN": "YOUR_TOKEN_FROM_DOT_ENV_FILE",
        "AZURE_DEVOPS_PROJECT": "ericssondotcom-vnext",
        "AZURE_DEVOPS_USER_EMAIL": "linh.dang.ext@ericsson.com"
      }
    }
  }
}
```

**Where to add**:
- VS Code: File → Preferences → Settings → Search "MCP" → Edit in settings.json
- Claude Desktop: Settings → MCP Servers

### Step 3: Restart Claude Code

Close and reopen Claude Code completely.

---

## ✅ Verify Setup

Try these commands:

```
List all tickets in current sprint
```

```
Get PRs for work item 14317
```

If you see results, setup is successful! 🎉

---

## 📚 Available Skills

### 1️⃣ Analyze PR Changes
```
/analyze-pr 14317
```
- Gets all PRs linked to ticket
- Analyzes changed files
- Categorizes by type (UI, Backend, Styling)
- Assesses testing impact
- Generates recommendations

**Output**: `skill-result/analyze-pr/analyze-pr-14317.md`

### 2️⃣ Generate Test Checklist
```
/create-checklist 14317
```
- Reads ticket details
- Analyzes acceptance criteria
- Generates comprehensive test checklist
- Includes functional, UI, regression tests

**Output**: `skill-result/create-checklist/checklist-14317.md`

---

## 🔧 Common Commands

### Refresh Cache
```bash
npm run refresh
```
Updates `cache/work-items.json` with latest sprint data.

### Query Cache
```bash
npm run query
```
View cached work items.

### Analyze PR Files (Helper Script)
```bash
npm run analyze-pr 14317
```
Standalone PR analysis without MCP (outputs JSON).

---

## 🎯 Recommended Workflow

For any ticket verification:

```bash
# 1. Analyze code changes
/analyze-pr 14317

# 2. Generate test checklist
/create-checklist 14317

# 3. Review both files and start testing
```

This gives you:
- ✅ What changed (code files)
- ✅ Where to focus testing (high priority areas)
- ✅ How to test (acceptance criteria & checklist)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| MCP server not loading | Check `dist/index.js` exists, rebuild with `npm run build` |
| Tools not available | Restart Claude Code after config change |
| Permission errors | Check token in `.env` has Read permissions |
| Cache out of date | Run `npm run refresh` |
| Skill not found | Check `.claude/skills/` folder, restart Claude Code |

---

## 📖 Full Documentation

- **Setup Guide**: `MCP_SETUP.md`
- **Skills Guide**: `SKILLS.md`
- **API Client**: `src/azure-devops-client.ts`

---

## 🎓 Example Session

```
User: /analyze-pr 14317

Claude: Analyzing PRs for ticket 14317...
Found 4 completed PRs with 23 files changed.

Summary:
- UI Views: 8 files (Medium priority)
- Backend: 12 files (High priority)
- Styling: 3 files (Low priority)

High Priority Testing:
- Topic page controller changes
- Content area rendering logic
- API endpoint modifications

Saved to: skill-result/analyze-pr/analyze-pr-14317.md

---

User: /create-checklist 14317

Claude: Generating verification checklist...

Created comprehensive checklist with:
✅ Acceptance Criteria tests
✅ Functionality testing
✅ Cross-browser verification
✅ Regression tests

Saved to: skill-result/create-checklist/checklist-14317.md
```

---

**Ready to start?** Run `npm run build` and add the MCP config! 🚀
