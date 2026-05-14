#!/usr/bin/env node

/**
 * Refresh cache script - Fetches work items from Azure DevOps and caches them locally
 */

import { AzureDevOpsClient } from '../azure-devops-client.js';
import { loadConfig } from '../utils/config.js';
import { saveCache } from '../utils/cache-manager.js';
import { logger } from '../utils/logger.js';

interface WorkItemCache {
  id: number;
  title: string;
  type: string;
  state: string;
  assignedTo: string;
  description: string;
  createdDate: string;
  changedDate: string;
  tags: string;
  reproSteps?: string;
  comments: Array<{
    author: string;
    date: string;
    text: string;
  }>;
  relations: any[];
  development: {
    pullRequests: any[];
    commits: any[];
    hasPullRequests: boolean;
    hasCommits: boolean;
  };
}

async function refreshCache() {
  try {
    logger.info('Starting cache refresh...');
    
    // Load configuration
    const config = loadConfig();
    
    // Create Azure DevOps client
    const azureClient = new AzureDevOpsClient(
      config.orgUrl,
      config.token,
      config.project,
      config.team
    );
    
    logger.info('Fetching work items from Azure DevOps...');
    
    // Get all user stories in current sprint
    const allItems = await azureClient.getAllCurrentSprintUserStories();
    logger.info(`Found ${allItems.length} user stories in current sprint`);
    
    // Get detailed information for each item
    const detailedItems = await Promise.all(
      allItems.map(async (item) => {
        try {
          const workItem = await azureClient.getWorkItem(item.id!);
          const comments = await azureClient.getWorkItemComments(item.id!);
          const devLinks = await azureClient.getWorkItemDevelopmentLinks(item.id!);
          
          const cacheItem: WorkItemCache = {
            id: workItem.id!,
            title: workItem.fields?.['System.Title'] || '',
            type: workItem.fields?.['System.WorkItemType'] || '',
            state: workItem.fields?.['System.State'] || '',
            assignedTo: workItem.fields?.['System.AssignedTo']?.displayName || '',
            description: workItem.fields?.['System.Description'] || '',
            createdDate: workItem.fields?.['System.CreatedDate'] || '',
            changedDate: workItem.fields?.['System.ChangedDate'] || '',
            tags: workItem.fields?.['System.Tags'] || '',
            reproSteps: workItem.fields?.['Microsoft.VSTS.TCM.ReproSteps'],
            comments: comments?.comments?.map((c: any) => ({
              author: c.createdBy?.displayName || 'Unknown',
              date: c.createdDate || '',
              text: c.text || ''
            })) || [],
            relations: workItem.relations || [],
            development: {
              pullRequests: devLinks.pullRequests || [],
              commits: devLinks.commits || [],
              hasPullRequests: devLinks.hasPullRequests || false,
              hasCommits: devLinks.hasCommits || false
            }
          };
          
          return cacheItem;
        } catch (error) {
          logger.error(`Error fetching details for item ${item.id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any failed items
    const validItems = detailedItems.filter((item): item is WorkItemCache => item !== null);
    logger.info(`Successfully fetched details for ${validItems.length} items`);
    
    // Get current sprint info
    let sprint: any = null;
    try {
      sprint = await azureClient.getCurrentSprint();
      if (sprint) {
        logger.info(`Sprint: ${sprint.name}`);
      }
    } catch (error) {
      logger.warn('Could not fetch sprint info:', error);
    }
    
    // Prepare cache data
    const cacheData = {
      lastUpdated: new Date().toISOString(),
      sprint: sprint ? {
        name: sprint.name,
        path: sprint.path,
        startDate: sprint.attributes?.startDate,
        finishDate: sprint.attributes?.finishDate
      } : null,
      userEmail: config.userEmail,
      workItems: validItems,
      summary: {
        total: validItems.length,
        byState: validItems.reduce((acc: Record<string, number>, item) => {
          acc[item.state] = (acc[item.state] || 0) + 1;
          return acc;
        }, {})
      }
    };
    
    // Save to cache
    saveCache(cacheData);
    
    logger.success('Cache updated successfully!');
    logger.info(`  Work items: ${validItems.length}`);
    logger.info(`  Last updated: ${cacheData.lastUpdated}`);
    
    // Print summary by state
    if (cacheData.summary.byState) {
      logger.info('  By state:');
      Object.entries(cacheData.summary.byState).forEach(([state, count]) => {
        logger.info(`    ${state}: ${count}`);
      });
    }
    
  } catch (error) {
    logger.error('Failed to refresh cache:', error);
    if (error instanceof Error) {
      logger.error(error.stack || '');
    }
    process.exit(1);
  }
}

// Run the script
refreshCache();
