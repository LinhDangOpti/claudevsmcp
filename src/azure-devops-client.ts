import * as azdev from 'azure-devops-node-api';
import type { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js';
import type { TeamSettingsIteration } from 'azure-devops-node-api/interfaces/WorkInterfaces.js';
import type { 
  GitPullRequest, 
  GitRepository,
  FileDiff,
  GitCommitDiffs
} from 'azure-devops-node-api/interfaces/GitInterfaces.js';
import { PullRequestStatus } from 'azure-devops-node-api/interfaces/GitInterfaces.js';
import { Logger, LogLevel } from './utils/logger.js';

export { LogLevel };

// PR Analysis Interfaces
export interface PRDetails {
  pullRequestId: number;
  repository: string;
  repositoryId: string;
  title: string;
  description: string;
  sourceRefName: string;
  targetRefName: string;
  status: string;
  createdBy: string;
  creationDate: Date;
  closedDate?: Date;
  url: string;
}

export interface FileChange {
  path: string;
  changeType: 'add' | 'edit' | 'delete' | 'rename';
  oldPath?: string;
}

export interface FileDiffDetails {
  path: string;
  changeType: 'add' | 'edit' | 'delete' | 'rename';
  additions: number;
  deletions: number;
  diff?: string;
  oldPath?: string;
}

export class AzureDevOpsClient {
  private connection: azdev.WebApi;
  private orgUrl: string;
  private project: string;
  private team: string;
  private logger: Logger;

  constructor(orgUrl: string, token: string, project: string, team: string, logLevel: LogLevel = LogLevel.INFO) {
    this.orgUrl = orgUrl;
    this.project = project;
    this.team = team;
    this.logger = new Logger('AzureDevOpsClient', logLevel);
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    this.connection = new azdev.WebApi(orgUrl, authHandler);
  }

  // Get all work items by query
  async getWorkItemsByQuery(wiql: string): Promise<WorkItem[]> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    const queryResult = await witApi.queryByWiql({ query: wiql }, { project: this.project });

    if (!queryResult.workItems || queryResult.workItems.length === 0) {
      return [];
    }

    const ids = queryResult.workItems.map(wi => wi.id!);

    // Azure DevOps API has a limit of 200 work items per request, so batch the requests
    const batchSize = 200;
    const workItems: WorkItem[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const batchWorkItems = await witApi.getWorkItems(batchIds, undefined, undefined, undefined, 1);
      workItems.push(...batchWorkItems);
    }

    return workItems;
  }

  // Get work items for current user in current sprint
  async getMyCurrentSprintItems(userEmail: string): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.AssignedTo] = '${userEmail}'
        AND [System.IterationPath] = @currentIteration
      ORDER BY [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get all tickets by state
  async getWorkItemsByState(state: string): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.State] = '${state}'
      ORDER BY [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get current sprint information
  // async getCurrentSprint(): Promise<TeamSettingsIteration | null> {
  //   const workApi = await this.connection.getWorkApi();
  //   const teamContext = { project: this.project, team: this.team };

  //   const iterations = await workApi.getTeamIterations(teamContext, '$current');
  //   if (!iterations || iterations.length === 0) {
  //     return null;
  //   }
  //   return iterations[0];
  // }

  // Get current sprint information
// Get current sprint information
// Get current sprint information
async getCurrentSprint(): Promise<TeamSettingsIteration | null> {
  try {
    const workApi = await this.connection.getWorkApi();

    // Try different team context variations
    const teamVariations = [
      { project: this.project, team: this.team },
      { project: this.project, team: `${this.project} Team` },
      { projectId: this. project, teamId: this.team },
    ];

    let iterations: any[] | null = null;
    let successfulContext = null;

    for (const context of teamVariations) {
      try {
        const result = await workApi.getTeamIterations(context as any);
        if (result && result.length > 0) {
          iterations = result;
          successfulContext = context;
          break;
        }
      } catch (err) {
        // Try next variation
      }
    }
    
    if (iterations && iterations.length > 0) {
      const today = new Date();
      const currentSprint = iterations. find(iteration => {
        if (iteration.attributes?.startDate && iteration.attributes?.finishDate) {
          const startDate = new Date(iteration.attributes.startDate);
          const finishDate = new Date(iteration.attributes.finishDate);
          return today >= startDate && today <= finishDate;
        }
        return false;
      });
      
      if (currentSprint) {
        return currentSprint;
      }
    }

    // Fallback: Get sprint info from existing work items query
    const workItems = await this.getAllCurrentSprintUserStories();
    
    if (workItems. length > 0) {
      const firstWorkItem = workItems[0];
      const iterationPath = firstWorkItem.fields?.['System.IterationPath'];
      
      if (iterationPath) {
        const pathParts = iterationPath.split('\\');
        const sprintName = pathParts[pathParts. length - 1];
        
        // Try to get iteration by name if we found a successful context
        if (successfulContext) {
          try {
            const iteration = await workApi.getTeamIteration(successfulContext as any, sprintName);
            if (iteration) {
              return iteration;
            }
          } catch (err) {
            // Fall through to basic sprint object
          }
        }
        
        // Return basic sprint object
        return {
          id: iterationPath,
          name: sprintName,
          path: iterationPath,
          attributes: {}
        } as TeamSettingsIteration;
      }
    }

    return null;
  } catch (error) {
    this.logger.error('Error getting current sprint:', error);
    return null;
  }
}

  // Get work item details
  async getWorkItem(id: number): Promise<WorkItem> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    return await witApi.getWorkItem(id);
  }

  // Get work item comments
  async getWorkItemComments(id: number): Promise<any> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    try {
      return await witApi.getComments(this.project, id);
    } catch (error) {
      return { comments: [] };
    }
  }

  // Get work item development links (pull requests, commits, builds)
  async getWorkItemDevelopmentLinks(id: number): Promise<any> {
    try {
      const witApi = await this.connection.getWorkItemTrackingApi();
      const workItem = await witApi.getWorkItem(id, undefined, undefined, 1);
      
      // Get external links that represent pull requests, commits, and branches
      const pullRequests: any[] = [];
      const commits: any[] = [];
      const branches: any[] = [];
      
      if (workItem.relations) {
        for (const relation of workItem.relations) {
          // Pull Request links
          if (relation.rel === 'ArtifactLink' && relation.url?.includes('vstfs:///Git/PullRequestId')) {
            const prId = relation.url.split('/').pop();
            pullRequests.push({
              id: prId,
              url: relation.url,
              attributes: relation.attributes
            });
          }
          // Commit links
          else if (relation.rel === 'ArtifactLink' && relation.url?.includes('vstfs:///Git/Commit')) {
            const commitId = relation.url.split('/').pop();
            commits.push({
              id: commitId,
              url: relation.url,
              attributes: relation.attributes
            });
          }
          // Branch links
          else if (relation.rel === 'ArtifactLink' && relation.url?.includes('vstfs:///Git/Ref')) {
            const branchId = relation.url.split('/').pop();
            branches.push({
              id: branchId,
              url: relation.url,
              attributes: relation.attributes
            });
          }
        }
      }
      
      return {
        pullRequests,
        commits,
        branches,
        hasPullRequests: pullRequests.length > 0,
        hasCommits: commits.length > 0,
        hasBranches: branches.length > 0
      };
    } catch (error) {
      return {
        pullRequests: [],
        commits: [],
        branches: [],
        hasPullRequests: false,
        hasCommits: false,
        hasBranches: false
      };
    }
  }

  // Get all work items in current sprint
  async getAllCurrentSprintItems(): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.IterationPath] = @currentIteration
      ORDER BY [System.State] ASC, [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get all user stories and bugs in current sprint
  async getAllCurrentSprintUserStories(): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.IterationPath] = @currentIteration
        AND ([System.WorkItemType] = 'User Story' OR [System.WorkItemType] = 'Bug')
      ORDER BY [System.State] ASC, [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get child tasks for a work item
  async getChildTasks(parentId: number): Promise<WorkItem[]> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    const workItem = await witApi.getWorkItem(parentId, undefined, undefined, 1);

    if (!workItem.relations) {
      return [];
    }

    // Filter child relations
    const childIds = workItem.relations
      .filter(rel => rel.rel === 'System.LinkTypes.Hierarchy-Forward')
      .map(rel => {
        const url = rel.url!;
        const id = parseInt(url.substring(url.lastIndexOf('/') + 1));
        return id;
      });

    if (childIds.length === 0) {
      return [];
    }

    const children = await witApi.getWorkItems(childIds, undefined, undefined, undefined, 1);
    return children;
  }

  // Get user stories with my verify tasks
  async getUserStoriesWithMyVerifyTasks(userEmail: string): Promise<WorkItem[]> {
    // First get all user stories
    const userStories = await this.getAllCurrentSprintUserStories();

    // For each user story, get child tasks
    const storiesWithVerifyTasks: WorkItem[] = [];

    for (const story of userStories) {
      const children = await this.getChildTasks(story.id!);

      // Check if any child task is assigned to user and title starts with "Verify"
      const hasMyVerifyTask = children.some(child => {
        const title = child.fields?.['System.Title'] || '';
        const assignedTo = child.fields?.['System.AssignedTo']?.uniqueName || '';
        const workItemType = child.fields?.['System.WorkItemType'] || '';

        return workItemType === 'Task' &&
          title.startsWith('Verify') &&
          assignedTo === userEmail;
      });

      if (hasMyVerifyTask) {
        storiesWithVerifyTasks.push(story);
      }
    }

    return storiesWithVerifyTasks;
  }

  // ============================================
  // PHASE 1: PR DATA EXTRACTION METHODS
  // ============================================

  /**
   * Get all repositories in the project
   */
  async getRepositories(): Promise<GitRepository[]> {
    try {
      const gitApi = await this.connection.getGitApi();
      const repositories = await gitApi.getRepositories(this.project);
      this.logger.info(`Found ${repositories.length} repositories in project ${this.project}`);
      return repositories;
    } catch (error) {
      this.logger.error('Error getting repositories:', error);
      throw error;
    }
  }

  /**
   * Get Pull Request details from PR ID and repository
   * @param repositoryId - Repository ID or name
   * @param pullRequestId - Pull Request ID
   */
  async getPullRequestDetails(repositoryId: string, pullRequestId: number): Promise<PRDetails | null> {
    try {
      const gitApi = await this.connection.getGitApi();
      const pr = await gitApi.getPullRequest(repositoryId, pullRequestId, this.project);

      if (!pr) {
        this.logger.warn(`Pull Request ${pullRequestId} not found in repository ${repositoryId}`);
        return null;
      }

      const details: PRDetails = {
        pullRequestId: pr.pullRequestId!,
        repository: pr.repository?.name || repositoryId,
        repositoryId: pr.repository?.id || repositoryId,
        title: pr.title || '',
        description: pr.description || '',
        sourceRefName: pr.sourceRefName || '',
        targetRefName: pr.targetRefName || '',
        status: String(pr.status || ''),
        createdBy: pr.createdBy?.displayName || '',
        creationDate: pr.creationDate || new Date(),
        closedDate: pr.closedDate,
        url: pr.url || ''
      };

      this.logger.success(`Retrieved PR #${pullRequestId}: ${details.title}`);
      return details;
    } catch (error) {
      this.logger.error(`Error getting PR details for PR #${pullRequestId}:`, error);
      return null;
    }
  }

  /**
   * Get changed files in a Pull Request
   * @param repositoryId - Repository ID or name
   * @param pullRequestId - Pull Request ID
   */
  async getPullRequestChangedFiles(repositoryId: string, pullRequestId: number): Promise<FileChange[]> {
    try {
      const gitApi = await this.connection.getGitApi();
      
      // Get PR iterations to find the latest one
      const iterations = await gitApi.getPullRequestIterations(repositoryId, pullRequestId, this.project);
      
      if (!iterations || iterations.length === 0) {
        this.logger.warn(`No iterations found for PR #${pullRequestId}`);
        return [];
      }

      // Get the latest iteration (usually the last one)
      const latestIteration = iterations[iterations.length - 1];
      
      if (!latestIteration.id) {
        this.logger.warn(`Latest iteration has no ID for PR #${pullRequestId}`);
        return [];
      }

      // Get changes from the latest iteration
      const changes = await gitApi.getPullRequestIterationChanges(
        repositoryId,
        pullRequestId,
        latestIteration.id,
        this.project
      );

      const fileChanges: FileChange[] = [];

      if (changes && changes.changeEntries) {
        for (const change of changes.changeEntries) {
          const item = change.item;
          if (!item || item.isFolder) continue;

          const changeType = this.mapChangeType(change.changeType);
          
          fileChanges.push({
            path: item.path || '',
            changeType,
            oldPath: change.sourceServerItem
          });
        }
      }

      this.logger.success(`Found ${fileChanges.length} changed files in PR #${pullRequestId}`);
      return fileChanges;
    } catch (error) {
      this.logger.error(`Error getting changed files for PR #${pullRequestId}:`, error);
      return [];
    }
  }

  /**
   * Get file diffs for a Pull Request with detailed diff content
   * @param repositoryId - Repository ID or name
   * @param pullRequestId - Pull Request ID
   */
  async getPullRequestFileDiffs(repositoryId: string, pullRequestId: number): Promise<FileDiffDetails[]> {
    try {
      const gitApi = await this.connection.getGitApi();
      
      // Get PR iterations to find the latest one
      const iterations = await gitApi.getPullRequestIterations(repositoryId, pullRequestId, this.project);
      
      if (!iterations || iterations.length === 0) {
        this.logger.warn(`No iterations found for PR #${pullRequestId}`);
        return [];
      }

      // Get the latest iteration (usually the last one)
      const latestIteration = iterations[iterations.length - 1];
      
      if (!latestIteration.id) {
        this.logger.warn(`Latest iteration has no ID for PR #${pullRequestId}`);
        return [];
      }

      // Get changes from the latest iteration
      const changes = await gitApi.getPullRequestIterationChanges(
        repositoryId,
        pullRequestId,
        latestIteration.id,
        this.project
      );

      const fileDiffs: FileDiffDetails[] = [];

      if (changes && changes.changeEntries) {
        for (const change of changes.changeEntries) {
          const item = change.item;
          if (!item || item.isFolder) continue;

          const changeType = this.mapChangeType(change.changeType);
          
          // Get line diff information
          let additions = 0;
          let deletions = 0;
          let diffContent = '';
          
          try {
            // Try to get the actual content for text files
            if (item.path && !this.isBinaryFile(item.path)) {
              // Note: Azure DevOps API does not preserve full file content/diffs after PR is merged
              // We can only show change type and file path
              try {
                if (changeType === 'add') {
                  diffContent = `File added: ${item.path}`;
                  additions = 1; // Approximate
                } else if (changeType === 'edit') {
                  diffContent = `File modified: ${item.path}`;
                  additions = 1; // Approximate
                } else if (changeType === 'delete') {
                  diffContent = `File deleted: ${item.path}`;
                  deletions = 1;
                } else if (changeType === 'rename') {
                  diffContent = `File renamed: ${change.sourceServerItem} → ${item.path}`;
                }
              } catch (blobError) {
                this.logger.warn(`Could not get blob content for ${item.path}:`, blobError);
                diffContent = `File ${changeType}: ${item.path} (content unavailable)`;
              }
            } else {
              diffContent = `Binary file: ${item.path}`;
            }
          } catch (error) {
            this.logger.warn(`Could not get diff content for ${item.path}:`, error);
            diffContent = `File changed: ${item.path} (diff unavailable)`;
          }

          fileDiffs.push({
            path: item.path || '',
            changeType,
            additions,
            deletions,
            diff: diffContent || undefined,
            oldPath: change.sourceServerItem
          });
        }
      }

      this.logger.success(`Retrieved ${fileDiffs.length} file diffs for PR #${pullRequestId}`);
      return fileDiffs;
    } catch (error) {
      this.logger.error(`Error getting file diffs for PR #${pullRequestId}:`, error);
      return [];
    }
  }

  /**
   * Extract PR information from a work item
   * Returns array of PR details found in the work item relations
   */
  async extractPRsFromWorkItem(workItemId: number): Promise<PRDetails[]> {
    try {
      const devLinks = await this.getWorkItemDevelopmentLinks(workItemId);
      
      if (!devLinks.hasPullRequests) {
        this.logger.info(`Work item #${workItemId} has no linked pull requests`);
        return [];
      }

      this.logger.debug(`Found ${devLinks.pullRequests.length} PR link(s) in work item #${workItemId}`);

      const prDetails: PRDetails[] = [];

      for (const pr of devLinks.pullRequests) {
        this.logger.debug(`PR URL: ${pr.url}`);
        
        // Parse PR URL to extract repository and PR ID
        // URL format: vstfs:///Git/PullRequestId/{projectId}%2F{repoId}%2F{prId}
        try {
          // Extract the part after /PullRequestId/
          const match = pr.url.match(/\/PullRequestId\/(.+)$/);
          if (!match) {
            this.logger.warn(`Invalid PR URL format: ${pr.url}`);
            continue;
          }

          const encodedPath = match[1];
          this.logger.debug(`Encoded path: ${encodedPath}`);
          
          // Decode URL (convert %2F to /)
          const decodedPath = decodeURIComponent(encodedPath);
          this.logger.debug(`Decoded path: ${decodedPath}`);
          
          // Split by / to get projectId, repoId, prId
          const parts = decodedPath.split('/');
          this.logger.debug(`Path parts:`, parts);
          
          if (parts.length !== 3) {
            this.logger.warn(`Expected 3 parts (project/repo/pr), got ${parts.length}: ${pr.url}`);
            continue;
          }

          const [projectId, repoId, prId] = parts;

          if (repoId && prId) {
            this.logger.debug(`Attempting to fetch PR #${prId} from repo ${repoId}`);
            const details = await this.getPullRequestDetails(repoId, parseInt(prId));
            if (details) {
              // Only include completed PRs (status = 3)
              if (details.status === String(PullRequestStatus.Completed)) {
                prDetails.push(details);
                this.logger.debug(`PR #${prId} is completed - added to results`);
              } else {
                this.logger.debug(`PR #${prId} status is ${details.status} - skipped (not completed)`);
              }
            }
          } else {
            this.logger.warn(`Could not parse repo/PR ID from URL: ${pr.url}`);
          }
        } catch (error) {
          this.logger.error(`Error parsing PR URL ${pr.url}:`, error);
        }
      }

      this.logger.success(`Extracted ${prDetails.length} completed PRs from work item #${workItemId}`);
      return prDetails;
    } catch (error) {
      this.logger.error(`Error extracting PRs from work item #${workItemId}:`, error);
      return [];
    }
  }

  /**
   * Helper: Map Azure DevOps change type to simplified type
   */
  private mapChangeType(changeType: any): 'add' | 'edit' | 'delete' | 'rename' {
    // Azure DevOps VersionControlChangeType enum values
    // 1 = Add, 2 = Edit, 4 = Encoding, 8 = Rename, 16 = Delete, etc.
    if (changeType & 16) return 'delete';
    if (changeType & 8) return 'rename';
    if (changeType & 1) return 'add';
    return 'edit';
  }

  /**
   * Helper: Check if file is binary based on extension
   */
  private isBinaryFile(path: string): boolean {
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
    ];
    
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    return binaryExtensions.includes(ext);
  }
}