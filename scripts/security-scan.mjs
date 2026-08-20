import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const patterns = [
  /AKIA[0-9A-Z]{16}/g,
  /ASIA[0-9A-Z]{16}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /gh[pousr]_[A-Za-z0-9_]{30,}/g,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/gi,
  /(?:api[_-]?key|secret[_-]?key|access[_-]?token|password)\s*[:=]\s*["'][^"'\s]{16,}["']/gi,
];

function matches(text) {
  return patterns.reduce((count, pattern) => {
    pattern.lastIndex = 0;
    return count + [...text.matchAll(pattern)].length;
  }, 0);
}

const tracked = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
const untracked = execFileSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "-z"],
  {
    encoding: "utf8",
  },
)
  .split("\0")
  .filter(Boolean);

let workingTreeMatches = 0;
for (const file of new Set([...tracked, ...untracked])) {
  try {
    workingTreeMatches += matches(readFileSync(file, "utf8"));
  } catch {
    // Binary, deleted, and concurrently changing files are intentionally skipped.
  }
}

let historyMatches = 0;
for (const commit of execFileSync("git", ["rev-list", "--all"], {
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)) {
  const files = execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", "-z", commit],
    {
      encoding: "utf8",
    },
  )
    .split("\0")
    .filter(Boolean);
  for (const file of files) {
    try {
      historyMatches += matches(
        execFileSync("git", ["show", `${commit}:${file}`], {
          encoding: "utf8",
          maxBuffer: 10 * 1024 * 1024,
          stdio: ["ignore", "pipe", "ignore"],
        }),
      );
    } catch {
      // Ignore binary and oversized historical blobs without exposing their content.
    }
  }
}

console.log(JSON.stringify({ workingTreeMatches, historyMatches }));
if (workingTreeMatches > 0 || historyMatches > 0) process.exitCode = 1;
