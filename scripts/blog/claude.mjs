// Headless Claude Code runs for the blog (writer, reviewer, proposals, art
// director). The prompt goes through stdin (long text does not survive the
// Windows command line). Only project settings load (no personal hooks or
// plugins) and file writes are limited to `writable`; anything else is denied
// because nobody is there to approve it.
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { ROOT } from "./content.mjs";

// One command string through the shell, so npm/claude resolve to their .cmd
// shims on Windows. Arguments are fixed strings from these scripts.
// Resolves with { ok, output }; output is only collected when capture is on,
// otherwise it streams to this process (or to onOutput, line by line).
// input, when given, is written to the child's stdin.
export function run(cmd, args, { capture = false, onOutput, input } = {}) {
  return new Promise((resolve) => {
    const child = spawn([cmd, ...args].join(" "), {
      cwd: ROOT,
      shell: true,
      stdio: [input === undefined ? "ignore" : "pipe", ...(capture || onOutput ? ["pipe", "pipe"] : ["inherit", "inherit"])],
    });
    child.stdin?.end(input, "utf8");
    let output = "";
    const collect = (chunk) => {
      const text = chunk.toString();
      if (capture) output += text;
      if (onOutput) onOutput(text);
    };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
    child.on("close", (code) => resolve({ ok: code === 0, output }));
    child.on("error", () => resolve({ ok: false, output }));
  });
}

// tools: extra tools on top of reading the project. writable: glob of files
// it may create or edit (none by default).
export async function askClaude(prompt, name, { writable, tools = [], capture = false, onOutput } = {}) {
  // Copy of the last prompt per task, only to debug a bad run.
  fs.writeFileSync(path.join(ROOT, `node_modules/.blog-${name}-prompt.md`), prompt);
  const allowed = ["Read", "Glob", "Grep", ...tools, ...(writable ? [`Write(${writable})`, `Edit(${writable})`] : [])];
  return run(
    "claude",
    [
      // -p reads the prompt from stdin, not "read node_modules/<file>": that indirection
      // (with a slug like "...-fallo-critico-...-cve-...") was refused as
      // prompt injection on 2026-09-25.
      "-p",
      "--setting-sources",
      "project",
      "--allowedTools",
      `"${allowed.join(",")}"`,
      "--disallowedTools",
      '"Bash,PowerShell"',
    ],
    { capture, onOutput, input: prompt },
  );
}

// Claude's last message may wrap the JSON in prose or a code fence.
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (start < 0 || end < start) throw new Error("La respuesta de Claude no trae JSON.");
  return JSON.parse(body.slice(start, end + 1));
}
