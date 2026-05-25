# Quick Start Guide - Azure DevOps MCP Server

## 📖 What is this?

This repository provides:
- **MCP Server**: Model Context Protocol server that connects Claude Code to Azure DevOps APIs
- **Custom Skills**: Automated QA workflows for ticket analysis, PR review, and test checklist generation
- **Scripts**: Helper tools for ticket fetching, PR analysis, and cache management

**Use case**: Streamline QA verification workflow for ericsson.com (Optimizely CMS) project by automating ticket analysis and test planning.

---

## ⚙️ Prerequisites

Before you start, ensure you have:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Azure DevOps access**:
   - Access to `ericsson-web` organization
   - Project: `ericssondotcom-vnext`
   - Personal Access Token (PAT) with Work Items Read permissions
4. **Claude Code** installed (VS Code extension or Desktop app)

---

## 🚀 Setup in 4 Steps

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd azure-devops-mcp-server

# Install dependencies
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and fill in your Azure DevOps credentials:

```env
AZURE_DEVOPS_ORG_URL=https://ericsson-web.visualstudio.com
AZURE_DEVOPS_TOKEN=your_personal_access_token_here
AZURE_DEVOPS_PROJECT=ericssondotcom-vnext
AZURE_DEVOPS_USER_EMAIL=your.email@ericsson.com
```

**How to get Personal Access Token**:
1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Create new token with "Work Items (Read)" scope
3. Copy the token and paste it in `.env` file

### Step 3: Build the Server

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Step 4: Add to Claude Code Settings

**Option A: Copy from example file (Recommended)**
1. Open `mcp-config.example.json` in this repo
2. Copy the entire JSON content
3. Update the path to match your local repo location
4. Open Claude Code Settings (see below)
5. Paste into MCP Servers section

**Option B: Manual configuration**

