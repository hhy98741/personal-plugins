#!/usr/bin/env bun
import { realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { resolve as resolvePath } from "node:path";

// Pre-tool-use guardrail for Claude Code.
//
// Two independent, table-driven categories — extend by adding a table
// entry, not a new function:
//   1. SENSITIVE_FILE_RULES     — block Read/Edit/Write/Bash from touching
//      files that hold secrets (.env, SSH keys, cloud/registry creds, …).
//   2. SINGLE_STAGE_RULES (+ the pipe-to-shell check) — block Bash from
//      running irreversible/wide-blast-radius commands (rm -rf, git clean
//      -fdx, force pushes, find -delete, chmod -R 777, curl | sh, …).
//
// This is argv-level pattern matching on the command text, not real shell
// semantics — a guardrail against a careless agent action, not a hard
// security boundary. Variables, command substitution, and wrapper scripts
// all bypass it; that's an accepted tradeoff for staying simple and fast.

// ---------- shell parsing helpers ----------

/** Split on hard separators (; && || newline) — NOT on `|`, since pipeline
 *  stages must stay ordered for the pipe-to-shell check. */
function splitChains(command: string): string[] {
  const chains: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ";" || ch === "\n") {
      chains.push(current);
      current = "";
      continue;
    }
    if ((ch === "&" && command[i + 1] === "&") || (ch === "|" && command[i + 1] === "|")) {
      chains.push(current);
      current = "";
      i++;
      continue;
    }
    current += ch;
  }
  chains.push(current);
  return chains;
}

/** Split one chain into pipeline stages on a single `|`. */
function splitPipeline(chain: string): string[] {
  const stages: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const ch of chain) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "|") {
      stages.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  stages.push(current);
  return stages;
}

function tokenize(segment: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: string | null = null;
  let inToken = false;
  for (const ch of segment) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      inToken = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      inToken = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (inToken) tokens.push(current);
      current = "";
      inToken = false;
      continue;
    }
    current += ch;
    inToken = true;
  }
  if (inToken) tokens.push(current);
  return tokens;
}

/** Strip leading wrapper commands so checks see the real command name
 *  regardless of what launched it (e.g. `sudo rm -rf x`). */
const COMMAND_PREFIXES_TO_SKIP = new Set(["sudo", "command", "exec", "nice", "time"]);
function stripPrefixes(tokens: string[]): string[] {
  let i = 0;
  while (i < tokens.length && COMMAND_PREFIXES_TO_SKIP.has(tokens[i])) i++;
  return tokens.slice(i);
}

function isCommand(token: string | undefined, name: string): boolean {
  return token === name || token?.endsWith("/" + name) === true;
}

/** command -> chains -> pipeline stages -> tokens (prefixes stripped, empty stages dropped). */
function chainsOfStages(command: string): string[][][] {
  return splitChains(command).map((chain) =>
    splitPipeline(chain)
      .map((stage) => stripPrefixes(tokenize(stage)))
      .filter((tokens) => tokens.length > 0)
  );
}

function basenameOf(pathLike: string): string {
  return pathLike.split("/").pop() ?? "";
}

// ---------- sensitive-file access ----------

type SensitiveFileRule = {
  name: string;
  matches: (path: string) => boolean;
};

function endsWithPathSuffix(path: string, suffix: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return normalized === suffix || normalized.endsWith("/" + suffix);
}

const ENV_ALLOWED_SUFFIXES = ["example", "sample", "template"];

const SENSITIVE_FILE_RULES: SensitiveFileRule[] = [
  {
    name: "env file",
    matches: (path) => {
      const base = basenameOf(path);
      if (!/^\.env(\.[\w-]+)?$/.test(base)) return false;
      const dot = base.indexOf(".", 1);
      const suffix = dot === -1 ? "" : base.slice(dot + 1);
      return !ENV_ALLOWED_SUFFIXES.includes(suffix); // .env.example/.sample/.template are templates, not secrets
    },
  },
  {
    name: "SSH private key",
    matches: (path) => {
      const base = basenameOf(path);
      // .pub counterparts are a different basename and fall through untouched.
      return /^id_(rsa|dsa|ecdsa|ed25519)$/.test(base) || /\.(pem|p12|pfx)$/.test(base);
    },
  },
  {
    name: "AWS credentials",
    matches: (path) => endsWithPathSuffix(path, ".aws/credentials") || endsWithPathSuffix(path, ".aws/config"),
  },
  {
    name: "npm auth token (.npmrc)",
    matches: (path) => basenameOf(path) === ".npmrc",
  },
  {
    name: "PyPI auth token (.pypirc)",
    matches: (path) => basenameOf(path) === ".pypirc",
  },
  {
    name: "netrc credentials",
    matches: (path) => {
      const base = basenameOf(path);
      return base === ".netrc" || base === "_netrc";
    },
  },
];

