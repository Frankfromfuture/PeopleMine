# PeopleMine 人迈 — 人脉管理工具

> Your Asset, Your Mine

## 产品简介

PeopleMine 是一款以**游戏感、可视化与便捷性**为核心的人脉记录平台。
为「人」打各种标签，让 AI 分析标签背后的链接关系，制定「人脉航程」的最优路径，
让人脉成为个人资产。

当前版本：**Web Demo 1.0**，目标用户为大学生/研究生、职场新人（1-3 年）。

---

## 三大核心功能

### F1 — 人脉标签系统（灵魂功能）

三层标签结构，渐进式输入，降低录入抗性：

**第一层：气场动物标签（可选，8 种）**

| 枚举值      | 中文名  | 气场特征            |
|-------------|---------|---------------------|
| LION        | 狮子    | 强势、权威、领袖型   |
| FOX         | 狐狸    | 精明、圆滑、策略型   |
| BEAR        | 熊      | 稳重、可靠、信赖型   |
| CHAMELEON   | 变色龙  | 适应力强、多面型     |
| EAGLE       | 鹰      | 敏锐、远见、判断力强  |
| DOLPHIN     | 海豚    | 亲和、感染力、社交型  |
| OWL         | 猫头鹰  | 深沉、安静、知识型   |
| SKUNK       | 臭鼬    | 古怪、独特、反常规   |

> Demo 1.0：气场动物可跳过，不纳入航程权重计算。

**第二层：关系角色标签（必填，6 种）**

| 枚举值       | 中文名  | 含义                     | 航程作用       |
|--------------|---------|--------------------------|----------------|
| BIG_INVESTOR | 大金主  | 能直接带来业务/资源       | 核心目标节点   |
| GATEWAY      | 传送门  | 认识很多人，能引荐你      | 关键路径中转站 |
| ADVISOR      | 智囊    | 给你提供行业洞察与建议    | 决策支撑节点   |
| THERMOMETER  | 温度计  | 情感支持、社交润滑剂      | 关系维护节点   |
| LIGHTHOUSE   | 灯塔    | 行业大佬，可仰望但难接近  | 远期目标节点   |
| COMRADE      | 战友    | 能并肩作战的伙伴          | 协作节点       |

**第三层：行业快签（AI 智能推荐，字符串数组）**

根据用户所在行业自动推荐，一键勾选，无需手动输入。

---

### F2 — 人脉数据库（最核心功能）

- **简易模式**：姓名 + 关系角色 + 行业快签，目标录入时间 ≤ 30 秒
- **完整模式**：公司、职位、微信、电话、邮箱、额外加分标签、关系链接、备注
- **能量可视化**：初次录入半透明 → 多次互动后清晰立体 → 长期不联系后衰减
- **关系链接**：标注联系人之间互相认识的关系，作为航程分析权重

---

### F3 — 人脉航程（AI 核心分析工具）

- **AI 对话分析**：自然语言输入目标，AI 分析人脉数据库
- **航程主路径规划**：生成可视化路径图，主推最佳路径 + 备选路径 + 缺失节点提示
- **节点相处建议**：点击任一人物节点，获取个性化沟通建议

**航程权重参数（Demo 1.0）**：能量值、关系角色、关系链接、行业位置、置信度
（气场动物不纳入 Demo 1.0 权重）

---

## 技术栈

| 层次   | 技术                                      |
|--------|-------------------------------------------|
| 框架   | Next.js 14 (App Router)                   |
| 语言   | TypeScript（全项目强类型）                 |
| 样式   | Tailwind CSS + shadcn/ui                  |
| ORM    | Prisma 7                                  |
| 数据库 | PostgreSQL (Supabase)                     |
| 认证   | NextAuth.js v4 + @auth/prisma-adapter     |
| AI     | Anthropic Claude API（航程分析）           |

---

## 目录结构

