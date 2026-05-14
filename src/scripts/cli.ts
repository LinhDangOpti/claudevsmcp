#!/usr/bin/env node

/**
 * CLI tool for querying Azure DevOps work items
 */

import { AzureDevOpsClient } from '../azure-devops-client.js';
import { loadConfig } from '../utils/config.js';
import { cleanHtml } from '../utils/html-cleaner.js';
import { logger } from '../utils/logger.js';

const command = process.argv[2];
const arg1 = process.argv[3];

async function main() {
  try {
    const config = loadConfig();
    const azureClient = new AzureDevOpsClient(
      config.orgUrl,
      config.token,
      config.project,
      config.team
    );

    switch (command) {
      case 'my-sprint': {
        if (!arg1) {
          logger.error('Usage: node cli.js my-sprint <email>');
          process.exit(1);
        }
        const myItems = await azureClient.getMyCurrentSprintItems(arg1);
        logger.info(`Found ${myItems.length} work items:\n`);
        myItems.forEach((wi) => {
          logger.info(`[${wi.id}] ${wi.fields?.['System.Title']}`);
          logger.info(`  State: ${wi.fields?.['System.State']}`);
          logger.info(`  Assigned: ${wi.fields?.['System.AssignedTo']?.displayName || 'Unassigned'}\n`);
        });
        break;
      }

      case 'my-verify': {
        if (!config.userEmail) {
          logger.error('AZURE_DEVOPS_USER_EMAIL not set in .env');
          process.exit(1);
        }
        const stories = await azureClient.getUserStoriesWithMyVerifyTasks(config.userEmail);
        logger.info(`Found ${stories.length} user stories with your verify tasks:\n`);
        stories.forEach((story) => {
          logger.info(`[${story.id}] ${story.fields?.['System.Title']}`);
          logger.info(`  State: ${story.fields?.['System.State']}`);
          logger.info(`  Assigned: ${story.fields?.['System.AssignedTo']?.displayName || 'Unassigned'}\n`);
        });
        break;
      }

      case 'item': {
        if (!arg1) {
          logger.error('Usage: node cli.js item <id>');
          process.exit(1);
        }
        const itemId = parseInt(arg1);
        const item = await azureClient.getWorkItem(itemId);
        const comments = await azureClient.getWorkItemComments(itemId);
        
        logger.info(`\n=== Work Item ${item.id} ===\n`);
        logger.info(`Title: ${item.fields?.['System.Title']}`);
        logger.info(`Type: ${item.fields?.['System.WorkItemType']}`);
        logger.info(`State: ${item.fields?.['System.State']}`);
        logger.info(`Assigned: ${item.fields?.['System.AssignedTo']?.displayName || 'Unassigned'}`);
        logger.info(`Created: ${item.fields?.['System.CreatedDate']}`);
        logger.info(`Changed: ${item.fields?.['System.ChangedDate']}`);
        
        if (item.fields?.['System.Tags']) {
          logger.info(`Tags: ${item.fields['System.Tags']}`);
        }
        
        logger.info(`\nDescription:`);
        logger.info(cleanHtml(item.fields?.['System.Description']) || 'No description');
        
        if (item.fields?.['Microsoft.VSTS.TCM.ReproSteps']) {
          logger.info(`\nRepro Steps:`);
          logger.info(cleanHtml(item.fields['Microsoft.VSTS.TCM.ReproSteps']));
        }
        
        if (comments?.comments && comments.comments.length > 0) {
          logger.info(`\n=== Comments (${comments.comments.length}) ===\n`);
          comments.comments.forEach((comment: any) => {
            logger.info(`${comment.createdBy?.displayName} - ${comment.createdDate}:`);
            logger.info(cleanHtml(comment.text));
            logger.info('');
          });
        }
        break;
      }

      case 'sprint-info': {
        const sprint = await azureClient.getCurrentSprint();
        if (sprint) {
          logger.info(`\n=== Current Sprint ===\n`);
          logger.info(`Name: ${sprint.name}`);
          logger.info(`Path: ${sprint.path}`);
          if (sprint.attributes?.startDate) {
            logger.info(`Start: ${sprint.attributes.startDate}`);
          }
          if (sprint.attributes?.finishDate) {
            logger.info(`Finish: ${sprint.attributes.finishDate}`);
          }
        } else {
          logger.warn('Could not retrieve sprint information');
        }
        break;
      }

      case 'list': {
        const allItems = await azureClient.getAllCurrentSprintUserStories();
        logger.info(`\n=== All User Stories (${allItems.length}) ===\n`);
        allItems.forEach((wi) => {
          logger.info(`[${wi.id}] ${wi.fields?.['System.Title']}`);
          logger.info(`  State: ${wi.fields?.['System.State']} | Assigned: ${wi.fields?.['System.AssignedTo']?.displayName || 'Unassigned'}`);
        });
        break;
      }

      default:
        logger.info('Available commands:');
        logger.info('  my-sprint <email>  - Show work items assigned to you in current sprint');
        logger.info('  my-verify          - Show user stories with your verify tasks');
        logger.info('  item <id>          - Show detailed information about a work item');
        logger.info('  sprint-info        - Show current sprint information');
        logger.info('  list               - List all user stories in current sprint');
        process.exit(1);
    }

  } catch (error) {
    logger.error('Error:', error);
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

main();
