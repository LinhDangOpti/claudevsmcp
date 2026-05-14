#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { loadCache } from './utils/cache-manager.js';
import { logger } from './utils/logger.js';
import { loadConfig } from './utils/config.js';
import { AzureDevOpsClient } from './azure-devops-client.js';

// Define tools
const TOOLS: Tool[] = [
  {
    name: 'get_my_current_sprint_tickets',
    description: 'Get all work items assigned to me in the current sprint',
    inputSchema: {
      type: 'object',
      properties: {
        userEmail: {
          type: 'string',
          description: 'User email address in Azure DevOps'
        }
      },
      required: ['userEmail']
    }
  },
  {
    name: 'get_tickets_by_state',
    description: 'Get all tickets filtered by state (e.g., "In ACC", "Active", "Closed")',
    inputSchema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          description: 'State/status of tickets (e.g., "In ACC", "Active", "Done")'
        }
      },
      required: ['state']
    }
  },
  {
    name: 'get_work_item_details',
    description: 'Get detailed information about a specific work item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Work item ID'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'get_current_sprint_info',
    description: 'Get information about the current sprint',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'list_all_current_sprint_tickets',
    description: 'List all work items in the current sprint with summary information',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'query_tickets',
    description: 'Query tickets using natural language. Supports filtering by state, development links (commits, pull requests), assignee, tags, and combinations. Examples: "tickets in ACC without commits", "testing tickets missing PRs", "active tickets assigned to John"',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query to filter tickets'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_work_item_pull_requests',
    description: 'Get all pull requests linked to a work item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        workItemId: {
          type: 'number',
          description: 'Work item ID'
        }
      },
      required: ['workItemId']
    }
  },
  {
    name: 'get_pull_request_details',
    description: 'Get detailed information about a specific pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repositoryId: {
          type: 'string',
          description: 'Repository ID (GUID)'
        },
        pullRequestId: {
          type: 'number',
          description: 'Pull request ID'
        }
      },
      required: ['repositoryId', 'pullRequestId']
    }
  },
  {
    name: 'get_pull_request_files',
    description: 'Get list of changed files in a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repositoryId: {
          type: 'string',
          description: 'Repository ID (GUID)'
        },
        pullRequestId: {
          type: 'number',
          description: 'Pull request ID'
        }
      },
      required: ['repositoryId', 'pullRequestId']
    }
  },
  {
    name: 'get_pull_request_file_diffs',
    description: 'Get detailed file diffs with additions/deletions for a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repositoryId: {
          type: 'string',
          description: 'Repository ID (GUID)'
        },
        pullRequestId: {
          type: 'number',
          description: 'Pull request ID'
        }
      },
      required: ['repositoryId', 'pullRequestId']
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'azure-devops-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler: List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handler: Call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error('Arguments are required');
    }

    switch (name) {
      case 'get_my_current_sprint_tickets': {
        const cache = loadCache();
        const userEmail = args.userEmail as string;
        const workItems = cache.workItems.filter((wi: any) => 
          wi.assignedTo && wi.assignedTo.toLowerCase().includes(userEmail.toLowerCase().split('@')[0])
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workItems.map((wi: any) => ({
                id: wi.id,
                title: wi.title,
                state: wi.state,
                assignedTo: wi.assignedTo,
                type: wi.type
              })), null, 2)
            }
          ]
        };
      }

      case 'get_tickets_by_state': {
        const cache = loadCache();
        const state = args.state as string;
        const workItems = cache.workItems.filter((wi: any) => 
          wi.state.toLowerCase() === state.toLowerCase()
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workItems.map((wi: any) => ({
                id: wi.id,
                title: wi.title,
                state: wi.state,
                assignedTo: wi.assignedTo
              })), null, 2)
            }
          ]
        };
      }

      case 'get_work_item_details': {
        const cache = loadCache();
        const id = args.id as number;
        const workItem = cache.workItems.find((wi: any) => wi.id === id);

        if (!workItem) {
          throw new Error(`Work item ${id} not found in cache. Run "npm run refresh" to update.`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: workItem.id,
                title: workItem.title,
                type: workItem.type,
                description: workItem.description,
                reproSteps: workItem.reproSteps,
                state: workItem.state,
                assignedTo: workItem.assignedTo,
                createdDate: workItem.createdDate,
                changedDate: workItem.changedDate,
                tags: workItem.tags,
                comments: workItem.comments,
                development: workItem.development
              }, null, 2)
            }
          ]
        };
      }

      case 'get_current_sprint_info': {
        const cache = loadCache();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: cache.sprint?.name || 'Sprint 154',
                path: cache.sprint?.path,
                startDate: cache.sprint?.startDate,
                finishDate: cache.sprint?.finishDate,
                lastUpdated: cache.lastUpdated,
                totalItems: cache.workItems.length
              }, null, 2)
            }
          ]
        };
      }

      case 'list_all_current_sprint_tickets': {
        const cache = loadCache();
        const summary = cache.workItems.map((wi: any, idx: number) => ({
          number: idx + 1,
          id: wi.id,
          title: wi.title,
          state: wi.state,
          assignedTo: wi.assignedTo || 'Unassigned',
          tags: wi.tags || 'none'
        }));
        
        return {
          content: [
            {
              type: 'text',
              text: `Sprint: ${cache.sprint?.name || 'Unknown'}\nLast Updated: ${cache.lastUpdated}\nTotal Work Items: ${cache.workItems.length}\n\n${JSON.stringify(summary, null, 2)}`
            }
          ]
        };
      }

      case 'query_tickets': {
        const cache = loadCache();
        const query = (args.query as string).toLowerCase();

        // Parse query for filters
        const states = ['in acc', 'uat approved', 'testing in intg', 'ready for testing', 'active', 'done', 'closed', 'new'];
        const matchedStates = states.filter(s => query.includes(s));

        const noCommits = query.includes('no commit') || query.includes('without commit') || query.includes('missing commit');
        const noPRs = query.includes('no pr') || query.includes('no pull request') || query.includes('without pr') || query.includes('missing pr');
        const hasCommits = query.includes('has commit') || query.includes('with commit');
        const hasPRs = query.includes('has pr') || query.includes('has pull request') || query.includes('with pr');

        let filtered = cache.workItems;

        // Filter by states
        if (matchedStates.length > 0) {
          filtered = filtered.filter((wi: any) =>
            matchedStates.some(s => wi.state.toLowerCase().includes(s) || s.includes(wi.state.toLowerCase()))
          );
        }

        // Filter by commits
        if (noCommits) {
          filtered = filtered.filter((wi: any) => !wi.development?.hasCommits);
        }
        if (hasCommits) {
          filtered = filtered.filter((wi: any) => wi.development?.hasCommits);
        }

        // Filter by PRs
        if (noPRs) {
          filtered = filtered.filter((wi: any) => !wi.development?.hasPullRequests);
        }
        if (hasPRs) {
          filtered = filtered.filter((wi: any) => wi.development?.hasPullRequests);
        }

        // Extract assignee if mentioned
        const assigneeMatch = query.match(/assign(?:ed)?\s+to\s+(\w+)/i);
        if (assigneeMatch) {
          const assignee = assigneeMatch[1];
          filtered = filtered.filter((wi: any) =>
            wi.assignedTo?.toLowerCase().includes(assignee.toLowerCase())
          );
        }

        const results = filtered.map((wi: any) => ({
          id: wi.id,
          title: wi.title,
          state: wi.state,
          assignedTo: wi.assignedTo || 'Unassigned',
          hasCommits: wi.development?.hasCommits || false,
          hasPRs: wi.development?.hasPullRequests || false,
          tags: wi.tags || 'none'
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Query: "${args.query}"\nMatched ${results.length} ticket(s)\n\n${JSON.stringify(results, null, 2)}`
            }
          ]
        };
      }

      case 'get_work_item_pull_requests': {
        const workItemId = args.workItemId as number;
        const config = loadConfig();
        const client = new AzureDevOpsClient(
          config.orgUrl,
          config.token,
          config.project,
          config.team
        );
        const prs = await client.extractPRsFromWorkItem(workItemId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(prs, null, 2)
            }
          ]
        };
      }

      case 'get_pull_request_details': {
        const repositoryId = args.repositoryId as string;
        const pullRequestId = args.pullRequestId as number;
        const config = loadConfig();
        const client = new AzureDevOpsClient(
          config.orgUrl,
          config.token,
          config.project,
          config.team
        );
        const details = await client.getPullRequestDetails(repositoryId, pullRequestId);

        if (!details) {
          throw new Error(`Pull request ${pullRequestId} not found in repository ${repositoryId}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(details, null, 2)
            }
          ]
        };
      }

      case 'get_pull_request_files': {
        const repositoryId = args.repositoryId as string;
        const pullRequestId = args.pullRequestId as number;
        const config = loadConfig();
        const client = new AzureDevOpsClient(
          config.orgUrl,
          config.token,
          config.project,
          config.team
        );
        const files = await client.getPullRequestChangedFiles(repositoryId, pullRequestId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(files, null, 2)
            }
          ]
        };
      }

      case 'get_pull_request_file_diffs': {
        const repositoryId = args.repositoryId as string;
        const pullRequestId = args.pullRequestId as number;
        const config = loadConfig();
        const client = new AzureDevOpsClient(
          config.orgUrl,
          config.token,
          config.project,
          config.team
        );
        const diffs = await client.getPullRequestFileDiffs(repositoryId, pullRequestId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(diffs, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Azure DevOps MCP Server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});