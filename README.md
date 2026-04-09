# PeopleMine

> Your Asset, Your Mine  
> 把人脉经营成可导航的资产宇宙

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)](https://www.postgresql.org/)

PeopleMine 是一个围绕“联系人记录、关系维护、企业关联、AI 分析、可视化工作台”构建的 Next.js Web 应用。它面向需要长期经营人脉资产的人群，用更结构化的方式管理联系人、企业、关系强度与维护动作。

## 核心模块

- Landing Page：品牌首页与产品介绍
- Dashboard：可拖拽工作台、统计部件、Xminer 助手
- 人脉资产：轻量可编辑表格、筛选、分组、批量操作、保存视图
- +人脉：分步骤录入联系人信息
- 我：与“+人脉”统一风格的个人画像页
- 人脉宇宙 / 企业宇宙：网络关系可视化
- Goal Analysis：基于目标的人脉路径分析
- Settings / Dev Lab：偏好、测试工具与公式实验面板

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL
- iron-session
- OpenAI / Qwen 兼容接口
- Recharts
- Framer Motion

## 目录结构

```text
src/
  app/
    (app)/
      dashboard/
      contacts/
      companies/
      journey/
      goal-analysis/
      me/
      settings/
    api/
  components/
  lib/
  types/
prisma/
public/
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 或 `.env.local`，并至少配置：

```bash
DATABASE_URL=
SESSION_SECRET=
QWEN_API_KEY=
QWEN_BASE_URL=
```

如果要启用短信登录，还需要补充阿里云短信相关配置。

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. 启动开发环境

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 常用脚本

```bash
npm run dev
npm run lint
npm run build
npm run test
```

说明：

- `npm run lint`：执行 Next.js ESLint 检查
- `npm run build`：执行生产构建
- `npm run test`：当前用于流水线校验，等价于 `npm run lint && npm run build`

## 云效流水线 / Serverless 测试

如果你在阿里云云效流水线里需要一个非交互式校验步骤，推荐直接执行：

```bash
npm ci && npm run test
```

如果流水线环境没有使用 `npm ci`，也可以使用：

```bash
npm install && npm run test
```

当前项目的 `test` 不是 Mocha 测试命令，而是项目级校验命令：

```json
"test": "npm run lint && npm run build"
```

因此：

- 不需要给它追加 `mocha --pass-on-failing-test-suite`
- 更适合放在“自定义命令”或“构建校验”步骤中执行
- 适合在 Serverless 发布前做一次完整前置检查

## 主要页面

- `/`：Landing Page
- `/login`：登录页
- `/dashboard`：工作台
- `/contacts`：人脉资产
- `/contacts/new`：新增联系人
- `/contacts/[id]/edit`：编辑联系人
- `/companies`：企业资产
- `/companies/universe`：企业宇宙
- `/journey`：人脉宇宙
- `/goal-analysis`：目标分析
- `/me`：个人画像
- `/settings`：设置

## 主要 API

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET/POST /api/contacts`
- `GET/PATCH/DELETE /api/contacts/[id]`
- `DELETE /api/contacts/clear-all`
- `POST /api/contacts/generate-random`
- `GET/POST /api/companies`
- `GET/PATCH/DELETE /api/companies/[id]`
- `GET /api/network`
- `GET /api/dashboard/stats`
- `GET /api/qwen/status`

## 备注

- 当前项目已经包含用于流水线的 `test` 命令。
- 该命令已在本地验证通过。
- 构建阶段仍可能出现 `pg-native` 的 warning，但不会导致 `npm run test` 失败。

## 更新记录

本次 README 更新包含：

- 修复原文档乱码
- 重写项目简介与开发说明
- 增加 `test` 命令说明
- 增加阿里云云效流水线用法说明
- 明确说明当前项目的 `test` 不是 Mocha