Add this to your Claude Code settings:

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH_TO_YOUR_REPO>\\dist\\index.js"],
      "env": {
        "AZURE_DEVOPS_ORG_URL": "https://ericsson-web.visualstudio.com",
        "AZURE_DEVOPS_TOKEN": "YOUR_TOKEN_FROM_DOT_ENV_FILE",
        "AZURE_DEVOPS_PROJECT": "ericssondotcom-vnext",
        "AZURE_DEVOPS_USER_EMAIL": "your.email@ericsson.com"
      }
    }
  }
}
```

**Where to add**:
- **VS Code**: File → Preferences → Settings → Search "MCP" → Edit in settings.json
- **Claude Desktop**: Settings → MCP Servers

**Important**: Replace `<ABSOLUTE_PATH_TO_YOUR_REPO>` with your actual path (e.g., `C:\\Users\\YourName\\azure-devops-mcp-server`).

### Step 5: Restart Claude Code

Close and reopen Claude Code completely for changes to take effect.

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

### 1️⃣ QA Prep (Orchestrator) - **⭐ RECOMMENDED**
```
/qa-prep 14310
```

**What it does**: Complete end-to-end QA preparation workflow in one command.

**Workflow**:
1. ✅ Checks for existing analysis (smart caching)
2. 📋 Summarizes ticket requirements & context
3. 🔍 Analyzes linked PR code changes
4. ✅ Generates comprehensive test checklist

**Smart Caching**: 
- First run: ~40K-60K tokens
- Subsequent runs: ~10K-20K tokens (reuses existing summary & PR analysis)
- Automatically skips steps 2-3 if results already exist

**Output**: Three files
- `skill-result/summary-ticket/summary-ticket-14310.md`
- `skill-result/analyze-pr/analyze-pr-14310.md`
- `skill-result/create-checklist/checklist-14310.md`

**When to use**: 
- ✅ Starting verification on a new ticket
- ✅ Need complete testing context (what, why, how to test)
- ✅ Want all QA artifacts generated in one go

---

### 2️⃣ Summary Ticket
```
/summary-ticket 14310
```

**What it does**: Fetches and summarizes Azure DevOps ticket details.

**Provides**:
- Title, Type, State, Assigned To, Sprint, Tags
- Description (HTML stripped)
- Acceptance Criteria / Repro Steps
- Recent Comments
- **"What to Test"** section (key testing areas)

**Output**: `skill-result/summary-ticket/summary-ticket-14310.md`

**When to use**:
- ✅ Need quick ticket overview
- ✅ Want to understand requirements without opening Azure DevOps
- ✅ Building context before code analysis

---

### 3️⃣ Analyze PR
```
/analyze-pr 14310
```

**What it does**: Analyzes all PRs linked to a ticket and maps changes to affected features.

**Provides**:
- List of PRs (status, branch, files changed)
- Changed files grouped by component
- Impact analysis using codebase knowledge files
- Affected features & pages
- Changes beyond acceptance criteria
- Testing recommendations

**Token Optimized**: Uses grep instead of reading full knowledge files (~30K tokens per analysis).

**Output**: `skill-result/analyze-pr/analyze-pr-14310.md`

**When to use**:
- ✅ Before code review
- ✅ Need to understand what code changed
- ✅ Want to know testing scope and priorities
- ✅ Check for scope creep (changes beyond AC)

---

### 4️⃣ Create Checklist
```
/create-checklist 14310
```

**What it does**: Generates comprehensive verification checklist based on ticket and PR analysis.

**Checklist includes**:
- Acceptance Criteria testing
- Functional testing (based on code changes)
- UI/UX verification
- Cross-browser testing
- Mobile/tablet testing
- Regression testing
- Performance checks
- Accessibility (WCAG)
- SEO verification

**Context Reuse**: Automatically uses existing summary-ticket and analyze-pr results if available.

**Output**: `skill-result/create-checklist/checklist-14310.md`

**When to use**:
- ✅ Need systematic test coverage
- ✅ Want structured test cases
- ✅ Ensure nothing is missed during verification

---

## 🔧 MCP Tools Available

Once the MCP server is configured, these tools become available in Claude Code:

### Sprint & Ticket Management
- `get_current_sprint_info` - Get current sprint details
- `list_all_current_sprint_tickets` - List all tickets in current sprint
- `get_my_current_sprint_tickets` - Get tickets assigned to you
- `get_tickets_by_state` - Filter tickets by state (e.g., "In ACC", "Active")
- `query_tickets` - Natural language queries (e.g., "tickets in ACC without commits")

### Ticket Details
- `get_work_item_details` - Full ticket details (description, AC, comments, tags)
- `get_work_item_pull_requests` - Get PRs linked to a ticket

### Pull Request Analysis
- `get_pull_request_details` - PR details (title, status, branch, description)
- `get_pull_request_files` - List of changed files in PR
- `get_pull_request_file_diffs` - Detailed diffs with additions/deletions

### Example Usage in Chat

```
User: List all tickets in current sprint

User: Get me tickets assigned to linh.dang.ext@ericsson.com in current sprint

User: Show me details for ticket 14310

User: What PRs are linked to work item 13861?

User: Get file diffs for PR 14343
```

---

## 🛠️ Common Commands

### Build TypeScript
```bash
npm run build
```
Compiles TypeScript files to JavaScript in `dist/` folder.

### Refresh Cache
```bash
npm run refresh
```
Updates `cache/work-items.json` with latest sprint data from Azure DevOps.

### Query Cache
```bash
npm run query
```
View cached work items without hitting Azure DevOps API.

### Analyze PR Files (Helper Script)
```bash
npm run analyze-pr 14317
```
Standalone PR analysis script (outputs JSON, no MCP required).

### Get Ticket Direct (Helper Script)
```bash
node dist/scripts/get-ticket-direct.js 14310
```
Fetches ticket details directly from Azure DevOps API (used by summary-ticket skill).

---

## 🎯 Recommended Workflows

### Option 1: Complete QA Prep (⭐ Recommended)

Use the orchestrator skill for full automation:

```bash
# One command does everything
/qa-prep 14310
```

**Results**:
- 📋 Ticket summary with requirements
- 🔍 PR analysis with affected features
- ✅ Comprehensive test checklist

**Benefits**:
- ✅ Saves time (one command vs three)
- ✅ Smart caching (20K-40K token savings on re-runs)
- ✅ Complete testing context in one go

---

### Option 2: Step-by-Step (for selective use)

Run skills individually when you only need specific parts:

```bash
# 1. Understand the ticket
/summary-ticket 14310

