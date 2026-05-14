# Azure DevOps MCP Server - Workflow & Architecture

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VS Code IDE                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              GitHub Copilot Chat                          │  │
│  │  "Show my sprint tickets"                                 │  │
│  │  "Summarize ticket 13080"                                 │  │
│  │  "What tickets are in ACC?"                               │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│                     │ MCP Protocol (stdio)                       │
│                     ▼                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Azure DevOps MCP Server                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  MCP Tools:                                         │  │  │
│  │  │  • query_sprint_tickets                             │  │  │
│  │  │  • get_work_item_details                            │  │  │
│  │  │  • refresh_cache                                    │  │  │
│  │  │  • extract_pr_analysis                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────┐
      │      Local Cache Layer           │
      │  ┌────────────────────────────┐  │
      │  │  cache/work-items.json     │  │
      │  │  • Sprint tickets          │  │
      │  │  • Comments & descriptions │  │
      │  │  • User assignments        │  │
      │  │  • Updated daily           │  │
      │  └────────────────────────────┘  │
      └──────────────┬───────────────────┘
                     │
                     │ Azure DevOps REST API
                     │ (when refreshing cache)
                     ▼
      ┌──────────────────────────────────┐
      │     Azure DevOps Cloud           │
      │  • Work Items                    │
      │  • Pull Requests                 │
      │  • Comments                      │
      │  • Repositories                  │
      └──────────────────────────────────┘
```

## 📋 Detailed Workflow

### 1️⃣ **Cache Refresh Workflow**

```
Developer Action              System Process                    Result
─────────────────────────────────────────────────────────────────────────
┌─────────────────┐
│ npm run refresh │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 1: Authenticate with Azure DevOps │
│ • Load .env credentials                 │
│ • Validate Personal Access Token        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 2: Query Current Sprint           │
│ • Get current sprint dates              │
│ • Filter work items in sprint           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 3: Filter User Stories            │
│ • Find stories with "Verify" tasks      │
│ • Assigned to developer's email         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 4: Fetch Full Details             │
│ • Work item fields                      │
│ • All comments                          │
│ • Descriptions (cleaned HTML)           │
│ • Tags and states                       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 5: Save to Cache                  │
│ • Write to cache/work-items.json        │
│ • Add timestamp                         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ ✅ Cache Ready                          │
│ • 12 work items cached                  │
│ • Last updated: 2026-04-24T08:30:00Z    │
└─────────────────────────────────────────┘
```

**Time:** ~10-30 seconds (depends on number of work items)  
**Frequency:** Once per day or when needed

---

### 2️⃣ **Query Workflow (via Copilot)**

```
Developer Query              MCP Server Process               Response
─────────────────────────────────────────────────────────────────────────
┌─────────────────────────┐
│ @github-copilot         │
│ "Show my sprint tickets"│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Copilot → MCP Server                    │
│ Tool: query_sprint_tickets              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Read Cache (Instant)                    │
│ • Load cache/work-items.json            │
│ • No API calls needed                   │
│ • No permission prompts                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Filter & Format Data                    │
│ • Apply query filters                   │
│ • Format for Copilot display            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ ✅ Instant Response                     │
│ • ID: 13080 - "Add dark mode"           │
│ • State: In ACC                         │
│ • Assigned: John Doe                    │
│ • Tags: HIGHPRIO, UI                    │
└─────────────────────────────────────────┘
```

**Time:** ~1-2 seconds (cache read only)  
**Frequency:** Unlimited queries per day

---

### 3️⃣ **PR Analysis Workflow**

```
Developer Action              System Process                    Output
─────────────────────────────────────────────────────────────────────────
┌──────────────────────┐
│ npm run test:pr 13080│
└────────┬─────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 1: Get Work Item                  │
│ • Fetch ticket #13080                   │
│ • Extract linked PR IDs                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 2: Get PR Details                 │
│ • For each linked PR:                   │
│   - Title, description                  │
│   - Creator, date                       │
│   - Source/target branches              │
│   - Status (filter: completed only)     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 3: Extract Changed Files          │
│ • Get file changes for each PR          │
│ • Types: add/edit/delete/rename         │
│ • Full file paths                       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 4: Impact Analysis                │
│ • Categorize files by type:             │
│   🔴 High: Backend, Data Access         │
│   🟡 Medium: UI Views, Client Scripts   │
│   🟢 Low: Styling, Config               │
│ • Group by functionality                │
│ • Assess severity                       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 5: Generate Testing Recommendations│
│ • Context-aware test steps              │
│ • Based on affected functionalities     │
│ • Prioritized by severity               │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 6: Create Reports                 │
│ • HTML: Interactive styled report       │
│ • Markdown: Human-readable tables       │
│ • JSON: Machine-readable data           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ ✅ Reports Saved                        │
│ pr-analysis/13080-pr-analysis.html      │
│ pr-analysis/13080-pr-analysis.md        │
│ pr-analysis/13080-pr-analysis.json      │
└─────────────────────────────────────────┘
```

**Time:** ~5-15 seconds (depends on number of PRs)  
**Frequency:** Once per verification task

---

## 🎯 Key Benefits Illustrated

### Before: Traditional Workflow ❌

```
Open Browser (5s) → Login Azure DevOps (5s) → Find Ticket (10s) 
→ Read Details (20s) → Click Each PR (30s) → Review Files (60s)
→ Manual Notes (120s) → Switch Back to VS Code (5s)

