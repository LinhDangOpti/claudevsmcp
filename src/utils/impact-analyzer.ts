/**
 * Impact Analyzer - Analyzes changed files to identify affected functionalities
 * 
 * Categorizes files by type, module, and feature to determine testing scope
 * and potential business impact areas.
 */

export interface FunctionalityImpact {
  functionality: string;
  severity: 'high' | 'medium' | 'low';
  affectedFiles: string[];
  description: string;
  testingRecommendations: string[];
}

export interface FileImpactAnalysis {
  category: string;
  fileType: string;
  module: string;
  feature: string;
  impactDescription: string;
}

interface FilePattern {
  pattern: RegExp;
  category: string;
  getFeature: (path: string) => string;
  getImpact: (path: string) => string;
}

// File categorization patterns
const FILE_PATTERNS: FilePattern[] = [
  {
    pattern: /\.scss$/i,
    category: 'UI Styling',
    getFeature: (path) => {
      const match = path.match(/\/_?([a-z-]+)\.scss$/i);
      return match ? match[1].replace(/-/g, ' ') : 'Styles';
    },
    getImpact: (path) => `Visual appearance and styling of UI components`
  },
  {
    pattern: /\.cshtml$/i,
    category: 'UI Views',
    getFeature: (path) => {
      const match = path.match(/\/([A-Z][a-zA-Z]+Page)\.cshtml$/);
      return match ? match[1].replace(/Page$/, ' Page') : 'View Templates';
    },
    getImpact: (path) => `Page layout, structure, and user interface elements`
  },
  {
    pattern: /Controller\.cs$/i,
    category: 'Business Logic',
    getFeature: (path) => {
      const match = path.match(/\/([A-Z][a-zA-Z]+)Controller\.cs$/);
      return match ? `${match[1]} API` : 'Controllers';
    },
    getImpact: (path) => `API endpoints and request handling logic`
  },
  {
    pattern: /Service\.cs$/i,
    category: 'Business Logic',
    getFeature: (path) => {
      const match = path.match(/\/([A-Z][a-zA-Z]+)Service\.cs$/);
      return match ? `${match[1]} Service` : 'Services';
    },
    getImpact: (path) => `Business logic and data processing`
  },
  {
    pattern: /Repository\.cs$/i,
    category: 'Data Access',
    getFeature: (path) => {
      const match = path.match(/\/([A-Z][a-zA-Z]+)Repository\.cs$/);
      return match ? `${match[1]} Data` : 'Data Access';
    },
    getImpact: (path) => `Database queries and data persistence`
  },
  {
    pattern: /\.cs$/i,
    category: 'Backend Code',
    getFeature: (path) => {
      const match = path.match(/\/([A-Z][a-zA-Z]+)\.cs$/);
      return match ? match[1] : 'Code';
    },
    getImpact: (path) => `Backend functionality and logic`
  },
  {
    pattern: /\.(js|ts)$/i,
    category: 'Client Scripts',
    getFeature: (path) => {
      const match = path.match(/\/([a-z-]+)\.(js|ts)$/i);
      return match ? match[1].replace(/-/g, ' ') : 'JavaScript';
    },
    getImpact: (path) => `Client-side interactivity and behavior`
  },
  {
    pattern: /\.json$/i,
    category: 'Configuration',
    getFeature: (path) => 'Configuration Files',
    getImpact: (path) => `Application settings and configuration`
  }
];

/**
 * Analyze a single file to determine its impact
 */
export function analyzeFile(filePath: string): FileImpactAnalysis {
  const fileName = filePath.split('/').pop() || '';
  const fileType = fileName.split('.').pop() || 'unknown';
  
  // Find matching pattern
  for (const pattern of FILE_PATTERNS) {
    if (pattern.pattern.test(filePath)) {
      return {
        category: pattern.category,
        fileType,
        module: extractModule(filePath),
        feature: pattern.getFeature(filePath),
        impactDescription: pattern.getImpact(filePath)
      };
    }
  }
  
  // Default categorization
  return {
    category: 'Other',
    fileType,
    module: extractModule(filePath),
    feature: 'Unknown',
    impactDescription: 'File changes may affect application behavior'
  };
}

