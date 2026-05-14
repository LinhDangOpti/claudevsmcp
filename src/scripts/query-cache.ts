#!/usr/bin/env node

/**
 * Query cache script - Query cached work items with natural language
 */

import { loadCache } from '../utils/cache-manager.js';
import { cleanHtml } from '../utils/html-cleaner.js';
import { logger } from '../utils/logger.js';

/**
 * Parse natural language query to extract filters
 */
function parseQuery(query: string): {
  state?: string;
  withoutPRs?: boolean;
  withoutCommits?: boolean;
  assignee?: string;
  tag?: string;
} {
  const filters: any = {};
  const lowerQuery = query.toLowerCase();

  // Check for state filters
  const stateMatch = lowerQuery.match(/in (acc|active|done|testing|closed|new)/i);
  if (stateMatch) {
    filters.state = stateMatch[1];
  }

  // Check for development link filters
  if (lowerQuery.includes('without pr') || lowerQuery.includes('missing pr') || lowerQuery.includes('no pr')) {
    filters.withoutPRs = true;
  }
  if (lowerQuery.includes('without commit') || lowerQuery.includes('missing commit') || lowerQuery.includes('no commit')) {
    filters.withoutCommits = true;
  }

  // Check for assignee filter
  const assigneeMatch = lowerQuery.match(/assigned to ([a-z]+)/i);
  if (assigneeMatch) {
    filters.assignee = assigneeMatch[1];
  }

  // Check for tag filter
  const tagMatch = lowerQuery.match(/tag[:\s]+([a-z0-9_-]+)/i);
  if (tagMatch) {
    filters.tag = tagMatch[1];
  }

  return filters;
}

/**
 * Filter work items based on parsed filters
 */
function filterWorkItems(workItems: any[], filters: any): any[] {
  return workItems.filter(item => {
    // State filter
    if (filters.state && item.state.toLowerCase() !== filters.state.toLowerCase()) {
      return false;
    }

    // PR filter
    if (filters.withoutPRs && item.development?.hasPullRequests) {
      return false;
    }

    // Commit filter
    if (filters.withoutCommits && item.development?.hasCommits) {
      return false;
    }

    // Assignee filter
    if (filters.assignee && !item.assignedTo?.toLowerCase().includes(filters.assignee.toLowerCase())) {
      return false;
    }

    // Tag filter
    if (filters.tag && !item.tags?.toLowerCase().includes(filters.tag.toLowerCase())) {
      return false;
    }

    return true;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const query = args.join(' ');

  if (!query) {
    logger.error('Usage: node query-cache.js <query>');
    logger.info('Examples:');
    logger.info('  node query-cache.js tickets in ACC without commits');
    logger.info('  node query-cache.js testing tickets missing PRs');
    logger.info('  node query-cache.js active tickets assigned to John');
    logger.info('  node query-cache.js tickets with tag HIGHPRIO');
    process.exit(1);
  }

  try {
    // Load cache
    const cache = loadCache();
    logger.info(`Loaded ${cache.workItems.length} work items from cache`);
    logger.info(`Cache last updated: ${cache.lastUpdated}`);
    logger.info('');

    // Parse query
    const filters = parseQuery(query);
    logger.info(`Query: "${query}"`);
    logger.info('Filters:', JSON.stringify(filters, null, 2));
    logger.info('');

    // Filter work items
    const results = filterWorkItems(cache.workItems, filters);
    
    logger.success(`Found ${results.length} matching work items:`);
    logger.info('');

    // Display results
    results.forEach((item, index) => {
      logger.info(`${index + 1}. [${item.id}] ${item.title}`);
      logger.info(`   State: ${item.state}`);
      logger.info(`   Assigned to: ${item.assignedTo || 'Unassigned'}`);
      if (item.tags) {
        logger.info(`   Tags: ${item.tags}`);
      }
      if (item.development) {
        logger.info(`   PRs: ${item.development.hasPullRequests ? 'Yes' : 'No'}, Commits: ${item.development.hasCommits ? 'Yes' : 'No'}`);
      }
      logger.info('');
    });

  } catch (error) {
    logger.error('Error querying cache:', error);
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

main();
