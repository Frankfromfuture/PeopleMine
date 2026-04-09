"use client"

import { useState } from "react"
import { MoveDiagonal, X } from "lucide-react"
import { DraggableCanvas } from "@/components/DraggableCanvas"
import RelationStrengthPanel from "@/components/RelationStrengthPanel"

export default function DashboardClient({
  greeting,
  today,
  displayName,
}: {
  greeting: string
  today: string
  displayName: string
}) {
  const [autoAlign, setAutoAlign] = useState(true)
  const [devOpen, setDevOpen] = useState(false)

  return (
    <>
      <section className="mb-7 flex flex-col gap-6 pb-3 pt-2 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <h1 className="text-[38px] font-bold tracking-tight text-gray-900 sm:text-[44px]">
            {greeting}，{displayName}
          </h1>
          <p className="text-sm italic text-gray-500 sm:text-[15px]">{today}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] text-gray-500 shadow-sm">
            <MoveDiagonal size={12} />
            <span>空白处拖拽，边框缩放</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="text-[12px] text-gray-600">自动对齐</span>
            <button
              onClick={() => setAutoAlign((value) => !value)}
              className={`relative h-[22px] w-10 rounded-full transition-colors duration-200 ${
                autoAlign ? "bg-[#A04F47]" : "bg-gray-300"
              }`}
              aria-pressed={autoAlign}
              title="自动向上向左对齐"
            >
              <span
                className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 ${
                  autoAlign ? "translate-x-[20px]" : "translate-x-[2px]"
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => setDevOpen(true)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800"
          >
            DEV
          </button>
        </div>
      </section>

      <DraggableCanvas autoAlign={autoAlign} />

      {devOpen ? (
        <div className="fixed inset-0 z-50 flex" onClick={() => setDevOpen(false)}>
          <div className="flex-1 bg-black/20 backdrop-blur-[2px]" />

          <div
            className="relative h-full overflow-y-auto bg-white shadow-2xl"
            style={{ width: 480, borderLeft: "1px solid rgba(0,0,0,0.08)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest"
                  style={{
                    background: "rgba(0,0,0,0.06)",
                    color: "#555",
                    border: "1px solid rgba(0,0,0,0.10)",
                  }}
                >
                  DEV
                </span>
                <span className="text-sm font-medium text-gray-700">关系强度实验室</span>
              </div>

              <button
                onClick={() => setDevOpen(false)}
                className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              <RelationStrengthPanel />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
