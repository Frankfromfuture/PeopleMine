#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=${1:-3000}
BASE_URL="http://localhost:$PORT"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  人脉航程 API 完整测试套件${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# 1. 清空测试数据（可选）
echo -e "${YELLOW}[1/5] 准备测试环境...${NC}"
sleep 1

# 2. 添加测试联系人
echo -e "${YELLOW}[2/5] 添加 5 个测试联系人...${NC}"

contacts=()

# 联系人 1: 大金主
response=$(curl -s -X POST "$BASE_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "李投资",
    "relationRole": "BIG_INVESTOR",
    "tags": ["投资", "创投"],
    "company": "红杉资本",
    "title": "投资合伙人",
    "energyScore": 85,
    "temperature": "WARM",
    "trustLevel": 5
  }')
id1=$(echo $response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
contacts+=($id1)
echo "  ✓ 联系人 1: $id1 (大金主)"

# 联系人 2: 传送门
response=$(curl -s -X POST "$BASE_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张传送门",
    "relationRole": "GATEWAY",
    "tags": ["连接器", "产品"],
    "company": "字节跳动",
    "title": "高级产品经理",
    "energyScore": 90,
    "temperature": "HOT",
    "trustLevel": 4
  }')
id2=$(echo $response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
contacts+=($id2)
echo "  ✓ 联系人 2: $id2 (传送门)"

# 联系人 3: 智囊
response=$(curl -s -X POST "$BASE_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "王智囊",
    "relationRole": "ADVISOR",
    "tags": ["AI", "战略"],
    "company": "OpenAI",
    "title": "研究员",
    "energyScore": 70,
    "temperature": "WARM",
    "trustLevel": 3
  }')
id3=$(echo $response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
contacts+=($id3)
echo "  ✓ 联系人 3: $id3 (智囊)"

# 联系人 4: 温度计
response=$(curl -s -X POST "$BASE_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "陈温度计",
    "relationRole": "THERMOMETER",
    "tags": ["朋友"],
    "company": "独立顾问",
    "title": "创业者",
    "energyScore": 60,
    "temperature": "COLD",
    "trustLevel": 2
  }')
id4=$(echo $response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
contacts+=($id4)
echo "  ✓ 联系人 4: $id4 (温度计)"

# 联系人 5: 战友
response=$(curl -s -X POST "$BASE_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "刘战友",
    "relationRole": "COMRADE",
    "tags": ["前同事", "技术"],
    "company": "某初创公司",
    "title": "CTO",
    "energyScore": 75,
    "temperature": "WARM",
    "trustLevel": 5
  }')
id5=$(echo $response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
contacts+=($id5)
echo "  ✓ 联系人 5: $id5 (战友)"

echo ""

# 3. 添加人脉关系（可选）
echo -e "${YELLOW}[3/5] 建立人脉关系...${NC}"

if [ ! -z "$id1" ] && [ ! -z "$id2" ]; then
  curl -s -X POST "$BASE_URL/api/contacts/$id1/relations" \
    -H "Content-Type: application/json" \
    -d "{\"targetContactId\": \"$id2\", \"relationDesc\": \"投资过的创始人\"}" > /dev/null
  echo "  ✓ $id1 → $id2"
fi

if [ ! -z "$id2" ] && [ ! -z "$id3" ]; then
  curl -s -X POST "$BASE_URL/api/contacts/$id2/relations" \
    -H "Content-Type: application/json" \
    -d "{\"targetContactId\": \"$id3\", \"relationDesc\": \"认识的AI专家\"}" > /dev/null
  echo "  ✓ $id2 → $id3"
fi

echo ""

# 4. 测试航程 API
echo -e "${YELLOW}[4/5] 执行航程分析（关键测试）...${NC}"

goals=(
  "我想认识更多投资人"
  "我需要在AI领域找一位顾问"
  "我想扩展我的创业者人脉"
)

for i in "${!goals[@]}"; do
  goal="${goals[$i]}"
  echo ""
  echo "  测试目标 $((i+1)): \"$goal\""

  response=$(curl -s -X POST "$BASE_URL/api/journey" \
    -H "Content-Type: application/json" \
    -d "{\"goal\": \"$goal\"}")

  # 检查是否成功
  if echo "$response" | grep -q "pathData"; then
    echo -e "  ${GREEN}✓ 航程分析成功！${NC}"

    # 提取关键信息
    journey_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    confidence=$(echo "$response" | grep -o '"overallConfidence":[0-9.]*' | cut -d':' -f2)
    echo "    - Journey ID: $journey_id"
    echo "    - 置信度: $confidence"

  elif echo "$response" | grep -q "error"; then
    error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if [ "$error" = "NO_CONTACTS" ]; then
      echo -e "  ${YELLOW}ℹ 预期错误：无联系人${NC}"
    else
      echo -e "  ${RED}✗ 错误: $error${NC}"
    fi
  else
    echo -e "  ${RED}✗ 未知响应${NC}"
    echo "    $response"
  fi
done

echo ""

# 5. 获取历史
echo -e "${YELLOW}[5/5] 获取航程历史...${NC}"

history=$(curl -s -X GET "$BASE_URL/api/journey?limit=5&offset=0")

if echo "$history" | grep -q "journeys"; then
  count=$(echo "$history" | grep -o '"journeys":\[' | wc -l)
  echo -e "  ${GREEN}✓ 历史查询成功！${NC}"
  echo "    - 获取到航程记录"
else
  echo -e "  ${YELLOW}ℹ 历史为空${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  测试完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "接下来的步骤："
echo "1. 打开浏览器: http://localhost:$PORT/journey"
echo "2. 输入一个目标，查看 UI 渲染"
echo "3. 点击图谱中的节点，查看详情面板"
echo "4. 切换布局模式（辐射/线性）"
echo ""
