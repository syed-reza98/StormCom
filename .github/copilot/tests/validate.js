#!/usr/bin/env node

/**
 * Comprehensive Validation Script for GitHub Copilot Customizations
 * 
 * This script validates all customization files and tests their functionality
 * for the StormCom project.
 */

const fs = require('fs');
const path = require('path');

const COPILOT_DIR = path.join(__dirname, '..');
const CHATMODES_DIR = path.join(COPILOT_DIR, 'chatmodes');
const INSTRUCTIONS_DIR = path.join(COPILOT_DIR, 'instructions');
const PROMPTS_DIR = path.join(COPILOT_DIR, 'prompts');
const COLLECTIONS_DIR = path.join(COPILOT_DIR, 'collections');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Validation functions
const validations = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function validateDirectoryStructure() {
  log('\n=== Validating Directory Structure ===', 'blue');
  
  const requiredDirs = [
    { path: CHATMODES_DIR, name: 'chatmodes' },
    { path: INSTRUCTIONS_DIR, name: 'instructions' },
    { path: PROMPTS_DIR, name: 'prompts' },
    { path: COLLECTIONS_DIR, name: 'collections' },
  ];

  requiredDirs.forEach(({ path: dirPath, name }) => {
    if (fs.existsSync(dirPath)) {
      logSuccess(`Directory '${name}' exists`);
      validations.passed++;
    } else {
      logError(`Directory '${name}' not found`);
      validations.failed++;
    }
  });
}

function validateChatModes() {
  log('\n=== Validating Chat Modes ===', 'blue');
  
  if (!fs.existsSync(CHATMODES_DIR)) {
    logError('Chat modes directory not found');
    validations.failed++;
    return;
  }

  const files = fs.readdirSync(CHATMODES_DIR).filter(f => f.endsWith('.chatmode.md'));
  logInfo(`Found ${files.length} chat mode files`);

  const expectedChatModes = [
    'expert-react-frontend-engineer.chatmode.md',
    'principal-software-engineer.chatmode.md',
    'azure-saas-architect.chatmode.md',
    'api-architect.chatmode.md',
    'playwright-tester.chatmode.md',
    'tdd-red.chatmode.md',
    'tdd-green.chatmode.md',
    'tdd-refactor.chatmode.md',
    'wg-code-sentinel.chatmode.md',
    'accessibility.chatmode.md',
    'prd.chatmode.md',
    'plan.chatmode.md',
    'mentor.chatmode.md',
    'janitor.chatmode.md',
    'gilfoyle.chatmode.md',
  ];

  expectedChatModes.forEach(expectedFile => {
    if (files.includes(expectedFile)) {
      logSuccess(`Chat mode '${expectedFile}' found`);
      validations.passed++;
      
      // Validate content
      const content = fs.readFileSync(path.join(CHATMODES_DIR, expectedFile), 'utf8');
      
      // Check for frontmatter
      if (content.startsWith('---')) {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          logSuccess(`  ├─ Has valid frontmatter`);
          validations.passed++;
        } else {
          logError(`  ├─ Invalid frontmatter format`);
          validations.failed++;
        }
      } else {
        logWarning(`  ├─ No frontmatter found (optional)`);
        validations.warnings++;
      }
      
      // Check for substantial content
      const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      if (contentWithoutFrontmatter.length > 100) {
        logSuccess(`  └─ Has substantial content (${contentWithoutFrontmatter.length} chars)`);
        validations.passed++;
      } else {
        logError(`  └─ Content too short (${contentWithoutFrontmatter.length} chars)`);
        validations.failed++;
      }
    } else {
      logError(`Chat mode '${expectedFile}' not found`);
      validations.failed++;
    }
  });
}

