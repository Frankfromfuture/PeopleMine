# PeopleMine 人迈

> **Your Asset, Your Mine**  
> 把人脉经营成可复利的人际资产

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)](https://www.postgresql.org/)
[![Status](https://img.shields.io/badge/Status-Web%20Demo%200.5-orange)](#版本信息)

PeopleMine 是一个把"联系人管理、关系洞察、目标推进、企业网络、AI 路径分析"整合到同一工作流里的 Web 产品原型。它面向学生、研究生、职场新人、创业者、BD、社群运营者等需要长期经营人脉资产的人群，试图把模糊的人脉经验变成结构化、可视化、可执行的系统。

---

## 快速导航

- [版本信息](#版本信息)
- [核心功能](#核心功能)
- [页面地图](#页面地图)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [数据库与 Prisma](#数据库与-prisma)
- [API 概览](#api-概览)
- [路线图](#路线图)

---

## 版本信息

- **当前版本**：`Web Demo 0.5`
- **仓库**：`https://github.com/Frankfromfuture/PeopleMine`
- **产品阶段**：多模块可运行原型，持续迭代中

### 0.5 新增内容

- **Landing Page 全面升级**：深灰科技风官网，3D ASCII 人脉宇宙动态背景（Fibonacci 球体投影 + 星空 + 流动粒子 + 大气雾效），思源宋体 + Courier New 双轨排版
- **Dashboard 实时数据接入**：所有统计 Widget（人脉数量、高能量人脉、需维护人脉、贡献热力图、增长趋势、特征总结）均从数据库实时读取，60 秒自动刷新
- **DEV 抽屉**：Dashboard 右上角 DEV 入口，内含关系强度实验室（RelationStrengthPanel）
- **人脉 / 企业宇宙连线**：基于共属公司、行业、标签推断隐式边，区分强 / 中 / 弱三档展示
- **随机数据时间散布**：测试数据 `createdAt` 在过去一年内随机分布，贡献热力图可视化更真实
- **Logo 跳转修复**：点击工作台左上角 PEOPLEMINE 返回官网首页

---

## 核心功能

### F1 — 人脉标签系统

三层标签结构，渐进式录入：

| 层级 | 内容 | 说明 |
|---|---|---|
| 气场动物 | LION / FOX / BEAR / CHAMELEON / EAGLE / DOLPHIN / OWL / SKUNK | 可选，8 种人格气场 |
| 关系角色 | BIG_INVESTOR / GATEWAY / ADVISOR / THERMOMETER / LIGHTHOUSE / COMRADE | 必填，6 种网络角色 |
| 行业快签 | 字符串数组 | AI 推荐 + 一键勾选 |

### F2 — 人脉数据库

- **简易模式**：姓名 + 关系角色 + 行业快签，目标 ≤ 30 秒录入
- **完整模式**：公司、职位、微信、电话、邮箱、信任度、温度、备注、关系链接
- **能量追踪**：能量值随互动频率动态衰减/强化
- **企业联动**：自动从联系人提取企业，建立企业资产图谱

### F3 — 人脉航程（AI 分析）

- 自然语言输入目标，AI 分析人脉数据库
- 生成主路径 + 备选路径 + 缺失节点提示
- 人脉宇宙 / 企业宇宙可视化，节点可点击查看详情

---

## 页面地图

### 营销官网

| 路由 | 说明 |
|---|---|
| `/` | 主页（3D ASCII 宇宙背景） |
| `/product` | 产品介绍 |
| `/solutions` | 解决方案 |
| `/pricing` | 定价页 |
| `/login` | 登录入口（手机 OTP） |

### 登录后工作区

| 路由 | 说明 |
|---|---|
| `/dashboard` | 仪表盘（实时统计 + 拖拽 Widget） |
| `/me` | 我的档案 |
| `/resources` | 人脉 / 企业数据库（统一入口） |
| `/contacts/new` | 新增联系人 |
| `/contacts/[id]` | 联系人详情 |
| `/contacts/[id]/edit` | 编辑联系人 |
| `/companies/new` | 新增企业 |
| `/companies/[id]` | 企业详情 |
| `/companies/universe` | 企业宇宙 |
| `/journey` | AI 人脉航程 |
| `/goal-analysis` | 目标分析（建设中） |
| `/relationship` | 关系温度（建设中） |
| `/social-advice` | 社交建议（建设中） |
| `/settings` | 设置（建设中） |

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | Next.js 14 (App Router) |
| 语言 | TypeScript（全项目强类型） |
| 样式 | Tailwind CSS + shadcn/ui |
| 数据库 | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| 认证 / 会话 | iron-session + 手机 OTP |
| AI | Anthropic Claude API / Qwen 兼容接口 |
| 可视化 | Canvas API（ASCII 球体）、Recharts |
| 动效 | Framer Motion |

---

## 项目结构

```text
PeopleMine/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (app)/              # 登录后路由组
│  │  │  ├─ dashboard/
│  │  │  ├─ contacts/
│  │  │  ├─ companies/
│  │  │  ├─ journey/
│  │  │  ├─ resources/
│  │  │  ├─ me/
│  │  │  └─ ...
│  │  ├─ api/                # API Route Handlers
│  │  ├─ login/
│  │  ├─ pricing/
│  │  ├─ product/
│  │  ├─ solutions/
│  │  ├─ page.tsx            # 营销首页
│  │  └─ layout.tsx
│  ├─ components/
│  │  ├─ AsciiUniverseCanvas.tsx   # 3D ASCII 球体动画
│  │  ├─ DraggableCanvas.tsx       # 拖拽 Dashboard 容器
│  │  ├─ DashboardWidgets.tsx      # 统计 Widget 集合
│  │  ├─ RelationStrengthPanel.tsx # 关系强度 DEV 面板
│  │  ├─ ContributionGrid.tsx      # 贡献热力图
│  │  ├─ AppSidebar.tsx
│  │  ├─ AppTopBar.tsx
│  │  ├─ LandingNav.tsx
│  │  └─ ui/
│  ├─ lib/
│  │  ├─ db.ts
│  │  ├─ session.ts
│  │  ├─ auth.ts
│  │  ├─ company-sync.ts
│  │  ├─ industry-inference.ts
│  │  ├─ journey/
│  │  └─ dev/
│  └─ types/
│     └─ index.ts
├─ .env.example
├─ CHANGELOG.md
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

```bash
cp .env.example .env
# 填写 DATABASE_URL、SESSION_SECRET、QWEN_API_KEY 等
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. 启动开发环境

```bash
npm run dev
```

打开 `http://localhost:3000`

> **开发模式登录**：OTP 验证码固定为 `000000`，无需配置短信服务。

---

## 环境变量

参考 `.env.example`。

| 变量名 | 用途 |
|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `SESSION_SECRET` | Session 加密密钥（`openssl rand -base64 32`） |
| `QWEN_API_KEY` | AI 分析调用密钥 |
| `QWEN_BASE_URL` | Qwen 兼容接口地址 |
| `ALIYUN_ACCESS_KEY_ID` | 阿里云短信 Access Key（上线前配置） |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云短信 Secret |
| `ALIYUN_SMS_SIGN_NAME` | 短信签名 |
| `ALIYUN_SMS_TEMPLATE_CODE` | 短信模板编码 |

---

## 数据库与 Prisma

常用命令：

```bash
npx prisma generate                          # 生成 Client
npx prisma migrate dev --name <name>         # 创建并应用迁移
npx prisma studio                            # 可视化数据库浏览器
```

---

## API 概览

### 认证
- `POST /api/auth/send-otp` — 发送 OTP
- `POST /api/auth/verify-otp` — 验证 OTP / 登录
- `POST /api/auth/logout` — 退出登录
- `GET /api/auth/me` — 当前会话用户

### 联系人
- `GET/POST /api/contacts`
- `GET/PATCH/DELETE /api/contacts/[id]`
- `POST /api/contacts/generate-random` — 批量生成测试数据
- `DELETE /api/contacts/clear-all` — 清空测试数据

### 企业
- `GET/POST /api/companies`
- `GET/PATCH/DELETE /api/companies/[id]`
- `POST /api/companies/extract` — AI 提取企业信息

### 网络与分析
- `GET /api/network` — 人脉关系图（含隐式边推断）
- `GET /api/company-relations` — 企业关系图
- `POST/GET /api/journey` — 人脉航程 AI 分析
- `GET /api/dashboard/stats` — Dashboard 统计数据

### 开发工具
- `GET/POST /api/dev/relation-strength` — 关系强度公式配置
- `GET/POST /api/dev/formula` — 公式定义
- `POST /api/dev/formula-test` — 公式测试
- `GET/POST /api/dev/tags` — 标签配置

---

## 路线图

### 近期
- 补完建设中模块（关系温度、目标分析、社交建议）
- 联系人详情页打磨与检索优化
- 企业关系图谱增强

### 中期
- 跟进 / 维护提醒机制
- 移动端可用性优化
- 更完整的 AI 航程解释性

### 长期
- 从 Demo 进化为可长期使用的人脉经营产品
- 人脉资产与职业发展、BD 推进、社群运营闭环

---

详细更新记录见 `CHANGELOG.md`。
