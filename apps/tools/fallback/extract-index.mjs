// Pulls the "/tools" index page out of the Worker source so the fallback
// serves exactly the same HTML (the Worker keeps it as an inline string).
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(process.argv[2], "utf8");
const m = src.match(/const TOOLS_INDEX_HTML = `([\s\S]*?)`;\s*\n/);
if (!m) throw new Error("TOOLS_INDEX_HTML not found in " + process.argv[2]);
writeFileSync(process.argv[3], m[1]);
console.log("tools index html:", m[1].length, "bytes");
