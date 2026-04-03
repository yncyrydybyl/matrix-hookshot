/**
 * Validates frontmatter in all documentation pages.
 *
 * Usage: ts-node scripts/validate-frontmatter.ts
 * Exit code 0 = all valid, 1 = errors found
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const DOCS_DIR = join(__dirname, "..", "docs");

const REQUIRED_FIELDS = ["title", "description", "audience"];

const VALID_AUDIENCES = [
  "evaluator", "user", "operator", "developer", "contributor", "architect",
];

const VALID_INTEGRATIONS = [
  "github", "gitlab", "jira", "webhooks", "feeds", "figma",
  "openproject", "challengehound",
];

const VALID_STATUSES = ["current", "draft", "deprecated"];

interface FrontmatterError {
  file: string;
  error: string;
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm: Record<string, unknown> = {};
  const lines = match[1].split("\n");
  let currentKey = "";
  let inArray = false;
  const arrayValues: string[] = [];

  for (const line of lines) {
    if (line.match(/^\s+-\s+/)) {
      // Array item
      const value = line.replace(/^\s+-\s+/, "").trim();
      arrayValues.push(value);
      if (currentKey) {
        fm[currentKey] = [...arrayValues];
      }
      inArray = true;
      continue;
    }

    if (inArray && currentKey) {
      fm[currentKey] = [...arrayValues];
      arrayValues.length = 0;
      inArray = false;
    }

    const keyMatch = line.match(/^(\w+):\s*(.*)/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value && !value.startsWith("[")) {
        fm[currentKey] = value.replace(/^["']|["']$/g, "");
      } else if (value.startsWith("[")) {
        // Inline array
        fm[currentKey] = value
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
      }
    }
  }

  if (inArray && currentKey) {
    fm[currentKey] = [...arrayValues];
  }

  return fm;
}

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry.startsWith("_") || entry.startsWith(".")) continue;
    if (statSync(full).isDirectory()) {
      files.push(...findMarkdownFiles(full));
    } else if (entry.endsWith(".md") && entry !== "SUMMARY.md") {
      files.push(full);
    }
  }
  return files;
}

function validateFile(filePath: string): FrontmatterError[] {
  const errors: FrontmatterError[] = [];
  const rel = relative(DOCS_DIR, filePath);
  const content = readFileSync(filePath, "utf-8");

  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push({ file: rel, error: "Missing frontmatter (no --- block)" });
    return errors;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!fm[field]) {
      errors.push({ file: rel, error: `Missing required field: ${field}` });
    }
  }

  // Validate audience values
  const audience = fm.audience;
  if (Array.isArray(audience)) {
    for (const a of audience) {
      if (!VALID_AUDIENCES.includes(a as string)) {
        errors.push({ file: rel, error: `Invalid audience: "${a}". Valid: ${VALID_AUDIENCES.join(", ")}` });
      }
    }
  }

  // Validate integration if present
  if (fm.integration && !VALID_INTEGRATIONS.includes(fm.integration as string)) {
    errors.push({ file: rel, error: `Invalid integration: "${fm.integration}". Valid: ${VALID_INTEGRATIONS.join(", ")}` });
  }

  // Validate status if present
  if (fm.status && !VALID_STATUSES.includes(fm.status as string)) {
    errors.push({ file: rel, error: `Invalid status: "${fm.status}". Valid: ${VALID_STATUSES.join(", ")}` });
  }

  return errors;
}

// Main
const files = findMarkdownFiles(DOCS_DIR);
const allErrors: FrontmatterError[] = [];

// Only validate new doc pages (skip legacy docs/ pages without frontmatter)
const newDirs = [
  "understand", "get-started", "integrations", "architecture",
  "guides", "reference", "troubleshooting",
];

for (const file of files) {
  const rel = relative(DOCS_DIR, file);
  if (newDirs.some((d) => rel.startsWith(d + "/"))) {
    allErrors.push(...validateFile(file));
  }
}

if (allErrors.length > 0) {
  console.error(`\n❌ ${allErrors.length} frontmatter error(s) found:\n`);
  for (const err of allErrors) {
    console.error(`  ${err.file}: ${err.error}`);
  }
  process.exit(1);
} else {
  console.log(`✅ ${files.filter((f) => newDirs.some((d) => relative(DOCS_DIR, f).startsWith(d + "/"))).length} pages validated, no errors.`);
}
