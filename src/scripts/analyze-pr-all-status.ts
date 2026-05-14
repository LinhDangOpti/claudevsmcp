#!/usr/bin/env node
/**
 * Analyze PR Files Script (All Statuses)
 * Fetches all PR file changes for a given work item, regardless of PR status
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

  // Get work item development links
  const devLinks = await client.getWorkItemDevelopmentLinks(workItemId);

  if (!devLinks.hasPullRequests) {
    console.error('No PRs found for this work item');
    const workItem = await client.getWorkItem(workItemId);
    const title = workItem?.fields?.['System.Title'] as string || 'Unknown';

    return {
      workItemId,
      title,
      pullRequests: [],
      summary: {
        totalPRs: 0,
        totalFiles: 0,
        filesByCategory: {
          'UI Views (.cshtml)': 0,
          'Styling (.scss/.css)': 0,
          'Backend (.cs)': 0,
          'Client Scripts (.js/.ts)': 0,
          'Configuration': 0,
          'Other': 0
        }
      }
    };
  }

  console.error(`Found ${devLinks.pullRequests.length} PR link(s)`);

  const prDetails: PRDetails[] = [];

  // Parse PR URLs manually
  for (const pr of devLinks.pullRequests) {
    const match = pr.url.match(/\/PullRequestId\/(.+)$/);
    if (!match) continue;

    const encodedPath = match[1];
    const decodedPath = decodeURIComponent(encodedPath);
    const parts = decodedPath.split('/');

    if (parts.length === 3) {
      const [, repoId, prId] = parts;

      // Get PR details WITHOUT filtering by status
      const gitApi = await (client as any).connection.getGitApi();
      const prData = await gitApi.getPullRequest(repoId, parseInt(prId), config.project);

      if (prData) {
        const details: PRDetails = {
          pullRequestId: prData.pullRequestId!,
          repository: prData.repository?.name || repoId,
          repositoryId: prData.repository?.id || repoId,
          title: prData.title || '',
          description: prData.description || '',
          sourceRefName: prData.sourceRefName || '',
          targetRefName: prData.targetRefName || '',
          status: String(prData.status || ''),
          createdBy: prData.createdBy?.displayName || '',
          creationDate: prData.creationDate || new Date(),
          closedDate: prData.closedDate,
          url: prData.url || ''
        };
        prDetails.push(details);
        console.error(`✓ Found PR #${prData.pullRequestId}: ${details.title} (Status: ${details.status})`);
      }
    }
  }

  // Get files for each PR
  const prWithFiles: Array<{ pr: PRDetails; files: FileChange[] }> = [];
  const allFiles: FileChange[] = [];

  for (const pr of prDetails) {
    console.error(`Fetching files for PR #${pr.pullRequestId}...`);
    const files = await client.getPullRequestChangedFiles(pr.repositoryId, pr.pullRequestId);
    prWithFiles.push({ pr, files });
    allFiles.push(...files);
    console.error(`  Found ${files.length} changed files`);
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
      totalPRs: prDetails.length,
      totalFiles: allFiles.length,
      filesByCategory
    }
  };
}

// Main execution
const workItemId = parseInt(process.argv[2]);
if (!workItemId) {
  console.error('Usage: node analyze-pr-all-status.js <work-item-id>');
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
