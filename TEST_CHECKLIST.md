# 人脉航程系统 — 测试检查清单

## 环境准备

- [ ] Node.js 18+ 已安装
- [ ] npm 依赖已安装 (`npm install`)
- [ ] 开发服务器正常运行 (`npm run dev`)
- [ ] 数据库连接正常（若有 Supabase）

---

## 单元测试

### 评分函数测试

```bash
npm test -- scoring.test.ts
```

- [ ] `computeRelevanceScore` — 关键词匹配正确
- [ ] `computeAccessibilityScore` — 能量值/温度/衰减正确
- [ ] `computeNetworkCentrality` — 中心度计算正确
- [ ] `computeJourneyScore` — 加权组合正确
- [ ] `scoreAllContacts` — 批量评分并排序

### 路径算法测试

```bash
npm test -- pathfinding.test.ts
```

- [ ] `buildCandidatePaths` — 1跳/2跳路径生成
- [ ] `selectPaths` — 主路径和备选路径选择
- [ ] `detectMissingRoles` — 缺失角色检测

---

## API 集成测试

### 测试脚本

```bash
chmod +x test-journey-api.sh
./test-journey-api.sh 3000
```

- [ ] POST /api/contacts — 创建测试联系人
- [ ] POST /api/journey — 航程分析执行
  - [ ] 请求体验证
  - [ ] 响应 JSON 结构正确
  - [ ] pathData 包含所有必需字段
- [ ] GET /api/journey — 历史查询
  - [ ] 分页参数工作
  - [ ] 返回排序正确

### 错误场景

```bash
# 无联系人
curl -X POST http://localhost:3000/api/journey \
  -H "Content-Type: application/json" \
  -d '{"goal":"test"}'
# 预期: 400 NO_CONTACTS

# 无效请求
curl -X POST http://localhost:3000/api/journey \
  -H "Content-Type: application/json" \
  -d '{"goal":""}'
# 预期: 400 目标不能为空

# 未认证（若需要）
curl -X GET http://localhost:3000/api/journey
# 预期: 401 未登录 或 200 (dev mode)
```

---

## UI 端到端测试

### 页面加载

- [ ] /journey 页面加载成功
- [ ] 看到目标输入框
- [ ] 看到 4 个示例快速填充
- [ ] 看到「开始分析」按钮

### 目标输入

- [ ] 输入文本正常
- [ ] 示例点击填充目标
- [ ] 空目标时按钮禁用
- [ ] 加载中时输入框禁用

### 加载动画

- [ ] Step1 立即显示（读取联系人数据）
- [ ] Step2 800ms 后显示（计算评分）
- [ ] Step3 1600ms 后显示（规划路径）
- [ ] Step4 2400ms 后显示（AI 分析中）
- [ ] 加载中有旋转动画指示

### React Flow 图谱

- [ ] 用户节点在中心（紫色圆）
- [ ] 联系人节点着色正确：
  - [ ] BIG_INVESTOR = amber
  - [ ] GATEWAY = blue
  - [ ] ADVISOR = violet
  - [ ] THERMOMETER = rose
  - [ ] LIGHTHOUSE = orange
  - [ ] COMRADE = green
- [ ] 主路径节点有金色边框
- [ ] 其他节点 50% 透明度
- [ ] 节点尺寸按 journeyScore 缩放
- [ ] 边自动流动（动画）

### 布局切换

- [ ] 「辐射布局」按钮工作
  - [ ] 用户中心 → 内环主路径 → 外环其他节点
- [ ] 「线性路径」按钮工作
  - [ ] User → Step1 → Step2 → ... 左→右排列

### 节点交互

- [ ] 点击联系人节点 → 右侧面板显示
- [ ] 点击 UserNode → 忽略（无反应）
- [ ] 点击 MissingNode → 忽略（无反应）
- [ ] 再次点击同一节点 → 面板保持显示
- [ ] 点击另一节点 → 面板更新

