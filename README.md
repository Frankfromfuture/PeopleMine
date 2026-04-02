# PeopleMine 人迈

> **Your Asset, Your Mine**

中文 / English 双语说明：PeopleMine 是一款 AI 驱动的人脉管理工具，帮助你用标签化方式管理联系人、可视化关系能量，并生成目标导向的人脉航程。

Bilingual README: PeopleMine is an AI-powered relationship management platform for tagging contacts, visualizing relationship energy, and generating goal-oriented network journeys.

---

## 三大核心功能 / Three Core Features

### F1 — 人脉标签系统 / Network Tag System

Three-layer tagging, progressive input, target entry time ≤ 30 seconds:

| Layer | Content | Examples |
|-------|---------|---------|
| Layer 1 | Aura Animals (8 types) | Lion / Fox / Bear / Chameleon / Eagle / Dolphin / Owl / Skunk |
| Layer 2 | Relation Roles (6 types) | Big Investor / Gateway / Advisor / Thermometer / Lighthouse / Comrade |
| Layer 3 | Industry Quick Tags | AI-recommended, one-tap selection |

### F2 — 人脉数据库 / Contact Database

- **Simple mode**: Name + Role + Tags, done in 30 seconds
- **Full mode**: Company, title, WeChat, phone, email, notes, trust level, relationship temperature
- **Energy visualization**: Semi-transparent on first entry → 3D clarity after interactions → auto-decay if no contact
- **Relationship links**: Map who knows who, used as journey path weights

### F3 — 人脉航程 / Network Journey (AI Core)

- Natural language goal input, AI analyzes your entire network
- Visual path map: main path + backup paths + missing node alerts
- Click any node for personalized communication suggestions
- Step-by-step AI loading animation (ThinkingToast) shows analysis progress

---

## 🎨 Design Language

> For UI generation reference (Google Stitch / Figma / etc.)

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Background (dark) | `#020617` (slate-950) | Login page, landing hero |
| Surface (card) | `#0f172a` (slate-900) | Login card, modals |
| Surface (light) | `#f8fafc` (slate-50) | App sidebar, dashboard |
| Primary accent | `#2563eb` (blue-600) | CTA buttons, active nav |
| Primary hover | `#1d4ed8` (blue-700) | Button hover state |
| Text primary | `#ffffff` | Dark background headings |
| Text secondary | `#94a3b8` (slate-400) | Subtitles, placeholders |
| Text dark | `#0f172a` (slate-900) | Light background body |
| Border | `#1e293b` (slate-800) | Card borders, dividers |
| Error | `#ef4444` (red-500) | Validation messages |
| Role: BIG_INVESTOR | `#fef3c7` / `#92400e` | Amber badge |
| Role: GATEWAY | `#dbeafe` / `#1e40af` | Blue badge |
| Role: ADVISOR | `#ede9fe` / `#5b21b6` | Violet badge |
| Role: THERMOMETER | `#ffe4e6` / `#9f1239` | Rose badge |
| Role: LIGHTHOUSE | `#ffedd5` / `#9a3412` | Orange badge |
| Role: COMRADE | `#dcfce7` / `#14532d` | Green badge |

### Typography
- **Font family**: System sans-serif — `Segoe UI` (Windows), `PingFang SC` / `Microsoft YaHei` (Chinese), `Helvetica Neue` (Mac)
- **Hero headline**: 48–56px, font-bold, white
- **Section heading**: 24–30px, font-semibold
- **Body**: 14–16px, font-normal
- **Label / caption**: 12px, uppercase, letter-spacing

### Visual Style
- Dark tech-grid background on landing & login (CSS: `background-image: repeating-linear-gradient` grid pattern)
- Light sidebar + white card panels in main app
- Rounded corners: `rounded-xl` (16px) for cards, `rounded-lg` (12px) for inputs
- Shadows: `shadow-xl` for elevated cards
- Transition: `150ms ease` for sidebar, `200ms ease` for buttons
- Chinese UI primary, English secondary; emoji accents throughout

---

## 📄 Page Spec: Landing / Index Page

> Route: `/` (unauthenticated) → redirect to `/login`

### Layout
Full-width, single-page, dark theme (`bg-slate-950`).

### Hero Section
```
Background: bg-slate-950 + subtle tech-grid overlay (CSS grid lines, opacity 0.05)

[Top nav]
  Left: "人迈 PeopleMine" logo (white, font-bold)
  Right: "登录" text link (slate-400) + "立即开始" button (blue-600, rounded-lg)

[Hero content — centered, padding-top: 120px]
  Eyebrow tag: "Web Demo 1.0" (blue-600 bg, white text, small pill badge)
  H1: "把人脉变成资产" (white, 56px, font-bold)
  H2: "Turn your network into your greatest asset" (slate-400, 20px)
  Body: "AI 驱动的人脉标签与路径规划工具，为大学生和职场新人设计" (slate-400, 16px)
  CTA: "立即开始 →" (blue-600 button, large, rounded-xl) → links to /login
  Secondary: "了解产品功能" (underline text link, slate-400) → scrolls down
```

### Stats Bar
```
3-column flex row, centered, padding: 40px 0
Border-top + border-bottom: slate-800

  Col 1: "6" (white, 40px, bold) + "种关系角色" (slate-400, 14px)
  Col 2: "8" (white, 40px, bold) + "种气场动物" (slate-400, 14px)
  Col 3: "AI" (blue-400, 40px, bold) + "驱动路径分析" (slate-400, 14px)
```

