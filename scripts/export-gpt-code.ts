#!/usr/bin/env ts-node

/**
 * AGI-CAD CODE EXPORTER
 * ----------------------
 * Walks key AGI-CAD directories and exports all GPT-generated core code
 * into a single markdown archive.
 *
 * Usage:
 *   tsx scripts/export-gpt-code.ts
 */

import fs from "fs";
import path from "path";
import { promisify } from "util";

const readDir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// -------------------------------------
// CONFIG
// -------------------------------------

const ROOT_DIRS = ["src", "app", "docs", "vault"];

const OUTPUT_PATH = path.join(
  "docs",
  "ai-archives",
  "gpt",
  "allcodebygpt-agi-cad-code.md"
);

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  ".git",
  ".turbo",
  ".vscode"
]);

// Only include files whose paths contain *any* of these keywords:
const AGI_CAD_KEYWORDS = [
  "router",
  "governor",
  "meta",
  "learning",
  "labs",
  "agents"
];

// -------------------------------------
// UTILITY
// -------------------------------------

function shouldIncludeFile(filePath: string): boolean {
  return AGI_CAD_KEYWORDS.some((kw) => filePath.includes(kw));
}

function shouldSkipDir(dirName: string): boolean {
  return SKIP_DIRS.has(dirName.toLowerCase());
}

// Recursively walk the filesystem:
async function walk(dir: string): Promise<string[]> {
  const items = await readDir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const item of items) {
    const itemPath = path.join(dir, item.name);

    // Skip ignored directories:
    if (item.isDirectory()) {
      if (shouldSkipDir(item.name)) continue;
      files.push(...(await walk(itemPath)));
    } else {
      // Include only core AGI-CAD files:
      if (shouldIncludeFile(itemPath)) {
        files.push(itemPath);
      }
    }
  }

  return files;
}

// Format file metadata:
async function buildFileSection(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf8");
  const stats = await stat(filePath);
  const lines = content.split("\n").length;
  const modified = stats.mtime.toISOString();

  const relative = filePath.replace(process.cwd() + path.sep, "");

  return [
    `## ${relative}`,
    ``,
    `**Path**: \`${relative}\``,
    `**Lines**: ${lines}`,
    `**Last Modified**: ${modified}`,
    ``,
    "```",
    content,
    "```",
    "",
    "---",
    ""
  ].join("\n");
}

// -------------------------------------
// MAIN
// -------------------------------------

async function main() {
  console.log("AGI-CAD Exporter: scanning project…");

  const collectedFiles: string[] = [];

  for (const root of ROOT_DIRS) {
    const rootPath = path.join(process.cwd(), root);
    if (fs.existsSync(rootPath)) {
      console.log(`Walking: ${rootPath}`);
      collectedFiles.push(...(await walk(rootPath)));
    }
  }

  collectedFiles.sort();

  console.log(`Total files included: ${collectedFiles.length}`);

  // Build sections
  const sections: string[] = [];
  for (const file of collectedFiles) {
    sections.push(await buildFileSection(file));
  }

  // Build Table of Contents
  const toc = [
    "# AGI-CAD Code Archive",
    "",
    "## Table of Contents",
    "",
    ...collectedFiles.map((f) => {
      const rel = f.replace(process.cwd() + path.sep, "");
      const anchor = rel
        .toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `- [${rel}](#${anchor})`;
    }),
    "",
    "---",
    ""
  ].join("\n");

  // Ensure output dir exists
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  // Write final markdown
  fs.writeFileSync(OUTPUT_PATH, toc + sections.join("\n"), "utf8");

  console.log(`\n✔ Export complete!`);
  console.log(`→ ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ Export failed:", err);
  process.exit(1);
});