# Azure DevOps MCP Server

A **Model Context Protocol (MCP)** server that integrates Azure DevOps with GitHub Copilot Chat, allowing you to query work items naturally through conversation 

## 🚀 What is MCP?

**Model Context Protocol (MCP)** is an open standard that connects AI assistants like GitHub Copilot to external data sources. This tool implements an MCP server that:

- 🔌 **Connects GitHub Copilot** to your Azure DevOps project
- 💬 **Enables natural language queries** - just ask Copilot about your tickets
- ⚡ **Provides instant responses** from cached data
- 🔒 **Keeps your data local** - no third-party services involved

Instead of switching between VS Code and Azure DevOps web portal, you can ask Copilot directly:
- "Show my sprint tickets"
- "Summarize ticket 13080"
- "What tickets are in ACC?"

## 🧠 AI Skills & Knowledge

This project includes **domain-specific skills** that guide AI interactions:

📚 **See [`.skills/AGENTS.md`](.skills/AGENTS.md)** for complete skill documentation.

**Available skills:**
- **Azure DevOps Query** - Guides for querying work items, PRs, and using MCP tools
- **Testing Checklist** - Generates QA-focused checklists from tickets (testing perspective only)

Skills are automatically activated when you ask relevant questions in GitHub Copilot Chat.

## 🎯 What This Does

This tool helps you:
- **Instantly view** all User Stories where you have verification tasks assigned
- **Query cached data** without API rate limits or permission prompts
- **Summarize tickets** with full details including comments and descriptions
- **Track your sprint work** efficiently
- **Stay in your IDE** - no context switching needed

## ✨ Key Features

- 🔌 **MCP Protocol Implementation** - Native integration with GitHub Copilot via Model Context Protocol
- 🚀 **Cache-based queries** - Instant responses from local cache
- 🔍 **Smart filtering** - Automatically finds User Stories with your query
- 💬 **Full ticket details** - Descriptions, comments, state, assignees, tags
- 📊 **Sprint tracking** - Focused on current sprint items only
- 🤖 **Natural language interface** - Ask Copilot in plain English, no special syntax needed

## 🛠️ Setup

### 1. Prerequisites
- Node.js installed
- Azure DevOps personal access token

### 2. Configuration

Create a `.env` file with your credentials:

```env
AZURE_DEVOPS_ORG_URL=https://your-org.visualstudio.com
AZURE_DEVOPS_TOKEN=your-personal-access-token
AZURE_DEVOPS_PROJECT=your-project-name
AZURE_DEVOPS_USER_EMAIL=your.email@company.com
```

### 3. Install Dependencies

```bash
npm install
npm run build
```

## 📖 How to Use

### Step 1: Refresh Cache (Once per day or when needed)

```bash
npm run refresh
```

This fetches all User Stories from the current sprint where you have a "Verify" task assigned. Takes ~10-30 seconds depending on the number of stories.

**Output example:**
```
Found 12 user stories with your verify tasks
✓ Cache updated successfully!
  Work items: 12
  Last updated: 2025-11-17T07:33:36.435Z
```

### Step 2: Query Your Tickets (Instant, no prompts!)

After caching, you can query instantly using GitHub Copilot Chat in VS Code:

**In Copilot Chat, ask:**
- `show all my sprint user stories`
- `summarize ticket 13080`
- `show all tickets in status "In ACC"`
- `show tickets with tag "HIGHPRIO"`

**Or use the CLI:**

```bash
# List all your verify stories
npm run cli my-verify

# Get details of a specific ticket
npm run cli item 13080

# Query cached data
npm run query tickets in ACC
```

## 📦 Available Commands

### Build & Development

```bash
# Compile TypeScript code
npm run build

# Start the MCP server
npm start
```

### Code Quality

```bash
# Check code with ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting (without changes)
npm run format:check
```

### Operations

```bash
# Refresh cache from Azure DevOps
npm run refresh

# Query cached work items
npm run query [query]

# Run CLI commands
npm run cli <command> [args]
```

### CLI Commands

The CLI provides direct access to Azure DevOps data:

```bash
# Show work items assigned to you in current sprint
npm run cli my-sprint <email>

# Show user stories with your verify tasks
npm run cli my-verify

# Get detailed information about a specific work item
npm run cli item <id>

# Show current sprint information
npm run cli sprint-info

# List all user stories in current sprint
npm run cli list
```

