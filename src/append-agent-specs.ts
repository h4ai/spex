// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 SubLang International <https://sublang.ai>

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getScaffoldDir } from "./copy-templates.js";

const SECTION_HEADING = "## Specs (Source of Truth)";
const AGENT_FILES = ["CLAUDE.md", "AGENTS.md"];

/**
 * Extract the specs section from content: from the heading to the
 * next h2 heading or end of file.
 * Returns [start, end] character offsets, or null if not found.
 */
function findSection(content: string): [number, number] | null {
  const idx = content.indexOf(SECTION_HEADING);
  if (idx === -1) return null;

  // Find the next ## heading after the section heading line
  const afterHeading = idx + SECTION_HEADING.length;
  const nextH2 = content.indexOf("\n## ", afterHeading);
  const end = nextH2 === -1 ? content.length : nextH2;

  return [idx, end];
}

/**
 * Process a single agent file: replace section in place, append,
 * or create.
 *
 * Returns: "created" | "updated" | "skipped" | null (file absent)
 */
function processFile(
  filePath: string,
  specsContent: string,
  fileExists: boolean,
  shouldCreate: boolean,
): "created" | "updated" | "skipped" | null {
  if (!fileExists) {
    if (shouldCreate) {
      writeFileSync(filePath, specsContent);
      return "created";
    }
    return null;
  }

  const existing = readFileSync(filePath, "utf-8");
  const section = findSection(existing);

  if (section !== null) {
    const [start, end] = section;
    const currentSection = existing.slice(start, end);
    // Trim trailing whitespace for comparison
    if (currentSection.trimEnd() === specsContent.trimEnd()) {
      return "skipped";
    }
    const updated = existing.slice(0, start) + specsContent + existing.slice(end);
    writeFileSync(filePath, updated);
    return "updated";
  }

  // Heading absent — append
  const separator = existing.endsWith("\n") ? "\n" : "\n\n";
  writeFileSync(filePath, existing + separator + specsContent);
  return "updated";
}

/**
 * Read scaffold/agent-specs.txt and process CLAUDE.md and AGENTS.md
 * at basePath.
 *
 * SCAF-10: when neither exists, both are created; when only one
 * exists, only that file is updated. Section replacement uses
 * case-sensitive match on "## Specs (Source of Truth)".
 * SCAF-5: replace in place or skip when identical.
 */
export function appendAgentSpecs(basePath: string): void {
  const scaffoldDir = getScaffoldDir();
  const specsContent = readFileSync(
    join(scaffoldDir, "agent-specs.txt"),
    "utf-8",
  );

  const presence = AGENT_FILES.map((f) => existsSync(join(basePath, f)));
  const neitherExists = presence.every((p) => !p);

  for (let i = 0; i < AGENT_FILES.length; i++) {
    const fileName = AGENT_FILES[i];
    const filePath = join(basePath, fileName);
    const fileExists = presence[i];
    const shouldCreate = neitherExists;

    const result = processFile(filePath, specsContent, fileExists, shouldCreate);

    switch (result) {
      case "created":
        console.log(`  ${fileName} (created)`);
        break;
      case "updated":
        console.log(`  ${fileName} (updated)`);
        break;
      case "skipped":
        console.log(`  ${fileName} (skipped)`);
        break;
      case null:
        // File absent and not creating — no output
        break;
    }
  }
}