# 2. See what code changed
/analyze-pr 14310

# 3. Get test checklist
/create-checklist 14310
```

**When to use**:
- Only need ticket summary (skip PR analysis)
- Ticket has no PRs yet (checklist from AC only)
- Want to review each step before continuing

---

### Typical QA Session Flow

```
1. Get ticket assignment in Azure DevOps
2. Run: /qa-prep <ticket-id>
3. Review generated checklist
4. Start verification on INTG environment
5. Update ticket with results
```

---

## 💡 Tips & Best Practices

### Token Optimization
- ✅ Use `/qa-prep` instead of running skills individually (smart caching saves 20K-40K tokens)
- ✅ Cached results persist across sessions - delete files in `skill-result/` to force fresh analysis
- ✅ First run expensive (~50K tokens), subsequent runs cheap (~15K tokens)

### Workflow Efficiency
- ✅ Run `/qa-prep` once per ticket - generates all testing artifacts
- ✅ Review `checklist-<id>.md` before starting verification
- ✅ Use `analyze-pr-<id>.md` to understand code changes and affected features
- ✅ Reference `summary-ticket-<id>.md` for AC and requirements

### Codebase Knowledge
- The repo includes knowledge files for each project component (in `ericsson-code-base/dotcom-net5/project-knowledge/`)
- Skills use these to map code changes → affected features
- Keep knowledge files updated when architecture changes

### Cache Management
- Refresh cache weekly: `npm run refresh`
- Cache location: `cache/work-items.json`
- Cache includes: current sprint tickets with basic details

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **MCP server not loading** | 1. Check `dist/index.js` exists<br>2. Run `npm run build`<br>3. Verify path in Claude settings matches your repo location<br>4. Check `.env` file exists and has correct values |
| **Tools not available in Claude** | 1. Restart Claude Code completely (close all windows)<br>2. Check MCP server status in Claude settings<br>3. Look for errors in Claude Code console |
| **Permission/Authentication errors** | 1. Check token in `.env` has "Work Items (Read)" permissions<br>2. Test token: `npm run query` (should fetch tickets)<br>3. Regenerate PAT if expired |
| **Skills not found** | 1. Check `.claude/skills/` folder exists<br>2. Restart Claude Code<br>3. Verify SKILL.md files are present in each skill folder |
| **Empty or outdated results** | 1. Delete files in `skill-result/` folder<br>2. Run skill again for fresh analysis<br>3. Run `npm run refresh` to update cache |
| **"No PRs found" error** | 1. Verify ticket has linked PRs in Azure DevOps<br>2. Check PRs are not in draft state<br>3. Skills will generate checklist from AC only if no PRs |
| **Build errors** | 1. Delete `node_modules/` and `dist/`<br>2. Run `npm install`<br>3. Run `npm run build`<br>4. Check Node.js version (v16+) |
| **TypeScript errors** | 1. Check `tsconfig.json` is present<br>2. Run `npm install --save-dev typescript`<br>3. Verify all dependencies installed |

---

## 📁 Repository Structure

```
azure-devops-mcp-server/
├── .claude/                          # Claude Code configuration
│   ├── settings.json                 # Project-specific settings
│   └── skills/                       # Custom skills
│       ├── summary-ticket/           # Ticket summary skill
│       ├── analyze-pr/               # PR analysis skill
│       ├── create-checklist/         # Checklist generation skill
│       └── qa-prep/                  # QA prep orchestrator skill
│
├── src/                              # TypeScript source code
│   ├── index.ts                      # MCP server entry point
│   ├── azure-devops-client.ts        # Azure DevOps API client
│   ├── tools/                        # MCP tool implementations
│   └── scripts/                      # Helper scripts
│       ├── get-ticket-direct.ts      # Direct ticket fetching
│       ├── analyze-pr-files.ts       # PR file analysis
│       └── refresh-cache.ts          # Cache management
│
├── dist/                             # Compiled JavaScript (generated)
│   ├── index.js                      # MCP server (built from src/)
│   └── scripts/                      # Compiled scripts
│
├── skill-result/                     # Skill outputs (generated)
│   ├── summary-ticket/               # Ticket summaries
│   ├── analyze-pr/                   # PR analyses
│   └── create-checklist/             # Test checklists
│
├── ericsson-code-base/               # Codebase knowledge files
│   └── dotcom-net5/
│       └── project-knowledge/        # Component documentation
│           ├── Ericsson.Website-knowledge.md
│           ├── Ericsson.Core-knowledge.md
│           ├── Ericsson.Application-knowledge.md
│           └── ...
│
├── cache/                            # Cached Azure DevOps data
│   └── work-items.json               # Sprint tickets cache
│
├── .env                              # Environment variables (create this)
├── .env.example                      # Environment template
├── mcp-config.example.json           # MCP server config template
├── package.json                      # Node.js dependencies
├── tsconfig.json                     # TypeScript config
└── QUICK_START.md                    # This file
```

### Key Directories

- **`.claude/skills/`**: Custom Claude Code skills (autonomous workflows)
- **`src/`**: TypeScript source code for MCP server and scripts
- **`dist/`**: Compiled JavaScript (run `npm run build` to generate)
- **`skill-result/`**: Generated artifacts from skills (summaries, analyses, checklists)
- **`ericsson-code-base/`**: Knowledge files mapping code → features (used by analyze-pr)

---

## 📖 Full Documentation

### Core Documentation
- **🚀 Quick Start**: `QUICK_START.md` (this file)
- **⚙️ MCP Setup**: `MCP_SETUP.md` - Detailed MCP server configuration
- **🎯 Skills Guide**: `SKILLS.md` - Complete skills reference
- **📝 README**: `README.md` - Project overview

### Technical Reference
- **API Client**: `src/azure-devops-client.ts` - Azure DevOps API wrapper
- **MCP Tools**: `src/tools/` - Tool implementations
- **Scripts**: `src/scripts/` - Helper utilities

### Skill Documentation
Each skill has detailed documentation in its folder:
- `.claude/skills/summary-ticket/SKILL.md`
- `.claude/skills/analyze-pr/SKILL.md`
- `.claude/skills/create-checklist/SKILL.md`
- `.claude/skills/qa-prep/SKILL.md`

---

## 🎓 Example Session

### First Time Running QA Prep

```
User: /qa-prep 13861

