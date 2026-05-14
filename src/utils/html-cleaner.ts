/**
 * HTML utility functions for cleaning and formatting HTML content
 */

/**
 * Clean HTML tags and decode HTML entities from text
 * @param text - Raw HTML text to clean
 * @returns Cleaned plain text
 */
export function cleanHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
