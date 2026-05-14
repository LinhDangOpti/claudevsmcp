/**
 * Cache management utilities for work items
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export interface CacheData {
  workItems: any[];
  lastUpdated: string;
  sprint?: {
    name?: string;
    path?: string;
    startDate?: string;
    finishDate?: string;
  } | null;
  userEmail?: string;
  summary?: {
    total: number;
    byState?: Record<string, number>;
  };
}

/**
 * Get the cache file path
 * @param baseDir - Base directory (defaults to project root)
 * @returns Absolute path to cache file
 */
export function getCacheFilePath(baseDir?: string): string {
  if (!baseDir) {
    // For ES modules, calculate from current file
    const currentFileUrl = import.meta.url;
    const currentFilePath = fileURLToPath(currentFileUrl);
    const currentDir = path.dirname(currentFilePath);
    baseDir = path.join(currentDir, '..', '..');
  }
  return path.join(baseDir, 'cache', 'work-items.json');
}

/**
 * Load cache data from file
 * @param cacheFilePath - Optional custom cache file path
 * @returns Parsed cache data
 * @throws Error if cache file doesn't exist
 */
export function loadCache(cacheFilePath?: string): CacheData {
  const filePath = cacheFilePath || getCacheFilePath();
  
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Cache file not found at ${filePath}. Run "npm run refresh" first.`
    );
  }
  
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Save cache data to file
 * @param data - Cache data to save
 * @param cacheFilePath - Optional custom cache file path
 */
export function saveCache(data: CacheData, cacheFilePath?: string): void {
  const filePath = cacheFilePath || getCacheFilePath();
  const cacheDir = path.dirname(filePath);
  
  // Ensure cache directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Check if cache exists
 * @param cacheFilePath - Optional custom cache file path
 * @returns True if cache file exists
 */
export function cacheExists(cacheFilePath?: string): boolean {
  const filePath = cacheFilePath || getCacheFilePath();
  return fs.existsSync(filePath);
}

/**
 * Get cache age in minutes
 * @param cacheFilePath - Optional custom cache file path
 * @returns Age in minutes, or null if cache doesn't exist
 */
export function getCacheAge(cacheFilePath?: string): number | null {
  const filePath = cacheFilePath || getCacheFilePath();
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const stats = fs.statSync(filePath);
  const ageMs = Date.now() - stats.mtime.getTime();
  return Math.floor(ageMs / 60000); // Convert to minutes
}