**Examples:**

```bash
# Get details for ticket 13080
npm run cli item 13080

# List all your user stories
npm run cli my-verify

# Query tickets in a specific state
npm run query tickets in ACC

# Query tickets without commits
npm run query tickets without commits
```

## 🔍 PR Analysis & Verification Checklist (Phase 1)

### Overview

Phase 1 implements **Pull Request Data Extraction** - automatically analyzing code changes from PRs linked to work items to help with verification.

### What Phase 1 Does

When a work item has linked Pull Requests, you can now:
- **Extract PR details** - Title, description, status, branches, author, dates (**Completed PRs only**)
- **Get changed files list** - See which files were added/modified/deleted/renamed
- **Analyze file scope** - Understand what parts of the codebase were touched
- **Generate reports** - Get Markdown and JSON reports with all PR data
- **Prepare for verification** - Know exactly which files changed before reviewing

**Note:** Phase 1 extracts **file paths and change types** but not actual code diffs (Azure DevOps API limitation for merged PRs).

### Testing PR Extraction

Use the test script to extract PR data from a work item:

```bash
# Test PR extraction from a work item that has linked PRs
npm run test:pr <work-item-id>

# Example
npm run test:pr 13071
```

**What the test does:**
1. ✅ Fetches repositories in your project (currently hardcoded to **dotcom-net5**)
2. ✅ Extracts linked PRs from the work item (**Completed PRs only**)
3. ✅ Gets PR details (title, status, branches, creator)
4. ✅ Lists all changed files with change types (add/edit/delete/rename)
5. ✅ Provides summary statistics
6. ✅ **Generates analysis reports** in `pr-analysis/` folder:
   - **JSON report** - Machine-readable data for programmatic access
   - **Markdown report** - Human-readable tables for easy visualization
   - **HTML report** - Interactive styled report with color-coded impact analysis

**Example output:**
```
🔍 Step 2: Testing PR extraction from work item...
Extracting PRs from work item #13724...
✅ Found 22 completed pull request(s):

------------------------------------------------------------
PR #7294: apply mwc style for start page
Repository: dotcom-net5
Status: 3
Source: refs/heads/features/Vuong/159/13724-content-area-space-start-page → Target: refs/heads/SPRINTS/SPRINT-159
Created by: Vuong Nguyen (EXT) on 3/3/2026

📄 Fetching changed files...
✓ Found 2 changed files in PR #7294
✓ Found 2 changed file(s):
  ✏️ [edit] /src/Ericsson.Website/Static/sass/dotcomstyles/_contentarea.scss
  ✏️ [edit] /src/Ericsson.Website/Views/StartPage.cshtml

Change Summary:
  ✏️  Modified: 2 files

📝 Saving analysis results...
✓ JSON report saved: pr-analysis\13724-pr-analysis.json
✓ Markdown report saved: pr-analysis\13724-pr-analysis.md
✓ HTML report saved: pr-analysis\13724-pr-analysis.html

✅ Reports generated successfully!
```

**Generated reports include:**
- **Summary table** - All PRs with title, creator, date, and file count
- **Detail sections** - Each PR with complete changed files list
- **JSON data** - Complete PR data structure for automation
- **HTML report** - Interactive browser-viewable report with:
  - Color-coded severity badges (🔴 High, 🟡 Medium, 🟢 Low)
  - Stats dashboard showing impact distribution
  - Styled tables for file changes and functionality impacts
  - **Clickable PR links** - Direct links to Azure DevOps pull requests
  - Testing recommendations for each impact area
  - Professional responsive design with hover effects

### Phase 1 API Methods

New methods added to `AzureDevOpsClient`:

```typescript
// Get all repositories
await client.getRepositories()

// Get PR details
await client.getPullRequestDetails(repositoryId, pullRequestId)

// Get changed files in a PR
await client.getPullRequestChangedFiles(repositoryId, pullRequestId)

// Get detailed file diffs
await client.getPullRequestFileDiffs(repositoryId, pullRequestId)

// Extract all PRs from a work item
await client.extractPRsFromWorkItem(workItemId)
```

