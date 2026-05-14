/**
 * Test script for Phase 1: PR Data Extraction
 * 
 * This script tests the new PR extraction methods:
 * - getPullRequestDetails()
 * - getPullRequestChangedFiles()
 * - getPullRequestFileDiffs()
 * - extractPRsFromWorkItem()
 * 
 * Repository: Hardcoded to dotcom-net5
 */

import { AzureDevOpsClient } from '../azure-devops-client.js';
import { loadConfig } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
import { analyzeFunctionalityImpact, FunctionalityImpact } from '../utils/impact-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('TestPRExtraction');

// Hardcoded repository information
const TARGET_REPO = {
  name: 'dotcom-net5',
  id: '4caa38d7-3ba0-4bfa-9e6f-a9de76020a46'
};

// Output directory for PR analysis reports
const OUTPUT_DIR = 'pr-analysis';

// Interface for PR analysis results
interface PRAnalysisResult {
  workItemId: number;
  repository: string;
  orgUrl: string;
  project: string;
  timestamp: string;
  totalPRs: number;
  functionalityImpacts: FunctionalityImpact[];
  prs: Array<{
    id: number;
    title: string;
    status: string;
    createdBy: string;
    creationDate: string;
    sourceRefName: string;
    targetRefName: string;
    changedFilesCount: number;
    changedFiles: Array<{
      path: string;
      changeType: string;
      additions?: number;
      deletions?: number;
      diff?: string;
    }>;
  }>;
}

/**
 * Generate Markdown table from PR analysis results
 */
