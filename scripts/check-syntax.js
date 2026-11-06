const { spawnSync } = require("node:child_process");
const { readdirSync, statSync } = require("node:fs");
const { join, relative } = require("node:path");

const root = join(__dirname, "..");
const ignored = new Set(["node_modules", ".git"]);
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (entry.endsWith(".js")) files.push(full);
  }
}

walk(root);
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed = true;
    console.error(`\nErro de sintaxe em ${relative(root, file)}:`);
    console.error(result.stderr || result.stdout);
  }
}
if (failed) process.exit(1);
console.log(`Sintaxe válida em ${files.length} arquivo(s) JavaScript.`);