**PR Status Filtering:**
- `extractPRsFromWorkItem()` automatically filters to return **only completed (merged) PRs**
- This ensures you're analyzing finalized code that actually made it to the target branch
- Active or abandoned PRs are excluded from the results

### Known Limitations

**Only Completed PRs:**
- Phase 1 extracts **only completed (merged) Pull Requests**
- Active or abandoned PRs are automatically filtered out
- This ensures you're analyzing finalized code changes

**File Changes vs Full Code Diffs:**
- ✅ **File paths and change types** (add/edit/delete/rename) are always available
- ✅ **Changed file lists** work reliably via PR iteration changes API
- ❌ **Full code diffs/content** are NOT available for completed PRs
- This is an **Azure DevOps API limitation** - the API does not preserve full file content or diffs after PRs are merged
- Reports show which files changed, but not the actual code changes
- For actual code review, use Azure DevOps UI or Git history

**What You Get:**
- Work item → PR mappings
- PR metadata (title, description, author, dates, branches)
- Complete list of changed files with change types
- File counts and statistics
- Markdown and JSON reports for analysis

## 🎯 Functionality Impact Analysis (Phase 2)

### Overview

Phase 2 implements **Smart Impact Analysis** - automatically categorizing changed files and identifying affected functionalities to guide your testing efforts.

### What Phase 2 Does

The tool now analyzes all changed files across PRs to:
- **Categorize by type** - UI Views, Styling, Business Logic, Data Access, Client Scripts
- **Group by functionality** - Automatically group related files by feature/module
- **Assess severity** - Identifies high/medium/low impact areas
- **Generate testing recommendations** - Provides specific test steps for each affected area
- **Prioritize testing** - Shows high-priority areas first

### Impact Analysis Features

**Automatic File Categorization:**
- 🔴 **High Priority**: Business Logic, Data Access, Backend Code
- 🟡 **Medium Priority**: UI Views, Client Scripts
- 🟢 **Low Priority**: UI Styling, Configuration

**Smart Feature Detection:**
- Identifies pages (Start Page, Speaker Page, Session Page, etc.)
- Detects components (authentication, data access, UI elements)
- Groups related files by functionality
- Provides context-aware testing recommendations

### Example Impact Report

```
## 🎯 Functionality Impact Analysis

### 🟡 Speaker Page (UI Views) - MEDIUM
**Impact:** Page layout, structure, and user interface elements
**Affected Files (1):**
- /src/Ericsson.Website/Views/Pages/SpeakerPage.cshtml

**Testing Recommendations:**
- Test page navigation and routing
- Verify data display and formatting
- Check user interactions and form submissions
- Test speaker profile display and filtering

### 🟢 sessions speaker item (UI Styling) - LOW
**Impact:** Visual appearance and styling of UI components
**Affected Files (1):**
- /src/Ericsson.Website/Static/sass/dotcomstyles/_sessions-speaker-item.scss

**Testing Recommendations:**
- Verify visual appearance in different browsers
- Check responsive design on mobile/tablet/desktop
- Validate dark/light theme compatibility
```

### Use Cases

**Before Verification:**
```bash
# Extract PRs and analyze impact for user story #13724
npm run test:pr 13724

# Output:
# ✅ Found 22 completed PRs
# 🎯 Identified 8 functionality impacts:
#   🟡 Speaker Page (UI Views) - 1 file(s)
#   🟡 Start Page (UI Views) - 1 file(s)
#   🟢 sessions speaker item (UI Styling) - 1 file(s)
#   🟢 content area (UI Styling) - 1 file(s)

# Reports saved to pr-analysis/13724-pr-analysis.md
```

**During Test Planning:**
- Open the generated Markdown report in `pr-analysis/` folder
- Review **Functionality Impact Analysis** section
- Follow **Testing Recommendations** for each affected area
- Prioritize high and medium severity impacts first
- Use file lists to know exactly what to test

**During Code Review:**
- Quickly see file scope and categories before opening PRs
- Understand impact areas (UI Views, Styling, Backend, Database)
- Prepare targeted verification steps based on severity
- Share impact report with team for review planning

**For Test Automation:**
- Use JSON report (`pr-analysis/{id}-pr-analysis.json`) for programmatic access
- Parse functionality impacts to trigger relevant test suites
- Integrate with CI/CD for automated test selection

## 🎨 MCP Server Integration with GitHub Copilot