### 节点详情面板

- [ ] 显示联系人名字
- [ ] 显示公司/职位
- [ ] 显示角色 badge（e.g. 传送门）
- [ ] 显示温度 badge（冷/温/热）
- [ ] 航程综合分 progress bar
- [ ] 能量值 progress bar
- [ ] 信任度星星 (1-5)
- [ ] 显示标签
- [ ] 显示沟通建议：
  - [ ] 开场白
  - [ ] 核心信息
  - [ ] 时机建议
  - [ ] 注意事项（如有）
  - [ ] 推荐渠道 badge

### AI 分析摘要

- [ ] 「整体策略」卡片显示
- [ ] 显示 2-3 句中文总结
- [ ] 置信度 progress bar (0-100%)
- [ ] 置信度数值显示

### 缺失节点提示

- [ ] 若有缺失角色，显示黄色卡片
- [ ] 列出缺失的角色名称
- [ ] 显示为什么需要这个角色
- [ ] 显示建议在哪儿找

### 历史记录

- [ ] 「历史航程」折叠框显示
- [ ] 点击展开/折叠
- [ ] 显示过往目标（截断到 50 字）
- [ ] 显示相对时间（刚刚/X小时前/X天前）
- [ ] 点击历史项 → 显示该航程结果

### 新建分析

- [ ] 「新建分析」按钮显示
- [ ] 点击后 → 回到目标输入页面
- [ ] 目标输入框清空

---

## 性能测试

### 数据量测试

```bash
# 添加 50 个联系人
for i in {1..50}; do
  curl -s -X POST http://localhost:3000/api/contacts \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Contact$i\",\"relationRole\":\"GATEWAY\"}"
done

# 航程分析应该在 5-10 秒内完成
time curl -X POST http://localhost:3000/api/journey \
  -H "Content-Type: application/json" \
  -d '{"goal":"test"}'
```

- [ ] API 响应 < 15 秒（包括 Claude 调用）
- [ ] React Flow 渲染流畅（无卡顿）
- [ ] 图谱交互响应快速

### 内存测试

- [ ] 多次加载页面，内存不持续增长
- [ ] 切换布局多次，性能不下降

---

## 错误处理

### 边界情况

- [ ] 无联系人 → 返回 400 + 清晰错误信息
- [ ] 无关系边 → 全部 1 跳路径，正常工作
- [ ] 目标过长 (>500 字) → 截断或拒绝
- [ ] 特殊字符 (emoji/符号) → 正常处理
- [ ] 中文混合英文 → 关键词提取正确

### 网络错误

- [ ] 服务器断开 → 显示「分析失败」+ 重试按钮
- [ ] 缓慢网络 → 进度条持续显示，不超时
- [ ] API Key 未配置 → 使用兜底方案，提示用户

---

## 浏览器兼容性

- [ ] Chrome/Edge 最新版
- [ ] Firefox 最新版
- [ ] Safari 最新版（macOS）
- [ ] 移动浏览器（响应式布局）

---

## 数据库集成

（若有真实数据库连接）

- [ ] 航程保存到 db.journey 成功
- [ ] pathData JSON 完整保存
- [ ] 历史查询返回正确数据
- [ ] 分页工作正确

---

## 清单完成率

- [ ] 单元测试：___ / 10
- [ ] API 测试：___ / 8
- [ ] UI 测试：___ / 40
- [ ] 性能测试：___ / 4
- [ ] 错误处理：___ / 10
- [ ] 浏览器：___ / 4
- [ ] 数据库：___ / 4

**总计：___ / 80**

---

## 测试签名

- **测试者**：_______________
- **测试日期**：______________
- **测试环境**：Node.js ___, npm ___, 浏览器 ___
- **通过状态**：✓ 已通过 / ✗ 有问题

---

## 已知问题

（记录测试中发现的问题）

1. 问题描述：
   重现步骤：
   预期行为：
   实际行为：

---
