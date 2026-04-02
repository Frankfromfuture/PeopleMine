# PeopleMine 人迈

> **Your Asset, Your Mine**  
> 把人脉变成资产 · Turn your network into an asset

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Not%20Specified-lightgrey)](#license)

PeopleMine 是一款 AI 驱动的人脉管理平台：标签化管理联系人、可视化关系状态、自动生成目标导向的人脉航程。  
PeopleMine is an AI-powered relationship management platform for tagging contacts, visualizing relationship health, and generating goal-oriented network journeys.

---

## 目录 / Table of Contents

- [✨ 产品亮点 / Highlights](#-产品亮点--highlights)
- [🖼️ 产品截图 / Screenshots](#️-产品截图--screenshots)
- [🏗️ 系统架构 / Architecture](#️-系统架构--architecture)
- [🧠 核心功能 / Core Features](#-核心功能--core-features)
- [🛠️ 技术栈 / Tech Stack](#️-技术栈--tech-stack)
- [⚡ 快速开始 / Quick Start](#-快速开始--quick-start)
- [🔐 环境变量 / Environment Variables](#-环境变量--environment-variables)
- [📡 API 示例 / API Examples](#-api-示例--api-examples)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 贡献 / Contributing](#-贡献--contributing)
- [📄 License](#-license)

---

## ✨ 产品亮点 / Highlights

### 中文
- **30 秒录入**：简易模式快速保存联系人
- **关系可视化**：能量值、温度、角色一目了然
- **AI 航程规划**：输入目标，自动生成主路径 + 备选路径
- **可行动建议**：节点级沟通建议，直接指导下一步

### English
- **30-second capture**: Quick-add mode for fast contact entry
- **Relationship visibility**: Energy, temperature, and role at a glance
- **AI route planning**: Goal input generates primary + backup paths
- **Actionable guidance**: Node-level communication recommendations

---

## 🖼️ 产品截图 / Screenshots

> 说明 / Note: 目前先放占位，后续替换为真实截图。  
> Placeholders for now. Replace with real screenshots later.

### 1) 登录页 / Login

![Login Screenshot Placeholder](./docs/screenshots/login-placeholder.png)

### 2) 仪表盘 / Dashboard

![Dashboard Screenshot Placeholder](./docs/screenshots/dashboard-placeholder.png)

### 3) 联系人管理 / Contacts

![Contacts Screenshot Placeholder](./docs/screenshots/contacts-placeholder.png)

### 4) 航程分析 / Journey

![Journey Screenshot Placeholder](./docs/screenshots/journey-placeholder.png)

> 若你还没准备图片，可先建目录：`docs/screenshots/`，后续直接替换同名文件即可。  
> If screenshots are not ready, create `docs/screenshots/` and replace files later.

---

## 🏗️ 系统架构 / Architecture

### 中文
```text
用户输入目标
   ↓
联系人数据库（标签 / 角色 / 关系链接 / 能量）
   ↓
AI 分析层（目标理解 + 节点打分 + 路径搜索）
   ↓
人脉航程输出（主路径 / 备选路径 / 节点建议）
```

### English
```text
User Goal Input
   ↓
Contact Graph (tags / roles / links / energy)
   ↓
AI Analysis (intent parsing + node scoring + pathfinding)
   ↓
Journey Output (main path / alternatives / node suggestions)
```

---

## 🧠 核心功能 / Core Features

### F1 — 人脉标签系统 / Contact Tagging

**中文**
- 三层标签：气场动物（可选）+ 关系角色（必填）+ 行业快签（AI 推荐）
- 低阻力输入，适合高频记录

**English**
- Three-layer tags: Spirit Animal (optional) + Relation Role (required) + AI quick tags
- Low-friction input for frequent usage

### F2 — 人脉数据库 / Contact Database

**中文**
- 简易模式：姓名 + 角色 + 快签
- 完整模式：公司、职位、联系方式、备注、信任度、温度
- 支持“谁认识谁”关系链接

**English**
- Simple mode: name + role + tags
- Full mode: company, title, contacts, notes, trust, temperature
- Supports relationship links (who knows whom)

### F3 — 人脉航程 / Network Journey (AI)

**中文**
- 自然语言目标输入
- AI 输出主路径、备选路径、缺失节点提示
- 节点级沟通建议

**English**
- Natural-language goal input
- AI returns primary route, alternatives, and missing-node hints
- Node-level communication suggestions

---

## 🛠️ 技术栈 / Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| ORM | Prisma 7 |
| Database | PostgreSQL (Supabase) |
| Auth | OTP + Session |
| AI | Anthropic Claude API |
| Graph UI | React Flow |

---

## ⚡ 快速开始 / Quick Start

### 1) 克隆项目 / Clone

```bash
git clone https://github.com/Frankfromfuture/PeopleMine.git
cd PeopleMine
npm install
```

### 2) 配置环境变量 / Configure `.env`

复制 `.env.example` 到 `.env` 并填写：

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

### 3) 初始化并启动 / Run

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

访问 / Open: `http://localhost:3000`

---

## 🔐 环境变量 / Environment Variables

| 变量 Variable | 中文说明 | English |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | 会话密钥 | Session secret |
| `NEXTAUTH_URL` | 应用地址 | App URL |
| `ANTHROPIC_API_KEY` | AI 分析密钥 | API key for AI journey analysis |

---

## 📡 API 示例 / API Examples

> 以下是最常用接口的请求示例。  
> Common endpoint examples below.

### 创建联系人 / Create Contact

`POST /api/contacts`

```json
{
  "name": "张三",
  "relationRole": "GATEWAY",
  "tags": ["SaaS", "VC"],
  "company": "PeopleMine",
  "title": "产品经理",
  "wechat": "zhangsan_pm"
}
```

### 获取联系人列表 / List Contacts

`GET /api/contacts`

### 提交航程目标 / Create Journey

`POST /api/journey`

```json
{
  "goal": "3个月内拿到某互联网公司产品岗内推"
}
```

---

## 🗺️ Roadmap

### 中文
- [ ] 联系人详情页体验升级
- [ ] 生产级短信服务接入
- [ ] 能量衰减定时任务
- [ ] 移动端交互优化

### English
- [ ] Enhanced contact detail experience
- [ ] Production-grade SMS provider integration
- [ ] Scheduled energy decay jobs
- [ ] Mobile UX improvements

---

## 🤝 贡献 / Contributing

欢迎提出 Issue 和 PR。  
Issues and pull requests are welcome.

建议流程 / Suggested flow:
1. Fork 仓库
2. 新建分支（`feature/xxx`）
3. 提交变更
4. 发起 PR

---

## 📄 License

当前仓库尚未声明独立许可证文件。  
No standalone license file is currently provided.