function generateMarkdownReport(result: PRAnalysisResult): string {
  const lines: string[] = [];
  
  lines.push(`# PR Analysis Report - Work Item #${result.workItemId}`);
  lines.push('');
  lines.push(`**Repository:** ${result.repository}`);
  lines.push(`**Generated:** ${result.timestamp}`);
  lines.push(`**Total PRs:** ${result.totalPRs}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| PR # | Title | Created By | Date | Files Changed |');
  lines.push('|------|-------|------------|------|---------------|');
  
  for (const pr of result.prs) {
    const title = pr.title.length > 60 ? pr.title.substring(0, 57) + '...' : pr.title;
    const date = new Date(pr.creationDate).toLocaleDateString();
    lines.push(`| [#${pr.id}](#pr-${pr.id}) | ${title} | ${pr.createdBy} | ${date} | ${pr.changedFilesCount} |`);
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Functionality Impact Analysis
  if (result.functionalityImpacts && result.functionalityImpacts.length > 0) {
    lines.push('## 🎯 Functionality Impact Analysis');
    lines.push('');
    lines.push('Based on the changed files, the following functionalities may be affected:');
    lines.push('');
    
    for (const impact of result.functionalityImpacts) {
      const severityIcon = impact.severity === 'high' ? '🔴' : impact.severity === 'medium' ? '🟡' : '🟢';
      const severityLabel = impact.severity.toUpperCase();
      
      lines.push(`### ${severityIcon} ${impact.functionality} - ${severityLabel}`);
      lines.push('');
      lines.push(`**Impact:** ${impact.description}`);
      lines.push('');
      lines.push(`**Affected Files (${impact.affectedFiles.length}):**`);
      for (const file of impact.affectedFiles) {
        lines.push(`- \`${file}\``);
      }
      lines.push('');
      
      if (impact.testingRecommendations.length > 0) {
        lines.push('**Testing Recommendations:**');
        for (const rec of impact.testingRecommendations) {
          lines.push(`- ${rec}`);
        }
        lines.push('');
      }
    }
    
    lines.push('---');
    lines.push('');
  }
  
  // Detail section for each PR
  lines.push('## Pull Request Details');
  lines.push('');
  
  for (const pr of result.prs) {
    lines.push(`### PR #${pr.id}`);
    lines.push('');
    lines.push(`**Title:** ${pr.title}`);
    lines.push('');
    lines.push(`**Created by:** ${pr.createdBy} on ${new Date(pr.creationDate).toLocaleDateString()}`);
    lines.push('');
    lines.push(`**Branch:** \`${pr.sourceRefName}\` → \`${pr.targetRefName}\``);
    lines.push('');
    lines.push(`**Status:** ${pr.status}`);
    lines.push('');
    
    if (pr.changedFiles.length > 0) {
      lines.push('#### Changed Files');
      lines.push('');
      lines.push('| Change Type | File Path |');
      lines.push('|-------------|-----------|');
      
      for (const file of pr.changedFiles) {
        const icon = file.changeType === 'add' ? '➕' : 
                     file.changeType === 'delete' ? '❌' : 
                     file.changeType === 'rename' ? '📝' : '✏️';
        lines.push(`| ${icon} ${file.changeType} | \`${file.path}\` |`);
      }
      lines.push('');
      lines.push('> **Note:** Full code diffs are not available for completed (merged) pull requests in Azure DevOps API.');
      lines.push('');
    } else {
      lines.push('*No changed files available*');
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Generate HTML report from PR analysis results
 */
function generateHTMLReport(result: PRAnalysisResult): string {
  const severityColors = {
    high: '#dc3545',
    medium: '#ffc107',
    low: '#28a745'
  };
  
  const severityIcons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };
  
  const changeTypeIcons: Record<string, string> = {
    add: '➕',
    edit: '✏️',
    delete: '❌',
    rename: '📝'
  };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PR Analysis Report - Work Item #${result.workItemId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header-info {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 24px;
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6c757d;
      margin-top: 5px;
    }
    
    .impact-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .impact-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .impact-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      color: white;
    }
    
    .impact-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      flex: 1;
    }
    
    .impact-description {
      color: #6c757d;
      margin-bottom: 15px;
      font-size: 14px;
    }
    
    .files-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }
    
    .files-table th,
    .files-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .files-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #495057;
      position: sticky;
      top: 0;
    }
    
    .files-table tr:hover {
      background: #f8f9fa;
    }
    
    .file-path {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #495057;
    }
    
    .change-type {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .change-type.add { background: #d4edda; color: #155724; }
    .change-type.edit { background: #fff3cd; color: #856404; }
    .change-type.delete { background: #f8d7da; color: #721c24; }
    .change-type.rename { background: #d1ecf1; color: #0c5460; }
    
    .recommendations {
      background: #e7f3ff;
      border-left: 4px solid #2196f3;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
    }
    
    .recommendations-title {
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 10px;
      font-size: 14px;
    }
    
    .recommendations ul {
      list-style: none;
      padding-left: 0;
    }
    
    .recommendations li {
      padding: 5px 0;
      padding-left: 20px;
      position: relative;
      font-size: 14px;
      color: #333;
    }
    
    .recommendations li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #2196f3;
      font-weight: bold;
    }
    
    .pr-summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    
    .pr-summary-table th,
    .pr-summary-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .pr-summary-table th {
      background: #667eea;
      color: white;
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    
    .pr-summary-table tr:hover {
      background: #f8f9fa;
    }
    
    .pr-number {
      font-weight: 600;
      color: #667eea;
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .pr-number:hover {
      color: #764ba2;
      text-decoration: underline;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .impact-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 PR Analysis Report</h1>
      <h2>Work Item #${result.workItemId}</h2>
      <div class="header-info">
        <div><strong>Repository:</strong> ${result.repository}</div>
        <div><strong>Total PRs:</strong> ${result.totalPRs}</div>
        <div><strong>Generated:</strong> ${new Date(result.timestamp).toLocaleString()}</div>
      </div>
    </div>
    
    <div class="content">
      ${result.functionalityImpacts && result.functionalityImpacts.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🎯 Functionality Impact Analysis</h2>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${result.functionalityImpacts.filter(i => i.severity === 'high').length}</div>
            <div class="stat-label">High Priority</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.functionalityImpacts.filter(i => i.severity === 'medium').length}</div>
            <div class="stat-label">Medium Priority</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.functionalityImpacts.filter(i => i.severity === 'low').length}</div>
            <div class="stat-label">Low Priority</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.functionalityImpacts.reduce((sum, i) => sum + i.affectedFiles.length, 0)}</div>
            <div class="stat-label">Total Files Affected</div>
          </div>
        </div>
        
        ${result.functionalityImpacts.map(impact => `
        <div class="impact-card">
          <div class="impact-header">
            <span style="font-size: 24px;">${severityIcons[impact.severity]}</span>
            <div class="impact-title">${escapeHtml(impact.functionality)}</div>
            <span class="severity-badge" style="background-color: ${severityColors[impact.severity]}">
              ${impact.severity.toUpperCase()}
            </span>
          </div>
          
          <div class="impact-description">
            <strong>Impact:</strong> ${escapeHtml(impact.description)}
          </div>
          
          <table class="files-table">
            <thead>
              <tr>
                <th style="width: 120px;">Change Type</th>
                <th>File Path</th>
              </tr>
            </thead>
            <tbody>
              ${impact.affectedFiles.map(file => {
                const changeType = getFileChangeType(file, result);
                return `
                <tr>
                  <td>
                    <span class="change-type ${changeType}">
                      ${changeTypeIcons[changeType] || ''} ${changeType}
                    </span>
                  </td>
                  <td><span class="file-path">${escapeHtml(file)}</span></td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          ${impact.testingRecommendations.length > 0 ? `
          <div class="recommendations">
            <div class="recommendations-title">📋 Testing Recommendations</div>
            <ul>
              ${impact.testingRecommendations.map(rec => `<li>${escapeHtml(rec)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      <div class="section">
        <h2 class="section-title">📝 Pull Request Summary</h2>
        <table class="pr-summary-table">
          <thead>
            <tr>
              <th>PR #</th>
              <th>Title</th>
              <th>Created By</th>
              <th>Date</th>
              <th>Files Changed</th>
            </tr>
          </thead>
          <tbody>
            ${result.prs.map(pr => {
              const prUrl = `${result.orgUrl}/${encodeURIComponent(result.project)}/_git/${encodeURIComponent(result.repository)}/pullrequest/${pr.id}`;
              return `
            <tr>
              <td><a href="${prUrl}" target="_blank" class="pr-number">#${pr.id}</a></td>
              <td>${escapeHtml(pr.title)}</td>
              <td>${escapeHtml(pr.createdBy)}</td>
              <td>${new Date(pr.creationDate).toLocaleDateString()}</td>
              <td>${pr.changedFilesCount}</td>
            </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="footer">
      Generated by Azure DevOps MCP Server - PR Analysis Tool
    </div>
  </div>
  
  <script>
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Helper function to get change type for a file
 */
function getFileChangeType(filePath: string, result: PRAnalysisResult): string {
  for (const pr of result.prs) {
    const file = pr.changedFiles.find(f => f.path === filePath);
    if (file) {
      return file.changeType;
    }
  }
  return 'edit';
}

/**
 * Save analysis results to files
 */
function saveAnalysisResults(result: PRAnalysisResult): void {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const baseFileName = `${result.workItemId}-pr-analysis`;
  
  // Save JSON
  const jsonPath = path.join(OUTPUT_DIR, `${baseFileName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  logger.success(`JSON report saved: ${jsonPath}`);
  
  // Save Markdown
  const mdPath = path.join(OUTPUT_DIR, `${baseFileName}.md`);
  const markdown = generateMarkdownReport(result);
  fs.writeFileSync(mdPath, markdown);
  logger.success(`Markdown report saved: ${mdPath}`);
  
  // Save HTML
  const htmlPath = path.join(OUTPUT_DIR, `${baseFileName}.html`);
  const html = generateHTMLReport(result);
  fs.writeFileSync(htmlPath, html);
  logger.success(`HTML report saved: ${htmlPath}`);
}

async function main() {
  try {
    // Load configuration
    const config = loadConfig();
    
    logger.info('='.repeat(60));
    logger.info('PHASE 1: PR DATA EXTRACTION TEST');
    logger.info('='.repeat(60));
    
    // Initialize Azure DevOps client
    const client = new AzureDevOpsClient(
      config.orgUrl,
      config.token,
      config.project,
      config.team
    );

    // Step 1: Show target repository
    logger.info('\n📦 Step 1: Target Repository:');
    logger.info(`  Repository: ${TARGET_REPO.name}`);
    logger.info(`  ID: ${TARGET_REPO.id}`);

    // Step 2: Test with a work item that has PR links
    logger.info('\n🔍 Step 2: Testing PR extraction from work item...');
    
    const workItemId = process.argv[2] ? parseInt(process.argv[2]) : null;
    
    if (!workItemId) {
      logger.warn('No work item ID provided. Skipping PR extraction test.');
      logger.info('Usage: npm run test:pr <work-item-id>');
      logger.info('Example: npm run test:pr 13071');
      return;
    }

    // Extract PRs from work item
    logger.info(`\nExtracting PRs from work item #${workItemId}...`);
    const prs = await client.extractPRsFromWorkItem(workItemId);

    if (prs.length === 0) {
      logger.warn(`No completed pull requests found for work item #${workItemId}`);
      return;
    }

    // Filter PRs to only include the target repository
    const targetRepoPRs = prs.filter(pr => pr.repositoryId === TARGET_REPO.id);

    if (targetRepoPRs.length === 0) {
      logger.warn(`No PRs found in repository ${TARGET_REPO.name} for work item #${workItemId}`);
      logger.info(`Total PRs found: ${prs.length} (in other repositories)`);
      return;
    }

    logger.success(`\n✅ Found ${targetRepoPRs.length} pull request(s) in ${TARGET_REPO.name}:`);
    if (targetRepoPRs.length < prs.length) {
      logger.info(`(Filtered from ${prs.length} total PRs across all repositories)`);
    }
    
    // Prepare analysis result
    const analysisResult: PRAnalysisResult = {
      workItemId,
      repository: TARGET_REPO.name,
      orgUrl: config.orgUrl,
      project: config.project,
      timestamp: new Date().toISOString(),
      totalPRs: targetRepoPRs.length,
      functionalityImpacts: [],
      prs: []
    };
    
    for (const pr of targetRepoPRs) {
      logger.info('\n' + '-'.repeat(60));
      logger.info(`PR #${pr.pullRequestId}: ${pr.title}`);
      logger.info(`Repository: ${pr.repository}`);
      logger.info(`Status: ${pr.status}`);
      logger.info(`Source: ${pr.sourceRefName} → Target: ${pr.targetRefName}`);
      logger.info(`Created by: ${pr.createdBy} on ${pr.creationDate.toLocaleDateString()}`);
      if (pr.description) {
        logger.info(`Description: ${pr.description.substring(0, 100)}...`);
      }

      // Step 3: Get changed files
      logger.info('\n📄 Fetching changed files...');
      const changedFiles = await client.getPullRequestChangedFiles(pr.repositoryId, pr.pullRequestId);
      
      if (changedFiles.length > 0) {
        logger.success(`Found ${changedFiles.length} changed file(s):`);
        changedFiles.slice(0, 10).forEach(file => {
          const icon = file.changeType === 'add' ? '➕' : 
                       file.changeType === 'delete' ? '❌' : 
                       file.changeType === 'rename' ? '📝' : '✏️';
          logger.info(`  ${icon} [${file.changeType}] ${file.path}`);
        });
        
        if (changedFiles.length > 10) {
          logger.info(`  ... and ${changedFiles.length - 10} more files`);
        }
      } else {
        logger.warn('No changed files found');
      }

      // Step 4: Get file diffs (detailed)
      logger.info('\n🔍 Fetching file diffs with details...');
      const fileDiffs = await client.getPullRequestFileDiffs(pr.repositoryId, pr.pullRequestId);
      
      if (fileDiffs.length > 0) {
        logger.success(`Retrieved ${fileDiffs.length} file diff(s)`);
        
        // Show summary by change type
        const summary = {
          add: fileDiffs.filter(f => f.changeType === 'add').length,
          edit: fileDiffs.filter(f => f.changeType === 'edit').length,
          delete: fileDiffs.filter(f => f.changeType === 'delete').length,
          rename: fileDiffs.filter(f => f.changeType === 'rename').length
        };
        
        logger.info('\nChange Summary:');
        if (summary.add > 0) logger.info(`  ➕ Added: ${summary.add} files`);
        if (summary.edit > 0) logger.info(`  ✏️  Modified: ${summary.edit} files`);
        if (summary.delete > 0) logger.info(`  ❌ Deleted: ${summary.delete} files`);
        if (summary.rename > 0) logger.info(`  📝 Renamed: ${summary.rename} files`);
      }
      
      // Collect data for analysis report
      analysisResult.prs.push({
        id: pr.pullRequestId,
        title: pr.title,
        status: pr.status,
        createdBy: pr.createdBy,
        creationDate: pr.creationDate.toISOString(),
        sourceRefName: pr.sourceRefName,
        targetRefName: pr.targetRefName,
        changedFilesCount: fileDiffs.length,
        changedFiles: fileDiffs.map(f => ({
          path: f.path,
          changeType: f.changeType,
          additions: f.additions,
          deletions: f.deletions,
          diff: f.diff
        }))
      });
    }

    logger.info('\n' + '='.repeat(60));
    logger.success('✅ Phase 1 PR Data Extraction test completed successfully!');
    logger.info('='.repeat(60));
    
    // Analyze functionality impact
    logger.info('\n🎯 Step 3: Analyzing functionality impact...');
    const allChangedFiles: string[] = [];
    for (const pr of analysisResult.prs) {
      for (const file of pr.changedFiles) {
        if (!allChangedFiles.includes(file.path)) {
          allChangedFiles.push(file.path);
        }
      }
    }
    
    analysisResult.functionalityImpacts = analyzeFunctionalityImpact(allChangedFiles);
    logger.success(`Identified ${analysisResult.functionalityImpacts.length} functionality impact(s)`);
    
    // Show impact summary
    for (const impact of analysisResult.functionalityImpacts) {
      const severityIcon = impact.severity === 'high' ? '🔴' : impact.severity === 'medium' ? '🟡' : '🟢';
      logger.info(`  ${severityIcon} ${impact.functionality} - ${impact.affectedFiles.length} file(s)`);
    }
    
    // Save analysis results
    logger.info('\n📝 Saving analysis results...');
    saveAnalysisResults(analysisResult);
    logger.info('');
    logger.success('✅ Reports generated successfully!');
    logger.info(`  - JSON: pr-analysis/${workItemId}-pr-analysis.json`);
    logger.info(`  - Markdown: pr-analysis/${workItemId}-pr-analysis.md`);
    logger.info('');


  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

main();