### What Makes This Special?

This tool implements the **Model Context Protocol (MCP)**, which means:

1. **🔌 Direct Integration** - Copilot can access your Azure DevOps data as if it's a native feature
2. **💬 Natural Conversation** - No special commands or syntax needed
3. **⚡ Real-time Context** - Copilot knows about your tickets while you code
4. **🔒 Secure & Local** - Your data stays on your machine, accessed via your personal token

### How It Works

```
┌─────────────────┐
│  GitHub Copilot │  "Show my sprint tickets"
│   in VS Code    │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│   MCP Server    │  Queries local cache
│   (This Tool)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cached Data    │  Your sprint tickets
│  work-items.json│  (refreshed from Azure DevOps)
└─────────────────┘
```
```

### MCP Configuration

The MCP server is configured in `.vscode/settings.json`:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": "azure-devops-mcp-server"
    }
  ],
  "mcp.servers": {
    "azure-devops": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${workspaceFolder}/azure-devops-mcp-server"
    }
  }
}
```

This tells VS Code to run the MCP server when Copilot needs Azure DevOps data.

## 📁 Project Structure

```
azure-devops-mcp-server/
├── src/
│   ├── utils/                    # Shared utility modules
│   │   ├── cache-manager.ts     # Cache operations
│   │   ├── config.ts            # Configuration management
│   │   ├── html-cleaner.ts      # HTML cleaning utilities
│   │   ├── logger.ts            # Logging system
│   │   └── index.ts             # Utilities export
│   ├── scripts/                  # CLI and utility scripts
│   │   ├── cli.ts               # Command-line interface
│   │   ├── refresh-cache.ts     # Cache refresh script
│   │   └── query-cache.ts       # Cache query script
│   ├── azure-devops-client.ts    # Azure DevOps API client
│   └── index.ts                  # MCP server implementation
├── dist/                         # Compiled JavaScript output
├── cache/
│   └── work-items.json          # Cached sprint data
├── .env                          # Your credentials (gitignored)
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project configuration
```

## 🔄 Typical Workflow

1. **Morning:** Run `npm run refresh` to get today's sprint data
2. **During work:** Ask Copilot about tickets - instant responses from cache
3. **Need updates?** Run `npm run refresh` again

## 🎯 Why This Matters

**Before this tool:**
- Every query required clicking "Allow" button
- Interrupts your flow
- Slow responses

**With this tool:**
- Cache once, query unlimited times
- No permission prompts
- Instant responses in Copilot Chat

## 🚀 Quick Start for Team Members

1. **Clone/copy this folder** to your machine
2. **Create `.env` file** with your Azure DevOps credentials
3. **Install dependencies:** `npm install && npm run build`
4. **Refresh cache:** `npm run refresh`
5. **Configure VS Code** to enable MCP server (see MCP Configuration above)
6. **Start chatting with Copilot** about your tickets!

> 💡 **Pro Tip:** Once the MCP server is running, Copilot becomes your Azure DevOps assistant. Just ask questions naturally!

## 💡 Tips

- Refresh cache at the start of your workday
- Cache includes all comments and descriptions
- Works offline once cached
- Cache file is human-readable JSON (check `cache/work-items.json`)

## 🔧 Troubleshooting

**"Error: azureClient.getUserStoriesWithMyVerifyTasks is not a function"**
- Run `npm run build` to recompile TypeScript

**"Found 0 user stories"**
- Check your email in `.env` matches Azure DevOps
- Verify you have "Verify" tasks assigned in current sprint

**Cache is outdated**
- Run `npm run refresh` to update

**Build errors or TypeScript issues**
- Clean rebuild: `rm -rf dist/ && npm run build`
- Check for lint errors: `npm run lint`
- Format code: `npm run format`

## 📚 Additional Documentation

For more detailed information, see:

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Project structure, coding standards, and technical decisions
- **[MIGRATION.md](MIGRATION.md)** - Migration guide from old to new structure
- **[REFACTORING-SUMMARY.md](REFACTORING-SUMMARY.md)** - Complete refactoring summary

## 🧪 Development

This project uses:
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting

Before committing changes:
```bash
npm run lint        # Check for issues
npm run format      # Format code
npm run build       # Verify compilation
```

## 📝 License

ISC
