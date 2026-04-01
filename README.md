# PeopleMine 人迈

> **Your Asset, Your Mine** — 游戏感 × 可视化 × AI 驱动的人脉管理工具

PeopleMine 帮助你为每个人打标签、量化关系能量，并通过 AI 规划「人脉航程」——找到连接目标的最优路径，让人脉真正成为个人资产。

---

## 三大核心功能

### F1 — 人脉标签系统

三层标签结构，渐进式输入，目标录入时间 ≤ 30 秒：

| 层级 | 内容 | 说明 |
|------|------|------|
| 第一层 | 气场动物（8 种） | 狮子 / 狐狸 / 熊 / 变色龙 / 鹰 / 海豚 / 猫头鹰 / 臭鼬 |
| 第二层 | 关系角色（6 种） | 大金主 / 传送门 / 智囊 / 温度计 / 灯塔 / 战友 |
| 第三层 | 行业快签 | AI 智能推荐，一键勾选 |

### F2 — 人脉数据库

- **简易模式**：姓名 + 角色 + 快签，30 秒完成录入
- **完整模式**：公司、职位、微信、电话、邮箱、备注、信任度、关系温度
- **能量可视化**：初次录入半透明 → 多次互动后立体清晰 → 长期不联系后自动衰减
- **关系链接**：标注联系人之间互相认识的关系，作为航程权重

### F3 — 人脉航程（AI 核心）

- 自然语言输入目标，AI 分析整个人脉库
- 生成可视化路径图：主路径 + 备选路径 + 缺失节点提示
- 点击任意节点获取个性化沟通建议
- 分步 AI 加载动画（ThinkingToast），实时展示分析进度

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript（全项目强类型） |
| 样式 | Tailwind CSS + shadcn/ui |
| ORM | Prisma 7 |
| 数据库 | PostgreSQL (Supabase) |
| 认证 | NextAuth.js v4 + @auth/prisma-adapter |
| AI | Anthropic Claude API（航程分析） |
| 可视化 | React Flow（航程路径图） |

---

## 快速开始

### 1. 克隆并安装依赖

```bash
git clone https://github.com/Frankfromfuture/PeopleMine.git
cd PeopleMine
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填写以下变量：

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...        # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

> **开发模式说明**：验证码固定为 `000000`，无需真实短信即可登录测试。

---

## 目录结构

```
src/
├── app/
│   ├── (app)/
│   │   ├── page.tsx              # 仪表盘
│   │   ├── contacts/             # 人脉数据库（列表 / 新增 / 编辑）
│   │   ├── journey/              # 人脉航程（AI 分析 + React Flow 可视化）
│   │   └── me/                   # 我的档案（AI 航程上下文）
│   └── api/
│       ├── contacts/             # GET/POST/PATCH/DELETE
│       ├── journey/              # 航程创建与历史
│       ├── me/                   # 个人档案
│       └── network/              # 人脉关系图谱
├── components/
│   ├── AppSidebar.tsx            # 深色侧边栏导航
│   ├── ThinkingToast.tsx         # AI 分步加载动画
│   └── ui/                       # shadcn/ui 基础组件
└── lib/
    ├── prisma.ts                 # Prisma Client 单例
    ├── journey/
    │   ├── prompt.ts             # Claude AI 提示词
    │   └── inferLinks.ts         # 自动推断联系人潜在关系
    └── test-data-generator.ts    # 一键生成测试数据
```

---

## 常用命令

```bash
npm run dev                              # 启动开发服务器
npx prisma migrate dev --name <名称>    # 创建数据库迁移
npx prisma studio                        # 可视化数据库管理
npx prisma generate                      # 重新生成 Prisma Client
npx shadcn@latest add <component>        # 添加 shadcn/ui 组件
```

---

## 当前版本：Web Demo 1.0

目标用户：大学生 / 研究生、职场新人（1-3 年）

**已完成功能**
- Asana 风格深色侧边栏 + 仪表盘
- 手机 OTP 登录（开发模式跳过）
- 人脉数据库：列表搜索筛选 + 新增（简易/完整模式）+ 编辑
- 我的档案：个人目标 + 自我介绍（为 AI 提供上下文）
- 人脉航程：React Flow 可视化路径 + Claude AI 分析 + 分步加载动画
- AI 潜在关系推断（inferLinks）

**待完成**
- 联系人详情页
- SMS 阿里云短信上线接入
- 能量衰减定时任务
- 移动端适配
