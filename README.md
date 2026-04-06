# PeopleMine 人迈

> **Your Asset, Your Mine**  
> 把人脉经营成可复利的人际资产

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)](https://www.postgresql.org/)
[![Status](https://img.shields.io/badge/Status-Web%20Demo%200.4-orange)](#版本信息)

PeopleMine 是一个面向学生、研究生、职场新人和资源型协作者的 AI 人脉经营系统。它把传统通讯录、关系笔记、资源台账与目标推进流程融合在一起，让“我认识谁、谁能帮我、下一步该联系谁”从模糊感觉变成可视化、可追踪、可执行的工作流。

当前仓库已经不只是最初的概念 Demo，而是一个包含营销官网、登录体系、登录后工作台、人脉数据库、企业数据库、关系图谱与 AI 航程分析雏形的可运行 Web Demo。

---

## 目录

- [版本信息](#版本信息)
- [这次更新了什么](#这次更新了什么)
- [产品定位](#产品定位)
- [核心能力总览](#核心能力总览)
- [当前页面与模块](#当前页面与模块)
- [产品方法论](#产品方法论)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [本地开发](#本地开发)
- [环境变量](#环境变量)
- [数据库与 Prisma](#数据库与-prisma)
- [API 概览](#api-概览)
- [设计与交互风格](#设计与交互风格)
- [开发说明](#开发说明)
- [后续路线图](#后续路线图)
- [仓库信息](#仓库信息)

---

## 版本信息

- **当前版本**：`Web Demo 0.4`
- **项目名称**：`peoplemine`
- **仓库地址**：`https://github.com/Frankfromfuture/PeopleMine`
- **定位阶段**：可运行产品原型 + 持续迭代中的产品验证版本

### 版本说明

`0.4` 代表项目已从“单页面概念展示”进化为“有明确产品骨架的 Demo 系统”：

- 有营销官网与产品叙事
- 有登录入口与会话体系
- 有登录后的主工作台
- 有联系人与企业两套资产视图
- 有关系网络与航程分析基础能力
- 有较完整的数据模型与 API 路由层

---

## 这次更新了什么

相比最初的 README 和早期 Demo，本次版本对应的仓库重点变化包括：

### 产品层
- 新增更完整的**营销官网**：`/`、`/product`、`/solutions`、`/pricing`
- 登录后形成独立的**工作台信息架构**
- 已具备**人脉数据库**与**企业数据库**双资产视图
- 增加**企业宇宙**、**目标分析**、**关系温度**、**社交建议**等导航骨架
- 保留“人脉航程”作为 AI 核心能力主线

### 功能层
- 联系人录入从过去的简化方案，扩展到更完整的人物标签模型
- 数据结构从“基础角色标签”扩展到包含更多维度：
  - 个人关系
  - 行业层级
  - 职位职能
  - 影响力
  - 互惠势能
  - 社交需求
  - 精神动物 / 角色原型 / 价值等级等
- 支持从联系人同步企业数据
- 增强了网络图与路径分析相关代码组织

### 工程层
- `package.json` 已更新为正式项目名 `peoplemine`
- 版本从 `0.1.0` 提升到 `0.4.0`
- Next.js 14 + Prisma 7 + PostgreSQL 的工程骨架稳定可用
- 项目文件结构已经从“试验型”走向“可持续扩展型”

---

## 产品定位

PeopleMine 的核心不是“存联系人”，而是：

> 把人脉作为资产进行结构化管理，并围绕目标生成最优行动路径。

它适合以下人群：

- **大学生 / 研究生**：沉淀导师、校友、学长学姐、实习与竞赛资源
- **职场新人**：建立可持续维护的人脉池，避免临时抱佛脚
- **创业者 / BD / 社群运营者**：围绕业务目标管理关键节点与关系链路
- **资源型个人品牌操盘者**：将分散的人际关系整理为可复用的网络资产

---

## 核心能力总览

### 1. 人物标签系统

围绕“一个人是什么样的人、能提供什么价值、与你是什么关系”建立多维标签。

当前模型已经包含：

- 基础身份信息：姓名、全名、性别、年龄、城市
- 关系信息：个人关系、朋友链接、初识时间、互惠势能
- 职业信息：公司、行业、行业 L1/L2、职位、职能、岗位层级
- 影响力与价值：影响力等级、价值等级、化学反应分、潜在合作
- 社交画像：精神动物、角色原型、社交需求、个人备注
- 联系方式：微信、电话、邮箱、地址

### 2. 人脉资产数据库

联系人列表页支持把零散的人脉沉淀为结构化资产，而不只是纯通讯录。

可承载的信息包括：

- 个人与职业标签
- 最近联系时间
- 温度 / 信任度 / 化学反应等关系指标
- 摘要与备注
- 朋友链接关系

### 3. 企业资产数据库

除了“人”，PeopleMine 还开始把“公司”纳入资产层。

已包含能力：

- 企业列表页
- 从联系人同步企业信息
- 企业行业、规模、温度、熟悉度等字段
- 企业联系人关联
- 企业宇宙可视化页面

### 4. AI 人脉航程

围绕一个自然语言目标，系统尝试回答三个问题：

1. **我应该先联系谁？**
2. **有哪些备选路径？**
3. **每一步该怎么聊？**

航程模块当前已具备：

- 读取全量网络数据
- 节点评分
- 候选路径规划
- 主路径 / 备选路径展示
- 节点级沟通建议
- 加载状态与分析过程反馈

### 5. 登录后工作台

当前工作台已经具备相对明确的产品骨架：

- 首页仪表盘
- 我的档案
- 新增人脉
- 人脉资产
- 人脉宇宙
- 企业宇宙
- 目标分析（建设中）
- 关系温度（建设中）
- 社交建议（建设中）
- 游乐场（建设中）
- 设置（建设中）

---

## 当前页面与模块

### 营销官网

- `/`：Landing Page
- `/product`：产品能力介绍
- `/solutions`：场景化解决方案
- `/pricing`：价格页
- `/login`：登录入口

### 登录后工作区

- `/dashboard`：主仪表盘
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

当前仓库中已存在多组接口：

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

## 产品方法论

PeopleMine 的方法论可以概括为 4 个词：

### 1. 低阻力录入
先把关键人记下来，再逐步补全，不强迫用户第一次就填写完所有信息。

### 2. 关系状态可视化
让“关系冷不冷”“值不值得推进”“是否适合转介绍”变成可观察信号。

### 3. 目标导向
所有联系人都不是静态名片，而是围绕目标重新组织的网络节点。

### 4. AI 辅助决策
AI 不替你社交，但帮助你减少判断成本，给出下一步建议。

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| UI | Tailwind CSS |
| 组件方案 | 自定义组件 + 部分 shadcn/ui 风格组件 |
| 数据库 | PostgreSQL |
| ORM | Prisma 7 |
| 认证/会话 | NextAuth + iron-session（项目内并存演进） |
| AI | Anthropic Claude API |
| 图谱可视化 | `@xyflow/react` |
| 动效 | Framer Motion |
| 图表 | Recharts |

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
│  │  ├─ (app)/                 # 登录后工作区
│  │  ├─ api/                   # Route Handlers
│  │  ├─ login/                 # 登录页
│  │  ├─ pricing/               # 定价页
│  │  ├─ product/               # 产品页
│  │  ├─ solutions/             # 解决方案页
│  │  ├─ page.tsx               # 营销首页
│  │  └─ layout.tsx             # 全局布局
│  ├─ components/               # UI 与业务组件
│  ├─ data/                     # 配置数据
│  ├─ lib/                      # 数据库、会话、AI、工具逻辑
│  └─ types/                    # 类型与枚举定义
├─ .env.example
├─ package.json
└─ README.md
```

---

## 本地开发

### 1. 克隆仓库

```bash
git clone https://github.com/Frankfromfuture/PeopleMine.git
cd PeopleMine
npm install
```

### 2. 配置环境变量

复制一份环境变量模板：

```bash
cp .env.example .env
```

Windows PowerShell 可手动复制，或直接在资源管理器中复制 `.env.example` 为 `.env`。

### 3. 初始化数据库

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

请参考仓库中的 `.env.example`。

常用变量包括：

| 变量名 | 说明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 数据库连接串 |
| `NEXTAUTH_SECRET` | 身份认证密钥 |
| `NEXTAUTH_URL` | 应用访问地址 |
| `ANTHROPIC_API_KEY` | 航程分析使用的 AI Key |
| `ALIYUN_SMS_ACCESS_KEY_ID` | 阿里云短信服务 Access Key |
| `ALIYUN_SMS_ACCESS_KEY_SECRET` | 阿里云短信服务 Secret |
| `ALIYUN_SMS_SIGN_NAME` | 短信签名 |
| `ALIYUN_SMS_TEMPLATE_CODE` | 短信模板编码 |

如果你只是在本地体验，至少需要先保证数据库连接可用；AI 与短信可按开发需求逐步接入。

---

## 数据库与 Prisma

仓库使用 Prisma 7 管理数据库模型，当前已包含迁移记录。

常用命令：

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio
```

如果你修改了 `prisma/schema.prisma`，通常需要重新执行：

```bash
npx prisma generate
```

---

## API 概览

### 联系人
- `GET /api/contacts`：获取联系人列表
- `POST /api/contacts`：创建联系人
- `GET /api/contacts/[id]`：获取联系人详情
- `PATCH /api/contacts/[id]`：更新联系人
- `DELETE /api/contacts/[id]`：删除联系人

### 企业
- `GET /api/companies` / `POST /api/companies`
- `GET /api/companies/[id]` / `PATCH /api/companies/[id]`
- `POST /api/companies/extract`

### 网络与航程
- `GET /api/network`：获取网络图数据
- `POST /api/journey`：根据目标生成航程分析

### 其他
- `/api/me`
- `/api/company-relations`
- `/api/dev/*`
- `/api/table-views`

---

## 设计与交互风格

当前版本的界面方向是：

- 接近工作台产品，而不是单纯工具页
- 营销官网与登录后系统风格分层明显
- 主应用区强调信息密度与操作效率
- 用较克制的灰阶、暖色强调与结构化布局表达“理性 + 关系温度”

这使得 PeopleMine 更像一个“关系经营操作系统”，而不是一个普通 CRM 表单。

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

### 开发注意

- 项目使用 TypeScript 强类型约束
- 路由基于 Next.js App Router
- 数据库访问统一经过 Prisma Client
- 建议优先阅读 `src/types`、`src/lib`、`src/app/(app)` 理解当前业务模型

---

## 后续路线图

以下是当前版本之后值得持续推进的方向：

### 近期
- 完善联系人详情与编辑体验
- 完善企业详情与企业关系网络
- 优化 AI 航程结果解释性
- 补全目标分析、关系温度、社交建议等页面能力

### 中期
- 引入更明确的任务 / 跟进机制
- 建立关系维护提醒系统
- 完善移动端交互
- 增加团队空间与协作能力

### 长期
- 把“人脉资产”与“职业发展 / 商业推进”真正连接起来
- 从 Demo 演进为具有真实用户留存能力的产品
- 建立可衡量的人脉经营数据闭环

---

## 仓库信息

- GitHub: `Frankfromfuture/PeopleMine`
- Branch: `master`

如果你正在评估这个项目，建议优先体验以下路径：

1. 打开营销首页了解产品叙事
2. 进入登录后工作台查看导航结构
3. 新增一个联系人
4. 打开联系人列表与企业列表
5. 在航程页输入目标，体验 AI 路径分析雏形

---

## 致谢

PeopleMine 仍在快速进化中。

如果你对“人脉经营产品化”“关系资产可视化”“AI 辅助社交决策”感兴趣，欢迎关注、交流或直接参与迭代。