```
src/
  app/
    layout.tsx                      # 全局布局
    page.tsx                        # 首页/仪表盘
    onboarding/page.tsx             # 新用户引导（4 步）
    contacts/page.tsx               # 人脉数据库列表
    contacts/new/page.tsx           # 新增联系人（简易模式）
    contacts/[id]/page.tsx          # 联系人详情
    contacts/[id]/edit/page.tsx     # 编辑联系人（完整模式）
    journey/page.tsx                # 人脉航程（AI 分析）
    api/contacts/route.ts           # GET 列表 / POST 创建
    api/contacts/[id]/route.ts      # GET / PATCH / DELETE 单个
    api/journey/route.ts            # POST 创建航程 / GET 历史
    api/auth/[...nextauth]/route.ts # NextAuth 处理器
  components/
    ContactCard.tsx                 # 人物卡片组件
    SpiritAnimalBadge.tsx           # 气场动物徽章
    RoleTag.tsx                     # 关系角色标签
    EnergyBar.tsx                   # 能量条可视化
    QuickAddForm.tsx                # 快速录入表单
    ui/                             # shadcn/ui 基础组件
  lib/
    prisma.ts                       # Prisma Client 单例（注意：不是 db.ts）
    auth.ts                         # NextAuth 配置
    utils.ts                        # 工具函数
  types/
    index.ts                        # TypeScript 类型定义与枚举映射
prisma/
  schema.prisma                     # 数据模型
prisma.config.ts                    # Prisma 7 配置（含 DATABASE_URL 读取）
```

---

## 数据模型关键字段

### Contact（人物卡片）

| 字段            | 类型          | 说明                          |
|-----------------|---------------|-------------------------------|
| spiritAnimal    | SpiritAnimal? | 气场动物（可选）               |
| relationRole    | RelationRole  | 关系角色（必填）               |
| tags            | String[]      | 行业快签                      |
| energyScore     | Int           | 能量值 0-100，默认 50          |
| trustLevel      | Int?          | 置信度 1-5（可选）             |
| temperature     | Temperature?  | 冷/温/热（可选）               |
| lastContactedAt | DateTime?     | 最后联系时间（能量衰减计算用）  |

### Journey（人脉航程）

| 字段       | 类型   | 说明           |
|------------|--------|----------------|
| goal       | String | 用户输入的目标  |
| aiAnalysis | String | AI 分析结果文本 |
| pathData   | Json   | 路径可视化数据  |

---

## 常用命令

```bash
# 开发
npm run dev

# 数据库迁移
npx prisma migrate dev --name <迁移名>

# 查看数据库（Prisma Studio）
npx prisma studio

# 生成 Prisma Client
npx prisma generate

# 添加 shadcn/ui 组件
npx shadcn@latest add <component-name>
```

---

## 开发规范

- **TypeScript**：全项目强类型，枚举值统一在 `src/types/index.ts` 定义
- **服务端组件优先**：客户端组件用 `"use client"` 标注
- **API 路由**：放在 `src/app/api/`，使用 Next.js Route Handlers
- **数据库操作**：统一通过 `src/lib/prisma.ts` 的 Prisma Client 单例
- **组件命名**：PascalCase，文件名 kebab-case（shadcn/ui 组件除外）
- **样式**：优先使用 Tailwind CSS 工具类，shadcn/ui 组件为基础 UI 层
- **行尾符**：全项目统一 LF（`.gitattributes` + `.editorconfig` 强制），禁止 CRLF

---

## Edit 工具使用规范（防止 old_string 匹配失败）

> 本项目在 Windows 上开发，行尾符混乱是 Edit 工具报错的首要原因。已通过 `.gitattributes`（`eol=lf`）和 `.editorconfig`（`end_of_line=lf`）统一为 LF。如果仍遇到 Edit 失败，按以下清单排查：

1. **必须先 Read 再 Edit**：每次编辑前必须用 Read 工具读取目标文件，确认实际内容
2. **old_string 必须精确**：从 Read 输出中精确复制，注意缩进是空格还是 Tab、行尾是否有多余空格
3. **不要从 line number prefix 复制**：Read 工具输出格式为 `行号\t内容`，old_string 只取 `\t` 之后的部分
4. **确保唯一性**：如果 old_string 在文件中出现多次，扩大上下文使其唯一，或使用 `replace_all: true`
5. **大段替换用 Write**：如果要替换的内容超过 50 行，直接用 Write 重写整个文件更可靠
6. **CRLF 修复**：如果某文件 Edit 反复失败，先执行 `sed -i 's/\r$//' <file>` 清除 CRLF 后再 Edit

