# PeopleMine 人迈

> **Your Asset, Your Mine**

PeopleMine 是一款 AI 驱动的人脉管理工具，帮助你把“认识的人”变成“可经营、可分析、可行动”的关系资产。  
PeopleMine is an AI-powered relationship management platform that turns your network into an actionable personal asset.

---

## 目录 / Table of Contents

- [项目简介 / Overview](#项目简介--overview)
- [核心功能 / Core Features](#核心功能--core-features)
- [技术栈 / Tech Stack](#技术栈--tech-stack)
- [快速开始 / Quick Start](#快速开始--quick-start)
- [环境变量 / Environment Variables](#环境变量--environment-variables)
- [常用命令 / Commands](#常用命令--commands)
- [当前进度 / Current Status](#当前进度--current-status)
- [Roadmap](#roadmap)

---

## 项目简介 / Overview

### 中文
PeopleMine（人迈）聚焦于大学生、研究生和职场新人，核心目标是：

1. 低成本录入人脉（30 秒快速录入）
2. 可视化关系状态（能量值、温度、角色）
3. 通过 AI 生成达成目标的人脉路径（人脉航程）

### English
PeopleMine targets students, graduate students, and early-career professionals. Its goals are:

1. Fast contact capture (30-second quick add)
2. Visual relationship state tracking (energy, temperature, roles)
3. AI-generated network routes to help users reach real goals (Network Journey)

---

## 核心功能 / Core Features

### F1 — 人脉标签系统 / Contact Tagging System

**中文**
- 三层标签结构：
  - 气场动物（可选）
  - 关系角色（必填）
  - 行业快签（AI 推荐）
- 渐进式输入，降低录入阻力

**English**
- Three-layer tagging:
  - Spirit Animal (optional)
  - Relation Role (required)
  - Industry Quick Tags (AI-suggested)
- Progressive input flow for lower friction

### F2 — 人脉数据库 / Contact Database

**中文**
- 简易模式：姓名 + 关系角色 + 行业快签
- 完整模式：公司、职位、微信、电话、邮箱、备注、信任度、温度等
- 支持关系链接（谁认识谁），用于后续路径计算

**English**
- Simple mode: name + role + tags
- Full mode: company, title, WeChat, phone, email, notes, trust, temperature, etc.
- Relationship links (who knows whom) are captured for path planning

### F3 — 人脉航程 / Network Journey (AI)

**中文**
- 自然语言输入目标
- AI 分析人脉数据库并生成主路径与备选路径
- 节点级沟通建议，辅助下一步行动

**English**
- Natural-language goal input
- AI analyzes your contact graph and generates primary + backup routes
- Node-level communication suggestions for actionable follow-up

---

## 技术栈 / Tech Stack

| 层级 Layer | 技术 Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Prisma 7 |
| Database | PostgreSQL (Supabase) |
| Auth | Phone OTP + session |
| AI | Anthropic Claude API |
| Visualization | React Flow |

---

## 快速开始 / Quick Start

### 1) 克隆与安装 / Clone & Install

```bash
git clone https://github.com/Frankfromfuture/PeopleMine.git
cd PeopleMine
npm install
```

### 2) 配置环境变量 / Configure Environment

复制 `.env.example` 为 `.env` 并填写：

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

### 3) 初始化数据库并启动 / Init DB & Start

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

打开：`http://localhost:3000`

开发环境验证码（如启用 mock）：`000000`

---

## 环境变量 / Environment Variables

### 中文
- `DATABASE_URL`：PostgreSQL 连接地址
- `NEXTAUTH_SECRET`：会话密钥
- `NEXTAUTH_URL`：应用访问地址
- `ANTHROPIC_API_KEY`：用于 AI 航程分析

### English
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Session secret
- `NEXTAUTH_URL`: App URL
- `ANTHROPIC_API_KEY`: API key for journey analysis

---

## 常用命令 / Commands

```bash
# 开发
npm run dev

# 数据库迁移
npx prisma migrate dev --name <migration_name>

# 生成 Prisma Client
npx prisma generate

# 查看数据库
npx prisma studio

# 代码检查
npm run lint
```

---

## 当前进度 / Current Status

### 已完成 / Completed
- 登录与会话体系（开发模式可快速验证）
- 仪表盘与侧边导航
- 联系人管理（列表/新增/编辑）
- 公司管理与联系人关联
- 我的画像（目标与背景）
- 航程可视化与 AI 分析链路

### 待完善 / In Progress
- 部分详情页与交互优化
- 生产级短信服务接入
- 能量衰减自动任务
- 移动端体验优化

---

## Roadmap

### 中文
- 更强的人脉关系图谱推理
- 多目标航程（短期/中期/长期）
- 更丰富的建议模板与个性化策略

### English
- Smarter graph-based relationship inference
- Multi-horizon journeys (short/mid/long-term)
- Richer communication templates and personalization

---

## License

当前仓库未单独声明许可证。  
No explicit license file is currently provided in this repository.