/**
 * Extract module name from file path
 */
function extractModule(filePath: string): string {
  // Try to find module from path structure
  const parts = filePath.split('/');
  
  // Look for common module indicators
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === 'Views' || part === 'Controllers' || part === 'Services' || 
        part === 'Models' || part === 'Components' || part === 'Static') {
      return part;
    }
  }
  
  // Return parent directory if available
  if (parts.length > 2) {
    return parts[parts.length - 2];
  }
  
  return 'Root';
}

/**
 * Analyze all changed files to identify functionality impacts
 */
export function analyzeFunctionalityImpact(changedFiles: string[]): FunctionalityImpact[] {
  const impacts = new Map<string, FunctionalityImpact>();
  
  // Analyze each file
  for (const filePath of changedFiles) {
    const analysis = analyzeFile(filePath);
    const key = `${analysis.category}-${analysis.feature}`;
    
    if (!impacts.has(key)) {
      // Determine severity based on category
      const severity = determineSeverity(analysis.category, changedFiles);
      
      impacts.set(key, {
        functionality: `${analysis.feature} (${analysis.category})`,
        severity,
        affectedFiles: [],
        description: analysis.impactDescription,
        testingRecommendations: getTestingRecommendations(analysis.category, analysis.feature)
      });
    }
    
    impacts.get(key)!.affectedFiles.push(filePath);
  }
  
  // Sort by severity (high → medium → low)
  return Array.from(impacts.values()).sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Determine severity based on category and number of affected files
 */
function determineSeverity(category: string, allFiles: string[]): 'high' | 'medium' | 'low' {
  const criticalCategories = ['Business Logic', 'Data Access', 'Backend Code'];
  const mediumCategories = ['UI Views', 'Client Scripts'];
  
  if (criticalCategories.includes(category)) {
    return 'high';
  }
  
  if (mediumCategories.includes(category)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Get testing recommendations based on category and feature
 */
function getTestingRecommendations(category: string, feature: string): string[] {
  const recommendations: string[] = [];
  
  switch (category) {
    case 'UI Styling':
      recommendations.push('Verify visual appearance in different browsers');
      recommendations.push('Check responsive design on mobile/tablet/desktop');
      recommendations.push('Validate dark/light theme compatibility');
      break;
      
    case 'UI Views':
      recommendations.push('Test page navigation and routing');
      recommendations.push('Verify data display and formatting');
      recommendations.push('Check user interactions and form submissions');
      break;
      
    case 'Business Logic':
      recommendations.push('Run unit tests for affected methods');
      recommendations.push('Verify business rules and validations');
      recommendations.push('Test error handling and edge cases');
      break;
      
    case 'Data Access':
      recommendations.push('Verify database queries and performance');
      recommendations.push('Test data integrity and transactions');
      recommendations.push('Check for SQL injection vulnerabilities');
      break;
      
    case 'Client Scripts':
      recommendations.push('Test JavaScript functionality in different browsers');
      recommendations.push('Verify AJAX calls and API integrations');
      recommendations.push('Check console for errors');
      break;
      
    case 'Configuration':
      recommendations.push('Verify configuration settings are applied');
      recommendations.push('Test in all environments (dev/staging/prod)');
      recommendations.push('Check backward compatibility');
      break;
      
    default:
      recommendations.push('Perform smoke testing of affected areas');
      recommendations.push('Verify no regression in related functionality');
  }
  
  // Add feature-specific recommendations
  if (feature.toLowerCase().includes('speaker')) {
    recommendations.push('Test speaker profile display and filtering');
  }
  if (feature.toLowerCase().includes('session')) {
    recommendations.push('Test session listing and details');
  }
  if (feature.toLowerCase().includes('start') || feature.toLowerCase().includes('home')) {
    recommendations.push('Test home page layout and featured content');
  }
  
  return recommendations;
}