function matchedSensitiveFile(path: string): SensitiveFileRule | null {
  for (const rule of SENSITIVE_FILE_RULES) {
    if (rule.matches(path)) return rule;
  }
  return null;
}

export function isSensitiveFileAccess(
  toolName: string,
  toolInput: Record<string, unknown>
): SensitiveFileRule | null {
  if (["Read", "Edit", "MultiEdit", "Write"].includes(toolName)) {
    const filePath = (toolInput.file_path as string) ?? "";
    const rule = matchedSensitiveFile(filePath);
    if (rule) return rule;
  }

  if (toolName === "Bash") {
    const command = (toolInput.command as string) ?? "";
    for (const stage of chainsOfStages(command).flat()) {
      for (const token of stage) {
        const candidate = token.replace(/^[<>]+/, ""); // strip a glued redirect, e.g. `>.env`
        const rule = matchedSensitiveFile(candidate);
        if (rule) return rule;
      }
    }
  }

  return null;
}

// ---------- destructive commands ----------

function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return homedir() + p.slice(1);
  return p;
}

function safeRealpath(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
}

function isPathWithin(child: string, parent: string): boolean {
  return child === parent || child.startsWith(parent.endsWith("/") ? parent : parent + "/");
}

// A safe root (project cwd, OS tmpdir) may itself be a symlink (macOS's
// /tmp -> /private/tmp is the common case) while the operand is never
// realpath'd — it may not even exist yet. Compare against both the raw
// and the resolved form so a literal "/tmp/…" argument still matches.
function rootCandidates(p: string): string[] {
  const real = safeRealpath(p);
  return real === p ? [p] : [p, real];
}

function isDangerousRmInvocation(tokens: string[], cwd: string): boolean {
  let recursive = false;
  let force = false;
  const operands: string[] = [];

  for (const token of tokens) {
    if (token === "--") continue;
    if (token.startsWith("--")) {
      if (token === "--recursive") recursive = true;
      if (token === "--force") force = true;
      continue;
    }
    if (token.startsWith("-") && token.length > 1) {
      for (const flag of token.slice(1)) {
        if (flag === "r" || flag === "R") recursive = true;
        if (flag === "f") force = true;
      }
      continue;
    }
    operands.push(token);
  }

  // Only recursive+force is "dangerous" — a bare -r still prompts per file
  // and a bare -f can't recurse, neither wipes a tree unattended.
  if (!(recursive && force)) return false;
  if (operands.length === 0) return false;

  const safeRoots = rootCandidates(cwd);
  const safeTmps = rootCandidates(tmpdir());

  for (const raw of operands) {
    if (raw.includes("$") || raw.includes("`")) return true; // unresolved var/subshell — can't verify, block

    // `rm -rf *` at the project root wipes everything in it, same as `rm -rf .`.
    const normalized = raw === "*" ? "." : raw;
    const resolved = resolvePath(cwd, expandHome(normalized));

    const rootMatch = safeRoots.find((r) => isPathWithin(resolved, r));
    if (rootMatch && resolved !== rootMatch) continue; // inside the project, not the project root itself
    if (safeTmps.some((r) => isPathWithin(resolved, r))) continue; // scratch/temp dir — fine to force-delete

    return true; // project root itself, an ancestor, home, or anywhere else unrecognized
  }

  return false;
}

/** Find `git <subcommand> …` regardless of global flags before it
 *  (`git -C path clean -fdx`), returning the args after the subcommand. */
function gitSubcommandArgs(tokens: string[], subcommand: string): string[] | null {
  if (!isCommand(tokens[0], "git")) return null;
  const idx = tokens.indexOf(subcommand, 1);
  return idx === -1 ? null : tokens.slice(idx + 1);
}

function matchesDangerousRm(tokens: string[], cwd: string): boolean {
  if (!isCommand(tokens[0], "rm")) return false;
  return isDangerousRmInvocation(tokens.slice(1), cwd);
}

function matchesDangerousGitClean(tokens: string[]): boolean {
  const args = gitSubcommandArgs(tokens, "clean");
  if (!args) return false;
  let force = false;
  let untrackedOrIgnored = false; // -d (untracked dirs) or -x/-X (ignored files) is what makes -f actually dangerous
  for (const t of args) {
    if (t === "--force") force = true;
    if (t.startsWith("-") && !t.startsWith("--")) {
      for (const c of t.slice(1)) {
        if (c === "f") force = true;
        if (c === "d" || c === "x" || c === "X") untrackedOrIgnored = true;
      }
    }
  }
  return force && untrackedOrIgnored;
}

