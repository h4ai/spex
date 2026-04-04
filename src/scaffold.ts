// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 SubLang International <https://sublang.ai>

import { appendAgentSpecs } from "./append-agent-specs.js";
import { copyTemplates } from "./copy-templates.js";
import { createSpecsStructure } from "./create-specs-structure.js";
import { resolveBase } from "./resolve-base.js";

/**
 * Entry point for the scaffold subcommand.
 * @param pathArg - Optional explicit target path
 */
export function scaffold(pathArg?: string): void {
  try {
    const basePath = resolveBase(pathArg);

    createSpecsStructure(basePath);
    copyTemplates(basePath);
    appendAgentSpecs(basePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`spex scaffold: ${msg}`);
    process.exit(1);
  }
}
