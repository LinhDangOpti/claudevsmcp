# Analyze PR - Guideline

## Token Optimization Strategy

**CRITICAL:** Knowledge files are 1,000-2,000 lines each. Reading 4 files = 100K tokens wasted!

### ✅ **Correct Approach (Grep-based):**
```bash
# Step 1: Extract class name from file path
/src/Ericsson.Core/Models/Blocks/StoryBlock.cs → "StoryBlock"

# Step 2: Grep in corresponding knowledge file
Grep(pattern="StoryBlock", 
     glob="**/Ericsson.Core-knowledge.md",
     output_mode="content",
     -A=15,  # 15 lines after match
     -B=5)   # 5 lines before match

# Result: ~20-30 lines of context (vs 2,040 lines if Read)
```

### ❌ **Wrong Approach (Read entire file):**
```bash
# DON'T DO THIS:
Read("ericsson-code-base/dotcom-net5/project-knowledge/Ericsson.Core-knowledge.md")
# Result: 2,040 lines loaded = ~8,000 tokens wasted
```

### **Token Budget:**
- Target: < 30,000 tokens per analysis
- Grep 10 classes: ~300 lines = ~1,200 tokens ✅
- Read 4 knowledge files: ~6,400 lines = ~25,000 tokens ❌

### **When to Read vs Grep:**
- **Grep:** For specific class/service lookup (99% of cases)
- **Read with offset/limit:** If grep insufficient (e.g., need architecture overview)
- **Read full file:** NEVER (unless skill explicitly requires it)

---

## Hidden Change Detection

Look for these patterns in PR diffs that indicate changes beyond the AC:
- Refactored shared utilities (broad impact across features)
- Renamed event names or tracking constants
- Removed parameters from function calls (data moved elsewhere)
- New function calls or analytics events added
- Store behavior modifications (e.g., merge vs replace logic)
- Import path changes affecting multiple consumers
- Default value changes in configurations

## What Constitutes "Beyond AC"

A change is "beyond AC" if:
- The ticket AC does not mention it
- It modifies behavior in a different feature area
- It refactors code that other features depend on
- It adds/removes/renames things not described in the ticket
- It changes test infrastructure or shared utilities

---

## Error Handling

| Error | Action |
|-------|--------|
| No PRs found (JIRA + git) | Return empty output with warning |
| GitHub MCP unavailable | Fall back to git log only, warn PR details limited |
| GitHub API rate limited | Wait 60 seconds, retry once |
| PR diffs too large | Summarize by file names and counts, note limitation |
| Atlassian dev info unavailable | Fall back to git log search |

---


