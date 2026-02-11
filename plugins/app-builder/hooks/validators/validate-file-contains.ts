#!/usr/bin/env bun
/**
 * Validates that a newly created file contains required content strings.
 *
 * Hook Type: Stop
 *
 * Checks:
 * 1. Find all new/recent files in the specified directory
 * 2. Verify every file contains all required strings (case-sensitive)
 *
 * Exit codes:
 * - 0: Validation passed (file exists and contains all required strings)
 * - 1: Validation failed (file missing or missing required content)
 *
 * Usage:
 *   bun run validate_file_contains.ts -d specs -e .md --contains "## Task Description" --contains "## Objective"
 *   bun run validate_file_contains.ts --directory output --extension .json --contains '"status":'
 *   bun run validate_file_contains.ts -d specs -e .md --matches '## \d+\.\s+\w+' --contains '# Features'
 *
 * Frontmatter example:
 *   hooks:
 *     Stop:
 *       - hooks:
 *           - type: command
 *             command: "bun run $CLAUDE_PROJECT_DIR/.claude/skills/shared-scripts/validate_file_contains.ts -d specs -e .md --contains '# Features' --matches '## \\d+\\. '"
 */

import { parseArgs } from "util";
import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";
import { createLogger } from "../utils/log.ts";

const log = createLogger("validate-file-contains");

const DEFAULT_DIRECTORY = "specs";
const DEFAULT_EXTENSION = ".md";
const DEFAULT_MAX_AGE_MINUTES = 50;

const NO_FILE_ERROR = (pattern: string, directory: string) =>
  `VALIDATION FAILED: No new file found matching ${pattern}.\n\n` +
  `ACTION REQUIRED: Use the Write tool to create a new file in the ${directory}/ directory. ` +
  `The file must be created before this validation can pass. ` +
  `Do not stop until the file has been created.`;

const MISSING_CONTENT_ERROR = (file: string, count: number, missingList: string) =>
  `VALIDATION FAILED: File '${file}' is missing ${count} required section(s).\n\n` +
  `MISSING SECTIONS:\n${missingList}\n\n` +
  `ACTION REQUIRED: Use the Edit tool to add the missing sections to '${file}'. ` +
  `Each section must appear exactly as shown above (case-sensitive). ` +
  `Do not stop until all required sections are present in the file.`;

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

function findAllNewFiles(
  directory: string,
  extension: string,
  maxAgeMinutes: number
): string[] {
  const gitNew = getGitUntrackedFiles(directory, extension);
  const recentFiles = getRecentFiles(directory, extension, maxAgeMinutes);

  const allFiles = [...new Set([...gitNew, ...recentFiles])];

  log.info( `Total new/recent files found: ${allFiles.length}`);
  return allFiles;
}

function checkFileContains(
  filepath: string,
  requiredStrings: string[],
  requiredPatterns: string[]
): [boolean, string[], string[]] {
  let content: string;
  try {
    content = readFileSync(filepath, "utf-8");
  } catch (e) {
    log.error( `Failed to read file ${filepath}: ${e}`);
    return [false, [], [...requiredStrings, ...requiredPatterns.map((p) => `/${p}/`)]];
  }

  const found: string[] = [];
  const missing: string[] = [];

  for (const req of requiredStrings) {
    if (content.includes(req)) {
      found.push(req);
    } else {
      missing.push(req);
    }
  }

  for (const pattern of requiredPatterns) {
    const re = new RegExp(pattern, "m");
    const label = `/${pattern}/`;
    if (re.test(content)) {
      found.push(label);
    } else {
      missing.push(label);
    }
  }

  return [missing.length === 0, found, missing];
}

function validateFileContains(
  directory: string,
  extension: string,
  maxAgeMinutes: number,
  requiredStrings: string[],
  requiredPatterns: string[]
): [boolean, string] {
  const filePattern = `${directory}/*${extension}`;
  log.info( `Validating: directory=${directory}, extension=${extension}, max_age=${maxAgeMinutes}min`);
  log.info( `Required strings: ${JSON.stringify(requiredStrings)}`);
  log.info( `Required patterns: ${JSON.stringify(requiredPatterns)}`);

  const files = findAllNewFiles(directory, extension, maxAgeMinutes);

  if (files.length === 0) {
    const msg = NO_FILE_ERROR(filePattern, directory);
    log.warn( `FAIL: ${msg}`);
    return [false, msg];
  }

  log.info( `Checking ${files.length} file(s): ${JSON.stringify(files)}`);

  const totalChecks = requiredStrings.length + requiredPatterns.length;
  if (totalChecks === 0) {
    const msg = `${files.length} file(s) found (no content checks specified)`;
    log.info( `PASS: ${msg}`);
    return [true, msg];
  }

  const failedFiles: { file: string; missing: string[] }[] = [];

  for (const file of files) {
    const [allFound, found, missing] = checkFileContains(file, requiredStrings, requiredPatterns);

    log.info( `Content check [${file}] - Found: ${found.length}/${totalChecks}`);
    if (found.length > 0) log.info( `  Found: ${JSON.stringify(found)}`);
    if (missing.length > 0) log.warn( `  Missing: ${JSON.stringify(missing)}`);

    if (!allFound) {
      failedFiles.push({ file, missing });
    }
  }

  if (failedFiles.length === 0) {
    const msg = `All ${files.length} file(s) contain all ${totalChecks} required sections`;
    log.info( `PASS: ${msg}`);
    return [true, msg];
  } else {
    const details = failedFiles
      .map((f) => {
        const missingList = f.missing.map((m) => `  - ${m}`).join("\n");
        return MISSING_CONTENT_ERROR(f.file, f.missing.length, missingList);
      })
      .join("\n\n");
    log.warn( `FAIL: ${failedFiles.length} of ${files.length} file(s) missing required sections`);
    return [false, details];
  }
}

/**
 * Parse repeated flags manually since Node's parseArgs doesn't support
 * repeated flags natively in a clean way.
 */
function parseRepeatedFlag(argv: string[], flag: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag && i + 1 < argv.length) {
      result.push(argv[i + 1]);
      i++;
    }
  }
  return result;
}

async function main() {
  log.info( "============================================================");
  log.info( "Validator started: validate_file_contains");

  try {
    // Strip --contains and --matches flags before parseArgs (handled separately)
    const rawArgs = Bun.argv.slice(2);
    const filteredArgs: string[] = [];
    for (let i = 0; i < rawArgs.length; i++) {
      if (rawArgs[i] === "--contains" || rawArgs[i] === "--matches") {
        i++; // skip the value too
      } else {
        filteredArgs.push(rawArgs[i]);
      }
    }

    const { values } = parseArgs({
      args: filteredArgs,
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
    const requiredStrings = parseRepeatedFlag(rawArgs, "--contains");
    const requiredPatterns = parseRepeatedFlag(rawArgs, "--matches");

    log.info( `Args: directory=${directory}, extension=${extension}, max_age=${maxAge}`);
    log.info( `Required strings count: ${requiredStrings.length}`);
    log.info( `Required patterns count: ${requiredPatterns.length}`);

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

    const [success, message] = validateFileContains(directory, extension, maxAge, requiredStrings, requiredPatterns);

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
