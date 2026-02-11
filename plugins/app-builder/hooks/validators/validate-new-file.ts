#!/usr/bin/env bun
/**
 * Generic validator that checks if a new file was created in a specified directory.
 *
 * Checks:
 * 1. Git status for untracked/new files matching the pattern
 * 2. File modification time within the specified age
 *
 * Exit codes:
 * - 0: Validation passed (new file found)
 * - 1: Validation failed (no new file found)
 *
 * Usage:
 *   bun run validate_new_file.ts --directory specs --extension .md
 *   bun run validate_new_file.ts -d output -e .json --max-age 10
 */

import { parseArgs } from "util";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { createLogger } from "../utils/log.ts";

const log = createLogger("validate-new-file");

const DEFAULT_DIRECTORY = "specs";
const DEFAULT_EXTENSION = ".md";
const DEFAULT_MAX_AGE_MINUTES = 5;

const NO_FILE_ERROR = (pattern: string, directory: string) =>
  `VALIDATION FAILED: No new file found matching ${pattern}.\n\n` +
  `ACTION REQUIRED: Use the Write tool to create a new file in the ${directory}/ directory. ` +
  `The file must match the expected pattern (${pattern}). ` +
  `Do not stop until the file has been created.`;

function getGitUntrackedFiles(directory: string, extension: string): string[] {
  try {
    const result = Bun.spawnSync(["git", "status", "--porcelain", `${directory}/`], {
      timeout: 5000,
    });

    if (result.exitCode !== 0) {
      log.info( `git status returned non-zero: ${result.exitCode}`);
      return [];
    }

    const output = result.stdout.toString().trim();
    const untracked: string[] = [];

    for (const line of output.split("\n")) {
      if (!line) continue;
      const status = line.slice(0, 2);
      const filepath = line.slice(3).trim();

      if (["??", "A ", " A", "AM"].includes(status) && filepath.endsWith(extension)) {
        untracked.push(filepath);
      }
    }

    log.info( `Git untracked files: ${JSON.stringify(untracked)}`);
    return untracked;
  } catch (e) {
    log.warn( `Git command failed: ${e}`);
    return [];
  }
}

function getRecentFiles(directory: string, extension: string, maxAgeMinutes: number): string[] {
  try {
    const entries = readdirSync(directory);
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    const ext = extension.startsWith(".") ? extension : `.${extension}`;
    const recent: string[] = [];

    for (const entry of entries) {
      if (!entry.endsWith(ext)) continue;
      try {
        const filepath = join(directory, entry);
        const stat = statSync(filepath);
        if (now - stat.mtimeMs <= maxAgeMs) {
          recent.push(filepath);
        }
      } catch {
        continue;
      }
    }

    return recent;
  } catch {
    return [];
  }
}

function validateNewFile(
  directory: string,
  extension: string,
  maxAgeMinutes: number
): [boolean, string] {
  const pattern = `${directory}/*${extension}`;
  log.info( `Validating: directory=${directory}, extension=${extension}, max_age=${maxAgeMinutes}min`);

  const gitNew = getGitUntrackedFiles(directory, extension);
  log.info( `Git new files: ${JSON.stringify(gitNew)}`);

  const recentFiles = getRecentFiles(directory, extension, maxAgeMinutes);
  log.info( `Recent files: ${JSON.stringify(recentFiles)}`);

  const allFiles = [...new Set([...gitNew, ...recentFiles])];
  log.info( `Total new/recent files found: ${allFiles.length}`);

  if (allFiles.length > 0) {
    const msg = `${allFiles.length} new file(s) found: ${allFiles.join(", ")}`;
    log.info( `PASS: ${msg}`);
    return [true, msg];
  }

  const msg = NO_FILE_ERROR(pattern, directory);
  log.warn( `FAIL: ${msg}`);
  return [false, msg];
}

async function main() {
  log.info( "============================================================");
  log.info( "Validator started");

  try {
    const { values } = parseArgs({
      args: Bun.argv.slice(2),
      options: {
        directory: { type: "string", short: "d", default: DEFAULT_DIRECTORY },
        extension: { type: "string", short: "e", default: DEFAULT_EXTENSION },
        "max-age": { type: "string", default: String(DEFAULT_MAX_AGE_MINUTES) },
      },
      allowPositionals: false,
    });

    const directory = values.directory!;
    const extension = values.extension!;
    const maxAge = parseInt(values["max-age"]!, 10);

    log.info( `Args: directory=${directory}, extension=${extension}, max_age=${maxAge}`);

    // Read hook input from stdin (only when piped, not from TTY)
    if (!process.stdin.isTTY) {
      try {
        const stdinText = await Bun.stdin.text();
        if (stdinText.trim()) {
          const inputData = JSON.parse(stdinText);
          log.info( `Stdin input received: ${JSON.stringify(inputData).length} bytes`);
        }
      } catch {
        log.info( "No stdin input or invalid JSON");
      }
    }

    const [success, message] = validateNewFile(directory, extension, maxAge);

    if (success) {
      console.log(JSON.stringify({ result: "continue", message }));
      process.exit(0);
    } else {
      console.log(JSON.stringify({ result: "block", reason: message }));
      process.exit(1);
    }
  } catch (e) {
    log.error( `Validation error: ${e}`);
    console.log(
      JSON.stringify({
        result: "continue",
        message: `Validation error (allowing through): ${e}`,
      })
    );
    process.exit(0);
  }
}

main();