Claude: Executing QA prep workflow for ticket 13861...

Step 1/4: Checking for existing results...
No cached results found. Running full workflow.

Step 2/4: Fetching ticket summary...
✅ Ticket #13861: [Optimizely] Marketo form submit not counted as conversion
Type: User Story | State: In ACC | Assigned: Linh Dang

Step 3/4: Analyzing linked PRs...
✅ Found 7 PRs with 14 unique files changed
- Ericsson.Website: 8 files modified
- Ericsson.Core: 4 files modified
- Ericsson.Application: 2 files modified

Key changes:
- Migration from session-based to cookie-based deduplication
- jQuery to Fetch API migration
- Email domain filtering implementation

Step 4/4: Generating comprehensive checklist...
✅ Created 200+ point verification checklist

## ✅ QA Prep Complete for Ticket #13861

### Generated Artifacts
- 📋 [Ticket Summary](skill-result/summary-ticket/summary-ticket-13861.md)
- 🔍 [PR Analysis](skill-result/analyze-pr/analyze-pr-13861.md)
- ✅ [Test Checklist](skill-result/create-checklist/checklist-13861.md)

### Key Testing Focus Areas
- Hidden form submission and cookie-based deduplication (8-hour window)
- Email domain filtering (ericsson.com, ericsson.net, ericsson.se)
- GDPR compliance and consent tracking
- Cross-browser cookie persistence

