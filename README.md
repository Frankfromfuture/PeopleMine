# PeopleMine 人迈

> **Your Asset, Your Mine**  
> 把人脉经营成可复利的人际资产

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)](https://www.postgresql.org/)
[![Status](https://img.shields.io/badge/Status-Web%20Demo%200.4-orange)](#版本信息)

PeopleMine 是一个把“联系人管理、关系洞察、目标推进、企业网络、AI 路径分析”整合到同一工作流里的 Web 产品原型。它面向学生、研究生、职场新人、创业者、BD、社群运营者等需要长期经营人脉资产的人群，试图把模糊的人脉经验变成结构化、可视化、可执行的系统。

当前仓库已经从早期概念 Demo 进化为一个包含营销官网、登录后工作台、联系人系统、企业系统、关系网络、AI 航程分析雏形与若干建设中模块的可运行版本。

---

## 快速导航

- [版本信息](#版本信息)
- [项目亮点](#项目亮点)
- [当前能力范围](#当前能力范围)
- [页面地图](#页面地图)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [数据库与 Prisma](#数据库与-prisma)
- [API 概览](#api-概览)
- [开发说明](#开发说明)
- [路线图](#路线图)
- [更新记录](#更新记录)

---

## 版本信息

- **当前版本**：`Web Demo 0.4`
- **包名**：`peoplemine`
- **仓库**：`https://github.com/Frankfromfuture/PeopleMine`
- **当前分支**：`master`
- **产品阶段**：多模块产品原型 / 持续迭代中的验证版

### 这一版意味着什么

`0.4` 不再只是一个“讲概念”的页面，而是一个已经建立起产品骨架的 Demo：

- 有营销官网与基础产品叙事
- 有登录入口与工作台导航
- 有联系人资产视图
- 有企业资产视图
- 有网络图与航程分析基础结构
- 有持续扩展中的 API 与数据模型

---

## 项目亮点

### 1. 人脉不再只是通讯录
PeopleMine 关注的不是“存电话号码”，而是把每个人放到一个可分析的关系网络中。

### 2. 从记录走向行动
系统不仅记录“你认识谁”，更想回答“你下一步应该联系谁”。

### 3. 人与企业双资产视角
除了人物标签，仓库已经发展出企业数据库与企业宇宙视图，为后续 B2B、BD、资源撮合场景做准备。

### 4. AI 航程是主线能力
围绕一个目标，系统尝试生成主路径、备选路径和节点级沟通建议，而不是停留在静态数据展示层。

### 5. 产品结构已经显性化
当前版本已具备营销站点、登录后工作区、建设中模块、数据库层与 API 层的完整雏形。

---

## 当前能力范围

### 已有模块

- 营销首页与产品介绍页
- 登录页与会话体系
- 仪表盘工作台
- 我的档案
- 新增联系人 / 编辑联系人 / 联系人详情
- 人脉数据库列表
- 企业数据库列表与企业新增流程
- 企业宇宙入口
- 人脉航程分析页
- 多个建设中的扩展模块

### 正在形成的产品方向

- 结构化人脉资产管理
- 企业资源图谱
- 目标导向的关系推进系统
- AI 辅助社交策略生成
- 关系温度与长期维护机制

---

## 页面地图

### 营销官网

- `/`：营销首页
- `/product`：产品介绍
- `/solutions`：解决方案
- `/pricing`：定价页
- `/login`：登录入口

### 登录后工作区

- `/dashboard`：仪表盘
- `/me`：我的档案
- `/contacts`：人脉数据库
- `/contacts/new`：新增联系人
- `/contacts/[id]`：联系人详情
- `/contacts/[id]/edit`：编辑联系人
- `/companies`：企业数据库
- `/companies/new`：新增企业
- `/companies/universe`：企业宇宙
- `/journey`：AI 人脉航程
- `/goal-analysis`：目标分析（建设中）
- `/relationship`：关系温度（建设中）
- `/social-advice`：社交建议（建设中）
- `/playground`：游乐场（建设中）
- `/settings`：设置（建设中）

### API 路由

- `/api/auth/*`
- `/api/me`
- `/api/contacts`
- `/api/contacts/[id]`
- `/api/contacts/generate-random`
- `/api/contacts/clear-all`
- `/api/companies`
- `/api/companies/[id]`
- `/api/companies/extract`
- `/api/company-relations`
- `/api/network`
- `/api/journey`
- `/api/dev/*`
- `/api/table-views`

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | PostgreSQL |
| ORM | Prisma 7 |
| 认证 / 会话 | NextAuth + iron-session |
| AI | Anthropic Claude / Qwen 兼容接入方向 |
| 可视化 | `@xyflow/react`, Recharts |
| 动效 | Framer Motion |

---

## 项目结构

```text
PeopleMine/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ public/
├─ scripts/
├─ src/
│  ├─ app/
│  │  ├─ (app)/
│  │  ├─ api/
│  │  ├─ login/
│  │  ├─ pricing/
│  │  ├─ product/
│  │  ├─ solutions/
│  │  ├─ page.tsx
│  │  └─ layout.tsx
│  ├─ components/
│  ├─ data/
│  ├─ lib/
│  └─ types/
├─ .env.example
├─ CHANGELOG.md
├─ package.json
└─ README.md
```

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Frankfromfuture/PeopleMine.git
cd PeopleMine
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写实际值。

### 3. 初始化 Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. 启动开发环境

```bash
npm run dev
```

打开：`http://localhost:3000`

---

## 环境变量

请参考 `.env.example`。

常用变量：

| 变量名 | 用途 |
|---|---|
| `DATABASE_URL` | PostgreSQL 数据库连接串 |
| `SESSION_SECRET` | Session 加密密钥 |
| `QWEN_API_KEY` | AI 分析调用密钥 |
| `QWEN_BASE_URL` | Qwen 兼容接口地址 |
| `ALIYUN_ACCESS_KEY_ID` | 阿里云短信 Access Key |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云短信 Secret |
| `ALIYUN_SMS_SIGN_NAME` | 短信签名 |
| `ALIYUN_SMS_TEMPLATE_CODE` | 短信模板编码 |

---

## 数据库与 Prisma

当前仓库使用 Prisma 7 管理数据库模型，已包含迁移目录与扩展中的 schema。

常用命令：

```bash
npx prisma generate
npx prisma migrate dev --name <migration-name>
npx prisma studio
```

如果修改了 `prisma/schema.prisma`，请记得重新生成客户端：

```bash
npx prisma generate
```

---

## API 概览

### 联系人
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/[id]`
- `PATCH /api/contacts/[id]`
- `DELETE /api/contacts/[id]`

### 企业
- `GET /api/companies`
- `POST /api/companies`
- `GET /api/companies/[id]`
- `PATCH /api/companies/[id]`
- `DELETE /api/companies/[id]`
- `POST /api/companies/extract`

### 网络与分析
- `GET /api/network`
- `POST /api/journey`
- `GET /api/table-views`

---

## 开发说明

### 推荐命令

```bash
npm run dev
npm run build
npm run lint
```

### 额外脚本

```bash
npm run backfill:industry
npm run backfill:industry:apply
```

### 阅读建议

如果你第一次接触这个仓库，建议按顺序阅读：

1. `README.md`
2. `CHANGELOG.md`
3. `prisma/schema.prisma`
4. `src/types/index.ts`
5. `src/app/(app)`
6. `src/app/api`

---

## 路线图

### 近期
- 补完建设中页面的真实能力
- 打磨联系人详情、编辑与检索体验
- 继续完善企业关系图谱
- 提高 AI 航程结果的解释性

### 中期
- 建立更明确的跟进 / 维护机制
- 补强关系温度演化与提醒系统
- 增加移动端可用性
- 逐步形成团队协作能力

### 长期
- 让 PeopleMine 从 Demo 进化为真正可长期使用的人脉经营产品
- 把人脉资产与职业发展、BD 推进、社群运营形成闭环

---

## 更新记录

详见 `CHANGELOG.md`。

当前重点版本：

- `0.4.0`：进入多模块产品原型阶段
- `0.1.0`：早期概念与基础工程骨架

---

## 仓库说明

当前工作区里还有一批尚未提交的功能性改动，涵盖：

- 更完整的联系人模型
- 企业系统扩展
- 多个 UI 组件与可视化组件
- 关系图 / 航程分析相关逻辑
- Prisma schema 与 migration 更新

下一步适合按“数据模型 / API / 页面 UI / 文档”分批整理提交，以便保持提交历史清晰。

---

如果你对“AI 辅助人脉经营”“关系资产系统”“目标导向型 CRM / PRM”感兴趣，欢迎关注和继续迭代这个项目。