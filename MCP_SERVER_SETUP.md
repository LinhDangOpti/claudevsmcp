# MCP Server Setup Guide

## ✅ Setup Complete

MCP server đã được configure cho project này.

## Files Created/Modified

1. **`.mcp.json`** - Project-level MCP server config
   - Server: `azure-devops`
   - Command: `node dist/index.js`
   - Env vars: Azure DevOps credentials

2. **`.claude/settings.json`** - Tool permissions
   - Auto-allow MCP tools: `get_work_item_pull_requests`, `get_pull_request_details`, `get_pull_request_files`

## Next Steps

### 1. Restart Claude Code
MCP server chỉ load khi Claude Code khởi động.

**Cách restart:**
- Close và mở lại VS Code window
- Hoặc reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"

### 2. Verify MCP Server Connected

Sau khi restart, gõ:
```
/mcp
```

Bạn sẽ thấy:
```
✅ azure-devops - Connected
   - get_work_item_pull_requests
   - get_pull_request_details
   - get_pull_request_files
   - get_work_item
   - ... (other tools)
```

### 3. Test the Skill

```
/analyze-pr 14205
```

Skill sẽ:
1. Call MCP tool `azure-devops_get_work_item_pull_requests` (no permission prompt)
2. Call MCP tools để get PR details và files
3. Analyze impact dựa trên knowledge files
4. Generate report vào `skill-result/analyze-pr/`

## Troubleshooting

### MCP server không connect
```bash
# Check if dist/index.js exists
ls dist/index.js

# Rebuild if needed
npm run build
```

### Permission prompts vẫn xuất hiện
- Check `.claude/settings.json` có đúng tool names
- Tool names phải match exactly với MCP server export

### Muốn xem MCP server logs
```bash
# MCP server logs to stderr
# Check Claude Code developer console
```

## Alternative: Bash Script Mode

Nếu không muốn dùng MCP server, có thể revert về bash script mode:
1. Edit `.claude/skills/analyze-pr/SKILL.md`
2. Change dependencies từ MCP tools → bash scripts
3. Follow pattern của `summary-ticket` skill
