import { readFileSync } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()

const DASHBOARD_FILES = [
  "src/app/(app)/dashboard-page.tsx",
  "src/app/(app)/dashboard/page.tsx",
  "src/app/(app)/DashboardClient.tsx",
  "src/components/DraggableCanvas.tsx",
  "src/components/RelationStrengthPanel.tsx",
  "src/components/DashboardWidgets.tsx",
  "src/components/AppSidebar.tsx",
]

const RISK_PATTERNS = [
  { name: "replacement-char", re: /\uFFFD/u },
  { name: "private-use-char", re: /[\uE000-\uF8FF]/u },
  { name: "euro-near-cjk", re: /(?:[\u4E00-\u9FFF]€|€[\u4E00-\u9FFF])/u },
]

const BAD_FRAGMENTS = [
  "鏈",
  "娴嬭瘯鏁版嵁",
  "浜鸿剦",
  "闇€瑕",
  "浣嶅緟璺熻繘",
  "涓婃鑱旂郴",
  "鍏崇郴鑳介噺",
  "鏆傛棤",
  "寰楀垎",
]

const issues = []

for (const rel of DASHBOARD_FILES) {
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
  console.error("Detected potential mojibake in dashboard files:")
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log("Dashboard encoding check passed.")