### Feature Cards Section
```
Section heading: "三大核心功能" (white, 30px, centered)
Subheading: "从录入到分析，全流程覆盖你的人脉管理需求" (slate-400, centered)

3-column grid, gap-6, max-width: 1100px, margin: auto

Card style: bg-slate-900, border border-slate-800, rounded-xl, padding-8, hover: border-blue-600/50

  Card 1 — F1 人脉标签
    Icon: 🏷️ (40px)
    Title: "人脉标签系统" (white, 20px, font-semibold)
    Body: "三层标签结构：气场动物 × 关系角色 × 行业快签，30 秒完成录入，AI 智能推荐快签。"
    Footer tag: "≤ 30秒录入" (blue-600/20 bg, blue-400 text, small pill)

  Card 2 — F2 人脉数据库
    Icon: 🗂️ (40px)
    Title: "人脉数据库" (white, 20px, font-semibold)
    Body: "简易模式快速录入，完整模式详细档案，能量值实时反映关系健康度，支持关系链接。"
    Footer tag: "能量可视化" (blue-600/20 bg, blue-400 text, small pill)

  Card 3 — F3 人脉航程
    Icon: 🗺️ (40px)
    Title: "人脉航程 AI" (white, 20px, font-semibold)
    Body: "输入目标，AI 分析人脉库，生成最优路径图，点击节点获取个性化沟通建议。"
    Footer tag: "Claude AI 驱动" (blue-600/20 bg, blue-400 text, small pill)
```

### Footer
```
Border-top: slate-800
Text: "PeopleMine 人迈 · Your Asset, Your Mine" (slate-500, centered, 14px)
Sub: "Web Demo 1.0 · Built with Next.js + Claude API" (slate-600, centered, 12px)
```

---

## 📄 Page Spec: Login Page

> Route: `/login`

### Layout
Centered card on full-screen dark background. No sidebar, no topbar.

```
Background: bg-slate-950 + tech-grid overlay (same as landing)
  Vertically + horizontally centered (min-h-screen flex items-center justify-center)
```

### Brand Header (above card)
```
  Logo: "人迈" (white, 32px, font-bold, centered)
  Tagline: "Your Asset, Your Mine" (slate-400, 14px, centered)
  Margin-bottom: 32px
```

### Login Card
```
Width: 400px (max-w-sm on mobile)
Style: bg-slate-900, border border-slate-800, rounded-xl, shadow-xl, padding: 32px
```

#### Step 1 — Phone Number Input
```
[Inside card]
  Title: "登录 / 注册" (white, 20px, font-semibold)
  Subtitle: "输入手机号，我们将发送验证码" (slate-400, 14px)
  Margin-bottom: 24px

  Label: "手机号码" (slate-300, 14px, font-medium)
  Input row (flex):
    Prefix box: "+86" (bg-slate-800, border border-slate-700, text-slate-300, padding: 10px 12px, rounded-l-lg, non-editable)
    Input field: placeholder="请输入 11 位手机号" (bg-slate-800, border border-slate-700, text-white, rounded-r-lg, flex-1)

  Button: "发送验证码" (blue-600 bg, white text, full-width, rounded-lg, height: 44px)
    Disabled state: opacity-50, cursor-not-allowed (until 11 digits entered)
    Loading state: spinner icon + "发送中..."

  Error message (conditional): "手机号格式不正确" (red-400, 13px, margin-top: 8px)
```

#### Step 2 — OTP Verification (shown after phone submitted)
```
[Replaces Step 1 content, or shown below]
  Title: "输入验证码" (white, 20px, font-semibold)
  Subtitle: "验证码已发送至 +86 138****8000" (slate-400, 14px)
  Margin-bottom: 24px

  Label: "验证码" (slate-300, 14px, font-medium)
  Input: placeholder="请输入 6 位验证码" (bg-slate-800, border border-slate-700, text-white, rounded-lg, full-width, text-center, letter-spacing: 0.3em, font-mono)

  Button: "验证登录" (blue-600 bg, white text, full-width, rounded-lg, height: 44px)
    Loading state: spinner + "验证中..."

  Secondary link: "重新发送 (59s)" (slate-400, 14px, centered, underline)
    After countdown: becomes "重新发送" (blue-400, clickable)

  Error message (conditional): "验证码错误，请重试" (red-400, 13px)
```

#### Dev Mode Notice (development only)
```
  Divider line (slate-800)
  Note: "开发模式：验证码固定为 000000" (slate-600, 12px, centered)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Prisma 7 |
| Database | PostgreSQL (Supabase) |
| Auth | iron-session + Phone OTP |
| AI | Anthropic Claude API |
| Visualization | React Flow |

---

## Quick Start

```bash
git clone https://github.com/Frankfromfuture/PeopleMine.git
cd PeopleMine
npm install
```

Copy `.env.example` → `.env` and fill in:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...        # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
# → http://localhost:3000
# Dev mode OTP: 000000
```

---

## Current Version: Web Demo 1.0

**Target users**: University/graduate students, early-career professionals (1–3 years)

**Completed**
- Dark sidebar + dashboard (Asana-style)
- Phone OTP login (dev mode: skip SMS)
- Contact database: search / filter / add (simple + full mode) / edit
- Company database: create / link to contacts
- My Profile: personal goals + bio for AI context
- Network Journey: React Flow visualization + Claude AI analysis + ThinkingToast loading
- AI relationship inference (inferLinks)
- Developer Lab: tag editor, formula editor, company test panel

**Pending**
- Contact detail page
- Aliyun SMS integration (production)
- Energy decay scheduled tasks
- Mobile adaptation
