import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join, extname } from "path"
import { fileURLToPath } from "url"

const COLORS = [
  "violet","blue","amber","green","emerald",
  "teal","sky","rose","red","indigo",
  "purple","yellow","lime","cyan","fuchsia","pink",
]

const colorPattern = new RegExp(`-(${COLORS.join("|")})-`, "g")

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules" || name === ".next") continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, files)
    else if ([".tsx",".ts",".css"].includes(extname(name))) files.push(full)
  }
  return files
}

const root = join(process.cwd(), "src")
const files = walk(root)
let changed = 0

for (const file of files) {
  const original = readFileSync(file, "utf8")
  const updated  = original.replace(colorPattern, "-gray-")
  if (updated !== original) {
    writeFileSync(file, updated, "utf8")
    console.log("  patched:", file.replace(root + "\\", "src/").replace(root + "/", "src/"))
    changed++
  }
}

console.log(`\nDone — ${changed} file(s) updated.`)
