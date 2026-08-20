import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const roots = ["dist/frontend", "dist/lambda"];
const files = [];
function walk(path) {
  for (const name of readdirSync(path)) {
    const target = join(path, name);
    if (statSync(target).isDirectory()) walk(target);
    else files.push(target);
  }
}
for (const root of roots) walk(root);

const forbiddenExtensions = new Set([
  ".map",
  ".pem",
  ".crt",
  ".key",
  ".p12",
  ".pfx",
]);
const highConfidence = [
  /AKIA[0-9A-Z]{16}/g,
  /ASIA[0-9A-Z]{16}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/gi,
];
const findings = [];

for (const file of files) {
  if (forbiddenExtensions.has(extname(file).toLowerCase())) {
    findings.push(`${relative(".", file)}: forbidden extension`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  if (
    highConfidence.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(text);
    })
  )
    findings.push(`${relative(".", file)}: high-confidence secret pattern`);
}

console.log(
  JSON.stringify({ filesChecked: files.length, findings: findings.length }),
);
if (findings.length) {
  for (const finding of findings) console.error(finding);
  process.exitCode = 1;
}
