#!/usr/bin/env node
/**
 * Analyze PR Files Script
 * Fetches all PR file changes for a given work item
 */

import { AzureDevOpsClient, PRDetails, FileChange } from '../azure-devops-client.js';
import { loadConfig } from '../utils/config.js';

interface PRAnalysisResult {
  workItemId: number;
  title: string;
  pullRequests: Array<{
    pr: PRDetails;
    files: FileChange[];
  }>;
  summary: {
    totalPRs: number;
    totalFiles: number;
    filesByCategory: Record<string, number>;
  };
}

async function analyzePRFiles(workItemId: number): Promise<PRAnalysisResult> {
  const config = loadConfig();
  const client = new AzureDevOpsClient(
    config.orgUrl,
    config.token,
    config.project,
    config.team
  );

  console.error(`Fetching PRs for work item ${workItemId}...`);

  // Get all PRs for the work item
  const prs = await client.extractPRsFromWorkItem(workItemId);
  console.error(`Found ${prs.length} completed PRs`);

  // Get files for each PR
  const prWithFiles: Array<{ pr: PRDetails; files: FileChange[] }> = [];
  const allFiles: FileChange[] = [];

  for (const pr of prs) {
    console.error(`Fetching files for PR #${pr.pullRequestId}...`);
    const files = await client.getPullRequestChangedFiles(pr.repositoryId, pr.pullRequestId);
    prWithFiles.push({ pr, files });
    allFiles.push(...files);
  }

  // Categorize files
  const filesByCategory: Record<string, number> = {
    'UI Views (.cshtml)': 0,
    'Styling (.scss/.css)': 0,
    'Backend (.cs)': 0,
    'Client Scripts (.js/.ts)': 0,
    'Configuration': 0,
    'Other': 0
  };

  for (const file of allFiles) {
    const path = file.path.toLowerCase();
    if (path.endsWith('.cshtml')) {
      filesByCategory['UI Views (.cshtml)']++;
    } else if (path.endsWith('.scss') || path.endsWith('.css')) {
      filesByCategory['Styling (.scss/.css)']++;
    } else if (path.endsWith('.cs') && !path.includes('.csproj')) {
      filesByCategory['Backend (.cs)']++;
    } else if (path.endsWith('.js') || path.endsWith('.ts')) {
      filesByCategory['Client Scripts (.js/.ts)']++;
    } else if (path.includes('.config') || path.endsWith('.json') || path.endsWith('.xml')) {
      filesByCategory['Configuration']++;
    } else {
      filesByCategory['Other']++;
    }
  }

  // Get work item title
  const workItem = await client.getWorkItem(workItemId);
  const title = workItem?.fields?.['System.Title'] as string || 'Unknown';

  return {
    workItemId,
    title,
    pullRequests: prWithFiles,
    summary: {
      totalPRs: prs.length,
      totalFiles: allFiles.length,
      filesByCategory
    }
  };
}

// Main execution
const workItemId = parseInt(process.argv[2]);
if (!workItemId) {
  console.error('Usage: node analyze-pr-files.js <work-item-id>');
  process.exit(1);
}

analyzePRFiles(workItemId)
  .then(result => {
    // Output JSON to stdout for parsing
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
