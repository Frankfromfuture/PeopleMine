import { readFileSync } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()

const LANDING_FILES = ["src/app/page.tsx", "src/components/marketing-frame.tsx"]

const RISK_PATTERNS = [
  { name: "replacement-char", re: /\uFFFD/u },
  { name: "private-use-char", re: /[\uE000-\uF8FF]/u },
]

// Common mojibake fragments seen when UTF-8 Chinese is mis-decoded.
const BAD_FRAGMENTS = [
  "鎶",
  "銆佸",
  "锛岃",
  "涓€",
  "寮€濮",
  "鍥捐氨",
  "缁忚惀",
  "璺緞",
  "浜鸿剦",
  "鐞冨",
]

const issues = []

for (const rel of LANDING_FILES) {
  const abs = path.join(ROOT, rel)
  const text = readFileSync(abs, "utf8")

  for (const { name, re } of RISK_PATTERNS) {
    if (re.test(text)) {
      issues.push(`${rel}: matched ${name}`)
    }
  }

  for (const fragment of BAD_FRAGMENTS) {
    if (text.includes(fragment)) {
      issues.push(`${rel}: matched fragment "${fragment}"`)
    }
  }
}

if (issues.length) {
  console.error("Detected potential mojibake in landing files:")
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log("Landing encoding check passed.")
