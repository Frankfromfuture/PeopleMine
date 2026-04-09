import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET() {
  const qwenKey = process.env.QWEN_API_KEY

  if (!qwenKey) {
    return NextResponse.json({ ok: false, reason: "missing_key" }, { status: 503 })
  }

  try {
    const client = new OpenAI({
      apiKey: qwenKey,
      baseURL: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
    })

    await client.chat.completions.create(
      {
        model: "qwen3.5-flash",
        max_tokens: 1,
        temperature: 0,
        messages: [{ role: "user", content: "ping" }],
      },
      {
        timeout: 8000,
      },
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Qwen status check failed:", error)
    return NextResponse.json({ ok: false, reason: "request_failed" }, { status: 503 })
  }
}