function validateInstructions() {
  log('\n=== Validating Instructions ===', 'blue');
  
  if (!fs.existsSync(INSTRUCTIONS_DIR)) {
    logError('Instructions directory not found');
    validations.failed++;
    return;
  }

  const files = fs.readdirSync(INSTRUCTIONS_DIR).filter(f => f.endsWith('.instructions.md'));
  logInfo(`Found ${files.length} instruction files`);

  // Validate custom StormCom instructions
  const customInstructions = [
    { file: 'prisma.instructions.md', keywords: ['multi-tenant', 'storeId', 'CUID'] },
    { file: 'vitest.instructions.md', keywords: ['AAA', 'Testing Library', 'mock'] },
    { file: 'security-best-practices.instructions.md', keywords: ['bcrypt', 'NextAuth', 'RBAC'] },
  ];

  customInstructions.forEach(({ file, keywords }) => {
    if (files.includes(file)) {
      logSuccess(`Custom instruction '${file}' found`);
      validations.passed++;
      
      const content = fs.readFileSync(path.join(INSTRUCTIONS_DIR, file), 'utf8');
      
      // Check for expected keywords
      keywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          logSuccess(`  ├─ Contains keyword '${keyword}'`);
          validations.passed++;
        } else {
          logWarning(`  ├─ Missing keyword '${keyword}'`);
          validations.warnings++;
        }
      });
      
      // Check file size
      if (content.length > 1000) {
        logSuccess(`  └─ Has substantial content (${content.length} chars)`);
        validations.passed++;
      } else {
        logError(`  └─ Content too short (${content.length} chars)`);
        validations.failed++;
      }
    } else {
      logError(`Custom instruction '${file}' not found`);
      validations.failed++;
    }
  });

  // Check for other expected instructions
  const expectedInstructions = [
    'nextjs.instructions.md',
    'typescript.instructions.md',
    'tailwind.instructions.md',
    'a11y.instructions.md',
    'playwright-typescript.instructions.md',
  ];

  expectedInstructions.forEach(file => {
    if (files.includes(file)) {
      logSuccess(`Instruction '${file}' found`);
      validations.passed++;
    } else {
      logWarning(`Instruction '${file}' not found (sourced from awesome-copilot)`);
      validations.warnings++;
    }
  });
}

function validatePrompts() {
  log('\n=== Validating Prompts ===', 'blue');
  
  if (!fs.existsSync(PROMPTS_DIR)) {
    logError('Prompts directory not found');
    validations.failed++;
    return;
  }

  const files = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.prompt.md'));
  logInfo(`Found ${files.length} prompt files`);

  const expectedPrompts = [
    'create-implementation-plan.prompt.md',
    'create-specification.prompt.md',
    'create-readme.prompt.md',
    'architecture-blueprint-generator.prompt.md',
    'playwright-typescript.prompt.md',
  ];

  expectedPrompts.forEach(file => {
    if (files.includes(file)) {
      logSuccess(`Prompt '${file}' found`);
      validations.passed++;
      
      const content = fs.readFileSync(path.join(PROMPTS_DIR, file), 'utf8');
      if (content.length > 50) {
        logSuccess(`  └─ Has content (${content.length} chars)`);
        validations.passed++;
      } else {
        logError(`  └─ Content too short`);
        validations.failed++;
      }
    } else {
      logError(`Prompt '${file}' not found`);
      validations.failed++;
    }
  });
}

function validateCollection() {
  log('\n=== Validating Collection YAML ===', 'blue');
  
  const collectionFile = path.join(COLLECTIONS_DIR, 'stormcom-development.collection.yml');
  
  if (fs.existsSync(collectionFile)) {
    logSuccess('Collection YAML file exists');
    validations.passed++;
    
    const content = fs.readFileSync(collectionFile, 'utf8');
    
    // Basic YAML validation
    if (content.includes('name:') && content.includes('items:')) {
      logSuccess('Has required fields (name, items)');
      validations.passed++;
    } else {
      logError('Missing required fields');
      validations.failed++;
    }
    
    // Check for specialization categories
    const expectedCategories = [
      'SaaS Developer',
      'Market Researcher',
      'Documentation Reviewer',
      'System Designer',
      'UI/UX Designer',
      'Q/A Specialist',
      'Security Expert',
      'DevOps Expert',
    ];
    
    expectedCategories.forEach(category => {
      if (content.includes(category)) {
        logSuccess(`  ├─ Contains category '${category}'`);
        validations.passed++;
      } else {
        logError(`  ├─ Missing category '${category}'`);
        validations.failed++;
      }
    });
  } else {
    logError('Collection YAML file not found');
    validations.failed++;
  }
}