## 环境变量

见 `.env.example`。关键变量：

- `DATABASE_URL`：PostgreSQL 连接串（在 `prisma.config.ts` 中通过 `dotenv` 读取）
- `NEXTAUTH_SECRET`：生成命令 `openssl rand -base64 32`
- `ANTHROPIC_API_KEY`：用于 F3 人脉航程 AI 分析

---

## ⚡ 当前架构现状（2026-03-31）

### 已完成
- ✅ **Asana 风格登录后主界面**（`(app)` 路由组）
  - 深色侧边栏（`zinc-900`）+ 全宽顶栏（汉堡菜单、搜索、用户头像）
  - 仪表盘主内容：左侧「待跟进人脉」Card（含 Tab）+ 右侧「人脉分布」Card
  - 4 行统计卡片（总人数、热度、需维护、平均能量）
  - 3 张功能引导卡片
- ✅ **认证系统**：手机 OTP 登录 + iron-session + mock 用户（开发模式）
- ✅ **API 基础**：`/api/contacts` GET/POST、`/api/auth/*`
- ✅ **样式系统**：系统字体栈（macOS 苹方、Windows 微软俊黑、英文 Segoe UI）
- ✅ **类型系统**：6 种关系角色 + 8 种气场动物 + Temperature 枚举
- ✅ **权限配置**：开发模式 bypass（middleware 放行 + mock 用户）

### 文件变更注意
- 使用 `src/app/(app)/` 路由组而非根目录页面（旧的 `src/app/contacts/` 等已删除）
- 侧边栏/顶栏分离为 `AppSidebar.tsx` 和 `AppTopBar.tsx`（客户端组件）
- 仪表盘在 `(app)/page.tsx` 完整实现，数据库查询内置

### 后续开发：「人物打标签」页面（`/contacts/new`）
**预期 UI**（Asana 风格）：
- 顶部面包屑：首页 > 人脉数据库 > 新增
- 卡片式表单分为两个 Tab：
  1. **简易模式（≤30秒）**
     - 输入框：姓名（必填）
     - 单选：6 种关系角色（必填）
     - 多选：行业快签（从 AI 推荐列表勾选）
     - 底部：「30秒快速保存」+ 「进入完整模式」
  2. **完整模式**
     - 姓名、公司、职位、微信、电话、邮箱、备注
     - 可选：气场动物选择、信任度滑块（1-5）、温度按钮（冷/温/热）
     - 关系链接：「已认识谁」多选框（列表其他联系人）
     - 底部：保存按钮

**样式参考**：
- 卡片白色背景（`bg-white`）
- 分组标题小灰字（`text-sm text-gray-500 uppercase`）
- 输入框 shadcn/ui Input
- 多选/单选用 Checkbox/RadioGroup
- 角色选择展示为彩色 badge（BIG_INVESTOR=amber, GATEWAY=blue 等）
- 气场动物选择用网格 + emoji（LION=狮子 等）

**接入逻辑**：
- POST `/api/contacts` 已实现，前端只需构造 `{ name, relationRole, tags, company, title, wechat, phone, email, spiritAnimal?, trustLevel?, temperature?, notes }` 数据结构
- 表单验证：名字必填，角色必选
- 成功后重定向到 `/contacts` 列表页

### 开发提示
1. **Tailwind 配置已改**：`fontFamily.sans` 使用系统字体栈，无需 next/font
2. **DevTools 权限**：`.claude/settings.local.json` 已设 `defaultMode: "bypassPermissions"`，所有 Bash/Edit 操作无需确认
3. **DB 查询模板**：见 `(app)/page.tsx` 的 `Promise.all([db.user.findUnique(...), db.contact.findMany(...)])` 模式
4. **颜色映射**：见 `(app)/page.tsx` 底部的 `getRoleStyle()`、`getRoleEmoji()` 等辅助函数，复用这套逻辑
5. **Sidebar 高亮**：`usePathname()` 判断 `pathname.startsWith(item.href)`，避免在路由组中重复

### 技术债
- 尚未实现：contacts 列表页、详情页、编辑页、journey 分析页
- SMS 配置：当前开发模式用 `000000` 跳过，上线前完成阿里云短信接入