function matchesDangerousGitPush(tokens: string[]): boolean {
  const args = gitSubcommandArgs(tokens, "push");
  if (!args) return false;
  // Deliberately not matching --force-with-lease/--force-if-includes — those
  // refuse to clobber commits the pusher hasn't seen, the plain flag doesn't.
  return args.some((t) => t === "--force" || t === "-f");
}

function matchesDangerousFind(tokens: string[]): boolean {
  if (!isCommand(tokens[0], "find")) return false;
  return tokens.some(
    (t, i) => t === "-delete" || (t === "-exec" && isCommand(tokens[i + 1], "rm"))
  );
}

function isWorldWritableSymbolicMode(token: string): boolean {
  const match = token.match(/^([ugoa]*)\+([rwx]+)$/);
  if (!match) return false;
  const [, who, perms] = match;
  if (!perms.includes("w")) return false;
  return who === "" || who.includes("o") || who.includes("a"); // no `who` = affects all classes
}

function matchesDangerousChmod(tokens: string[]): boolean {
  if (!isCommand(tokens[0], "chmod")) return false;
  let recursive = false;
  let worldWritable = false;
  for (const t of tokens.slice(1)) {
    if (t === "-R" || t === "-r" || t === "--recursive") recursive = true;
    else if (/^[0-7]{3,4}$/.test(t)) {
      if (["2", "3", "6", "7"].includes(t[t.length - 1])) worldWritable = true; // last octal digit = "other", write bit set
    } else if (isWorldWritableSymbolicMode(t)) {
      worldWritable = true;
    }
  }
  return recursive && worldWritable;
}

type SingleStageRule = {
  name: string;
  check: (tokens: string[], cwd: string) => boolean;
};

const SINGLE_STAGE_RULES: SingleStageRule[] = [
  { name: "rm -rf outside the project or temp dir", check: matchesDangerousRm },
  { name: "git clean -f combined with -d/-x (deletes untracked/ignored files)", check: matchesDangerousGitClean },
  { name: "git push --force", check: matchesDangerousGitPush },
  { name: "find ... -delete / -exec rm", check: matchesDangerousFind },
  { name: "chmod -R to a world-writable mode", check: matchesDangerousChmod },
];

function matchesPipeToShell(chain: string[][]): boolean {
  const downloaderIndex = chain.findIndex((stage) => isCommand(stage[0], "curl") || isCommand(stage[0], "wget"));
  if (downloaderIndex === -1) return false;
  return chain
    .slice(downloaderIndex + 1)
    .some((stage) => ["sh", "bash", "zsh", "dash", "ksh"].some((shell) => isCommand(stage[0], shell)));
}

export function isDangerousCommand(command: string, cwd: string): string | null {
  const chains = chainsOfStages(command);

  for (const stage of chains.flat()) {
    for (const rule of SINGLE_STAGE_RULES) {
      if (rule.check(stage, cwd)) return rule.name;
    }
  }

  for (const chain of chains) {
    if (matchesPipeToShell(chain)) return "downloaded script piped directly into a shell";
  }

  return null;
}

async function main(): Promise<void> {
  if (process.env.SKIP_HOOKS) process.exit(0);
  try {
    const input = await Bun.stdin.text();
    const inputData = JSON.parse(input);

    const toolName: string = inputData.tool_name ?? "";
    const toolInput: Record<string, unknown> = inputData.tool_input ?? {};
    const cwd: string = inputData.cwd ?? process.cwd();

    const sensitiveFileRule = isSensitiveFileAccess(toolName, toolInput);
    if (sensitiveFileRule) {
      process.stderr.write(`BLOCKED: Access to a file matching "${sensitiveFileRule.name}" is prohibited\n`);
      process.stderr.write(
        "If this is a safe template, name it with an allowed suffix (.example/.sample/.template) or add an exception to SENSITIVE_FILE_RULES\n"
      );
      process.exit(2);
    }

    if (toolName === "Bash") {
      const command = (toolInput.command as string) ?? "";
      const destructiveRule = isDangerousCommand(command, cwd);
      if (destructiveRule) {
        process.stderr.write(`BLOCKED: Dangerous command detected (${destructiveRule})\n`);
        process.exit(2);
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

// Only run when executed directly (as the hook), not when imported by tests.
if (import.meta.main) {
  main();
}
