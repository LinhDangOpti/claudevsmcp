/**
 * Configuration management with validation
 */

import * as dotenv from 'dotenv';

dotenv.config();

export interface AzureDevOpsConfig {
  orgUrl: string;
  token: string;
  project: string;
  team: string;
  userEmail?: string;
}

/**
 * Validate required environment variables
 * @throws Error if any required variable is missing
 */
export function validateConfig(): void {
  const required = [
    'AZURE_DEVOPS_ORG_URL',
    'AZURE_DEVOPS_TOKEN',
    'AZURE_DEVOPS_PROJECT',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}

/**
 * Load and validate configuration from environment
 * @returns Validated configuration object
 */
export function loadConfig(): AzureDevOpsConfig {
  validateConfig();

  return {
    orgUrl: process.env.AZURE_DEVOPS_ORG_URL!,
    token: process.env.AZURE_DEVOPS_TOKEN!,
    project: process.env.AZURE_DEVOPS_PROJECT!,
    team: process.env.AZURE_DEVOPS_TEAM || process.env.AZURE_DEVOPS_PROJECT!,
    userEmail: process.env.AZURE_DEVOPS_USER_EMAIL,
  };
}

/**
 * Get a single config value with validation
 * @param key - Environment variable key
 * @param required - Whether the value is required
 * @returns Config value or undefined
 */
export function getConfigValue(key: string, required: boolean = false): string | undefined {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value;
}
