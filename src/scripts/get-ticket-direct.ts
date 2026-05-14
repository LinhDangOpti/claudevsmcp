#!/usr/bin/env node
/**
 * Get ticket details directly from Azure DevOps API (no cache)
 */

import { AzureDevOpsClient, LogLevel } from '../azure-devops-client.js';
import { loadConfig } from '../utils/config.js';

async function getTicketDirect(ticketId: number) {
  try {
    const config = loadConfig();
    const client = new AzureDevOpsClient(
      config.orgUrl,
      config.token,
      config.project,
      config.team,
      LogLevel.ERROR
    );

    // Get work item details
    const workItem = await client.getWorkItem(ticketId);

    if (!workItem.fields) {
      throw new Error(`Work item ${ticketId} has no fields`);
    }

    const fields = workItem.fields;

    // Get comments
    const commentsData = await client.getWorkItemComments(ticketId);

    // Get development links
    const devLinks = await client.getWorkItemDevelopmentLinks(ticketId);

    // Format output as JSON
    const result = {
      id: workItem.id,
      title: fields['System.Title'],
      type: fields['System.WorkItemType'],
      description: fields['System.Description'] || '',
      reproSteps: fields['Microsoft.VSTS.TCM.ReproSteps'] || null,
      state: fields['System.State'],
      assignedTo: fields['System.AssignedTo']?.displayName || 'Unassigned',
      createdDate: fields['System.CreatedDate'],
      changedDate: fields['System.ChangedDate'],
      tags: fields['System.Tags'] || '',
      iteration: fields['System.IterationPath'],
      comments: commentsData?.comments?.map((c: any) => ({
        author: c.createdBy?.displayName || 'Unknown',
        date: c.createdDate || '',
        text: c.text || ''
      })) || [],
      development: {
        hasPullRequests: devLinks.hasPullRequests || false,
        hasCommits: devLinks.hasCommits || false,
        pullRequests: devLinks.pullRequests || [],
        commits: devLinks.commits || []
      }
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      error: true,
      message: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}

const ticketId = parseInt(process.argv[2]);
if (!ticketId || isNaN(ticketId)) {
  console.error(JSON.stringify({
    error: true,
    message: 'Usage: node get-ticket-direct.js <ticket-id>'
  }));
  process.exit(1);
}

getTicketDirect(ticketId);
