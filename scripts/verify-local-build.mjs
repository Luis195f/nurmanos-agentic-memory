import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "dist/frontend";
const index = readFileSync(join(root, "index.html"), "utf8");

if (!/connect-src 'self'\s*;/.test(index)) {
  throw new Error("The local production CSP must limit connections to self");
}
if (index.includes("__H1_API_CONNECT_SOURCE__")) {
  throw new Error("The CSP API placeholder was not resolved");
}
if (/style-src[^;]*'unsafe-inline'/.test(index)) {
  throw new Error("The local production CSP must not allow inline styles");
}

const files = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const target = join(directory, name);
    if (statSync(target).isDirectory()) walk(target);
    else files.push(target);
  }
}
walk(root);

const content = files.map((file) => readFileSync(file, "utf8")).join("\n");
const forbiddenDeploymentHosts = [
  /execute-api\.[a-z0-9-]+\.amazonaws\.com/i,
  /\.amplifyapp\.com/i,
  /postgres(?:ql)?:\/\//i,
  /cockroachlabs\.cloud/i,
];
if (forbiddenDeploymentHosts.some((pattern) => pattern.test(content))) {
  throw new Error(
    "The local frontend contains a configured cloud deployment host",
  );
}

console.log(
  JSON.stringify({
    filesChecked: files.length,
    cspConnectSource: "self",
    configuredCloudHosts: 0,
  }),
);
