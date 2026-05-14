#!/usr/bin/env node

import { loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import * as azdev from 'azure-devops-node-api';

async function getCommitDetails(commitId: string) {
  try {
    const config = loadConfig();
    const authHandler = azdev.getPersonalAccessTokenHandler(config.token);
    const connection = new azdev.WebApi(config.orgUrl, authHandler);

    const gitApi = await connection.getGitApi();
    const repos = await gitApi.getRepositories(config.project);

    logger.info(`\n🔍 Searching for commit ${commitId} across ${repos.length} repositories...\n`);

    let commitFound = false;

    for (const repo of repos) {
      try {
        const commit = await gitApi.getCommit(commitId, repo.id!);

        if (commit) {
          commitFound = true;
          console.log('════════════════════════════════════════════════════════════════════════════════');
          console.log(`COMMIT: ${commitId}`);
          console.log('════════════════════════════════════════════════════════════════════════════════\n');

          console.log(`Repository: ${repo.name}`);
          console.log(`Author: ${commit.author?.name} <${commit.author?.email}>`);
          console.log(`Date: ${commit.author?.date}`);
          console.log(`\n────────────────────────────────────────────────────────────────────────────────`);
          console.log(`MESSAGE:`);
          console.log(`────────────────────────────────────────────────────────────────────────────────`);
          console.log(commit.comment || '(No commit message)');
          console.log(`\n────────────────────────────────────────────────────────────────────────────────`);

          // Get commit changes
          try {
            const changes = await gitApi.getChanges(commitId, repo.id!);

            if (changes && changes.changes && changes.changes.length > 0) {
              console.log(`FILES CHANGED: (${changes.changes.length} files)`);
              console.log(`────────────────────────────────────────────────────────────────────────────────\n`);

              changes.changes.forEach((change, index) => {
                const changeType = String(change.changeType || 'unknown').padEnd(10);
                console.log(`${index + 1}. [${changeType}] ${change.item?.path || 'unknown'}`);
              });

              console.log('\n════════════════════════════════════════════════════════════════════════════════\n');
            } else {
              console.log(`FILES CHANGED: No file changes found\n`);
            }
          } catch (changeError) {
            console.log(`\n⚠️  Could not fetch detailed changes: ${changeError}`);
          }

          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!commitFound) {
      console.log(`\n❌ Commit ${commitId} not found in any repository\n`);
    }

  } catch (error) {
    logger.error('Error fetching commit details:', error);
    process.exit(1);
  }
}

const commitId = process.argv[2];

if (!commitId) {
  console.error('\n❌ Error: Please provide a commit ID');
  console.error('Usage: npm run build && node dist/scripts/get-commit.js <commit-id>\n');
  process.exit(1);
}

getCommitDetails(commitId);
