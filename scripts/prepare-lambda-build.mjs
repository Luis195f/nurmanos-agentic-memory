import { rmSync } from "node:fs";
import { resolve } from "node:path";

const staleSourceMap = resolve("dist/lambda/index.js.map");
rmSync(staleSourceMap, { force: true });
