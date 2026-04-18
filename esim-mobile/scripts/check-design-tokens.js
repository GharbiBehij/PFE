#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const scanRoots = [
  path.join(projectRoot, 'src', 'components'),
  path.join(projectRoot, 'src', 'screens'),
];

const fileExtensions = new Set(['.ts', '.tsx']);
const isStrict = process.argv.includes('--strict');

const rules = [
  {
    id: 'hex-color',
    description: 'Hardcoded hex colors are forbidden in UI files.',
    pattern: /#[0-9A-Fa-f]{3,8}\b/g,
  },
  {
    id: 'rgba-color',
    description: 'Hardcoded rgb/rgba colors are forbidden in UI files.',
    pattern: /rgba?\s*\(/g,
  },
  {
    id: 'nativebase-palette-string',
    description: 'NativeBase palette strings like "gray.200" or "primary.600" are forbidden.',
    pattern: /(["'`])(primary|secondary|gray|success|error|warning)\.\d{2,3}\1/g,
  },
  {
    id: 'legacy-flat-color-token',
    description: 'Legacy flat color tokens are forbidden (use nested tokens).',
    pattern:
      /colors\.(textPrimary|textSecondary|textTertiary|textOnPrimary|primaryBg|primaryContainer|primaryDark|secondaryDark|primary(?!\.|\[)|secondary(?!\.|\[)|error(?!\.|\[)|warning(?!\.|\[)|success(?!\.|\[))/g,
  },
];

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, acc);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!fileExtensions.has(path.extname(entry.name))) continue;
    acc.push(fullPath);
  }
}

function lineFromIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === '\n') line += 1;
  }
  return line;
}

const files = [];
for (const root of scanRoots) {
  walk(root, files);
}

const violations = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(content)) !== null) {
      violations.push({
        filePath,
        line: lineFromIndex(content, match.index),
        ruleId: rule.id,
        description: rule.description,
        snippet: match[0],
      });
    }
  }
}

if (violations.length === 0) {
  console.log('Design token check passed: no hardcoded colors or legacy token usage found.');
  process.exit(0);
}

console.log(`Design token check found ${violations.length} violation(s):`);
for (const violation of violations) {
  const relativePath = path.relative(projectRoot, violation.filePath).replace(/\\/g, '/');
  console.log(`- ${relativePath}:${violation.line} [${violation.ruleId}] ${violation.snippet}`);
}

if (isStrict) {
  process.exit(1);
}

console.log('Run with --strict to fail on violations.');
process.exit(0);