### Next Steps
1. Review the comprehensive checklist
2. Start verification on INTG environment
3. Update ticket with testing progress
```

---

### Running QA Prep Again (Smart Caching)

```
User: /qa-prep 13861

Claude: Executing QA prep workflow for ticket 13861...

Step 1/4: Checking for existing results...
✅ Found existing summary-ticket and analyze-pr results
ℹ️ Reusing cached results (saved ~30K tokens)

Step 4/4: Generating fresh checklist...
✅ Created comprehensive verification checklist

## ✅ QA Prep Complete for Ticket #13861
[Same output as above, but steps 2-3 were skipped]
```

---

## 🎉 First Verification Steps

After setup is complete, verify everything works:

### 1. Test MCP Server Connection

Open Claude Code and try:
```
List all tickets in current sprint
```

**Expected**: You should see a list of tickets from your current sprint.

### 2. Test a Specific MCP Tool

```
Get details for work item 14310
```

**Expected**: Ticket details (title, description, state, assigned to, etc.)

### 3. Test a Skill

```
/summary-ticket 14310
```

**Expected**: 
- Ticket summary generated
- File saved to `skill-result/summary-ticket/summary-ticket-14310.md`
- "What to Test" section displayed

### 4. Test Full QA Workflow

```
/qa-prep 14310
```

**Expected**:
- Three files generated in `skill-result/` folders
- Summary presented with key testing focus areas
- No errors in execution

✅ **If all tests pass, you're ready to go!**

---

## ❓ Frequently Asked Questions

### Q: Do I need to rebuild after every code change?
**A**: Yes. Run `npm run build` after modifying TypeScript files in `src/`. The MCP server runs from `dist/`, not `src/`.

### Q: Can I use skills without the MCP server?
**A**: Partially. Skills like `create-checklist` use MCP tools to fetch ticket data. Without MCP, you'd need to provide data manually.

### Q: Where are skill results stored?
**A**: In `skill-result/` folder, organized by skill type. Files persist across sessions for caching.

### Q: How do I force a fresh analysis?
**A**: Delete the specific file in `skill-result/` folder (e.g., delete `analyze-pr-14310.md` to re-analyze ticket 14310).

### Q: Can I customize the checklists?
**A**: Yes. Edit `.claude/skills/create-checklist/sample-checklist.md` template or modify the skill logic in `SKILL.md`.

### Q: What if my ticket has no PRs yet?
**A**: Skills will still work. `analyze-pr` reports "No PRs found", and `create-checklist` generates a checklist based only on Acceptance Criteria.

### Q: How often should I refresh the cache?
**A**: Weekly or when sprint changes. Run `npm run refresh` to update `cache/work-items.json`.

### Q: Can I use this for multiple Azure DevOps projects?
**A**: Yes, but you need separate MCP server configurations (different names) for each project in Claude settings, each pointing to a different `.env` file.

### Q: Do skills work offline?
**A**: No. Skills require Azure DevOps API access to fetch ticket/PR data. MCP tools also require active connection.

### Q: What's the difference between skills and MCP tools?
**A**: 
- **MCP Tools**: Low-level API wrappers (fetch ticket, get PR files, etc.)
- **Skills**: High-level autonomous workflows that use MCP tools + file operations + analysis logic

---

## 🤝 Contributing

Found a bug or have a feature request? Contributions welcome!

1. Create an issue describing the problem/enhancement
2. Fork the repository
3. Make your changes
4. Submit a pull request

---

## 📞 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check `MCP_SETUP.md`, `SKILLS.md`, or skill-specific SKILL.md files
- **Azure DevOps**: Ensure your PAT has correct permissions and hasn't expired

---

**Ready to start?** Run `npm install`, `npm run build`, configure `.env`, add MCP config, and restart Claude Code! 🚀