function validateDocumentation() {
  log('\n=== Validating Documentation ===', 'blue');
  
  const docFiles = [
    { name: 'README.md', keywords: ['usage', 'installation', 'customizations'] },
    { name: 'QUICKSTART.md', keywords: ['5 minutes', 'installation', 'cp .github/copilot'] },
    { name: 'INDEX.md', keywords: ['SaaS Developer', 'Market Researcher', 'Security Expert'] },
    { name: 'SUMMARY.md', keywords: ['55 files', 'specializations', 'statistics'] },
    { name: 'STRUCTURE.md', keywords: ['directory', 'tree', 'visual guide'] },
  ];

  docFiles.forEach(({ name, keywords }) => {
    const filePath = path.join(COPILOT_DIR, name);
    if (fs.existsSync(filePath)) {
      logSuccess(`Documentation file '${name}' exists`);
      validations.passed++;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      keywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          logSuccess(`  ├─ Contains '${keyword}'`);
          validations.passed++;
        } else {
          logWarning(`  ├─ Missing '${keyword}'`);
          validations.warnings++;
        }
      });
    } else {
      logError(`Documentation file '${name}' not found`);
      validations.failed++;
    }
  });
}

function validateFileCounts() {
  log('\n=== Validating File Counts ===', 'blue');
  
  const counts = {
    chatmodes: fs.existsSync(CHATMODES_DIR) ? fs.readdirSync(CHATMODES_DIR).filter(f => f.endsWith('.chatmode.md')).length : 0,
    instructions: fs.existsSync(INSTRUCTIONS_DIR) ? fs.readdirSync(INSTRUCTIONS_DIR).filter(f => f.endsWith('.instructions.md')).length : 0,
    prompts: fs.existsSync(PROMPTS_DIR) ? fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.prompt.md')).length : 0,
  };

  const expected = {
    chatmodes: 15,
    instructions: 14,
    prompts: 19,
  };

  Object.keys(counts).forEach(type => {
    if (counts[type] === expected[type]) {
      logSuccess(`${type}: ${counts[type]}/${expected[type]} files`);
      validations.passed++;
    } else {
      logWarning(`${type}: ${counts[type]}/${expected[type]} files (expected ${expected[type]})`);
      validations.warnings++;
    }
  });
}

function printSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('VALIDATION SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  log(`\n✓ Passed: ${validations.passed}`, 'green');
  
  if (validations.warnings > 0) {
    log(`⚠ Warnings: ${validations.warnings}`, 'yellow');
  }
  
  if (validations.failed > 0) {
    log(`✗ Failed: ${validations.failed}`, 'red');
  }
  
  const total = validations.passed + validations.failed;
  const percentage = total > 0 ? ((validations.passed / total) * 100).toFixed(1) : 0;
  
  log(`\nSuccess Rate: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');
  
  if (validations.failed === 0) {
    log('\n🎉 All validations passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some validations failed. Please review the errors above.', 'red');
    process.exit(1);
  }
}

// Run all validations
function runValidations() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  GitHub Copilot Customizations Validation Suite              ║', 'cyan');
  log('║  StormCom Multi-Tenant E-Commerce SaaS Platform              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  
  validateDirectoryStructure();
  validateChatModes();
  validateInstructions();
  validatePrompts();
  validateCollection();
  validateDocumentation();
  validateFileCounts();
  
  printSummary();
}

// Execute validation
runValidations();
