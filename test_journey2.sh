#!/bin/bash

PORT=3003

echo "Adding test contacts..."

# Contact 1
curl -s -X POST http://localhost:$PORT/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Li Investor","relationRole":"BIG_INVESTOR","tags":["venture"],"company":"Sequoia Capital","title":"Partner","energyScore":80,"temperature":"WARM","trustLevel":5}' > /dev/null

# Contact 2
curl -s -X POST http://localhost:$PORT/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Zhang Gateway","relationRole":"GATEWAY","tags":["connector","tech"],"company":"Bytedance","title":"Product Manager","energyScore":90,"temperature":"HOT","trustLevel":4}' > /dev/null

# Contact 3
curl -s -X POST http://localhost:$PORT/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Wang Advisor","relationRole":"ADVISOR","tags":["AI","strategy"],"company":"OpenAI","title":"Researcher","energyScore":70,"temperature":"WARM","trustLevel":3}' > /dev/null

echo "✓ Added 3 test contacts"
echo ""
echo "Testing journey API..."
echo ""

curl -s -X POST http://localhost:$PORT/api/journey \
  -H "Content-Type: application/json" \
  -d '{"goal":"I want to meet venture capital investors in the AI sector"}' | python3 -m json.tool 2>/dev/null || curl -s -X POST http://localhost:$PORT/api/journey \
  -H "Content-Type: application/json" \
  -d '{"goal":"I want to meet venture capital investors in the AI sector"}'