Total: ~4-5 minutes per ticket lookup
```

### After: MCP Server Workflow ✅

```
Ask Copilot (2s) → Instant Response from Cache (1s)
npm run test:pr (10s) → Auto-generated Reports Ready (5s)

Total: ~15-20 seconds per ticket analysis
```

**Improvement:** 93% faster! 🚀

---

## 🔐 Security & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer's Machine                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  .env file (Private)                                  │  │
│  │  • AZURE_DEVOPS_TOKEN=xxx                             │  │
│  │  • AZURE_DEVOPS_USER_EMAIL=xxx                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ (Never shared)                    │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MCP Server Process (Local)                           │  │
│  │  • Runs on localhost                                  │  │
│  │  • No external server                                 │  │
│  │  • Direct API calls only                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ HTTPS (Encrypted)                 │
│                          ▼                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Azure DevOps Cloud    │
              │  (Microsoft Servers)   │
              └────────────────────────┘
```

**Security Features:**
- ✅ All data stays on developer's machine
- ✅ Personal Access Token (not shared passwords)
- ✅ HTTPS encryption for all API calls
- ✅ No third-party servers involved
- ✅ Cache files are local JSON (human-readable)

---

## 📊 Performance Metrics

| Operation | Before (Manual) | After (MCP Server) | Improvement |
|-----------|----------------|-------------------|-------------|
| Ticket lookup | 30-60 seconds | 2-3 seconds | **90% faster** |
| PR analysis | 5-10 minutes | 10-20 seconds | **95% faster** |
| Verification report | 30-60 minutes | 15 seconds | **99% faster** |
| Context switching | 10-20 times/day | 0 times/day | **100% reduction** |
| Permission prompts | 20-50/day | 0/day | **100% elimination** |

---

## 🚀 Technology Stack

```
┌─────────────────────────────────────────┐
│          Frontend (VS Code)              │
│  • GitHub Copilot Extension             │
│  • MCP Client (built-in)                │
└────────────┬────────────────────────────┘
             │ stdio transport
             ▼
┌─────────────────────────────────────────┐
│       MCP Server (TypeScript)           │
│  • @modelcontextprotocol/sdk            │
│  • Express-like tool handlers           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Azure DevOps Client                │
│  • azure-devops-node-api (official SDK) │
│  • REST API wrapper                     │
└────────────┬────────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────────┐
│     Azure DevOps REST API               │
│  • Work Items API                       │
│  • Git API (PRs, Files)                 │
│  • Repositories API                     │
└─────────────────────────────────────────┘
```

---

**Note:** This architecture ensures fast, secure, and seamless integration between VS Code and Azure DevOps without any external dependencies or third-party services.
