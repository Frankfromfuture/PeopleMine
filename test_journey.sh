#!/bin/bash

# 1. Add some test contacts
echo "Adding test contacts..."

# Contact 1: 大金主
curl -s -X POST http://localhost:3002/api/contacts \
  -H "Content-Type: application/json" \
  --data-binary @- << 'JSON' > /dev/null
{"name":"Li Investor","relationRole":"BIG_INVESTOR","tags":["venture"],"company":"Sequoia Capital","title":"Partner","energyScore":80,"temperature":"WARM","trustLevel":5}
JSON

# Contact 2: 传送门
curl -s -X POST http://localhost:3002/api/contacts \
  -H "Content-Type: application/json" \
  --data-binary @- << 'JSON' > /dev/null
{"name":"Zhang Gateway","relationRole":"GATEWAY","tags":["connector","tech"],"company":"Bytedance","title":"Product Manager","energyScore":90,"temperature":"HOT","trustLevel":4}
JSON

# Contact 3: 智囊
curl -s -X POST http://localhost:3002/api/contacts \
  -H "Content-Type: application/json" \
  --data-binary @- << 'JSON' > /dev/null
{"name":"Wang Advisor","relationRole":"ADVISOR","tags":["AI","strategy"],"company":"OpenAI","title":"Researcher","energyScore":70,"temperature":"WARM","trustLevel":3}
JSON

echo "✓ Test contacts added"

# 2. Test the journey API
echo ""
echo "Testing journey API..."
curl -s -X POST http://localhost:3002/api/journey \
  -H "Content-Type: application/json" \
  --data-binary @- << 'JSON'
{"goal":"I want to meet venture investors in AI sector"}
JSON

