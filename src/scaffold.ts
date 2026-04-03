// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 SubLang International <https://sublang.ai>

import { resolveBase } from "./resolve-base.js";

/**
 * Entry point for the scaffold subcommand.
 * @param pathArg - Optional explicit target path
 */
export function scaffold(pathArg?: string): void {
  const basePath = resolveBase(pathArg);

  // Task 4: createSpecsStructure()
  // Task 5: copyTemplates()
  // Task 6: appendAgentSpecs()

  console.error("scaffold: not yet fully implemented");
  process.exit(1);
}
