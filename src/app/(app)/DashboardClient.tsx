"use client"

import { useState } from "react"
import { GripHorizontal, X } from "lucide-react"
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
  const [autoAlign, setAutoAlign] = useState(false)
  const [devOpen, setDevOpen]     = useState(false)
  const toggleAutoAlign = () => setAutoAlign((v) => !v)

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="text-gray-800" style={{ fontSize: 25 }}>
            {greeting}，{displayName}
          </h1>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: 13.5 }}>
            {today}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 pb-0.5">
          <div className="flex items-center gap-1 text-gray-400 mr-1" style={{ fontSize: 11 }}>
            <GripHorizontal size={11} />
            <span>拖动右上角移动 Widget</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <span className="text-gray-500" style={{ fontSize: 12 }}>自动排列</span>
          <button
            onClick={toggleAutoAlign}
            className={`relative w-9 h-[20px] rounded-full transition-colors duration-200 cursor-pointer ${
              autoAlign ? "bg-[#FF7F27]" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                autoAlign ? "translate-x-[18px]" : "translate-x-[2px]"
              }`}
            />
          </button>

          <div className="h-4 w-px bg-gray-300" />

          {/* DEV button */}
          <button
            onClick={() => setDevOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold tracking-widest transition-colors"
            style={{
              background: "rgba(0,0,0,0.06)",
              color: "#666",
              border: "1px solid rgba(0,0,0,0.10)",
              letterSpacing: "0.12em",
            }}
          >
            DEV
          </button>
        </div>
      </div>

      {/* Draggable widget canvas */}
      <DraggableCanvas autoAlign={autoAlign} onToggleAutoAlign={toggleAutoAlign} />

      {/* DEV drawer overlay */}
      {devOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setDevOpen(false)}
        >
          {/* Backdrop */}
          <div className="flex-1 bg-black/20 backdrop-blur-[2px]" />

          {/* Drawer panel */}
          <div
            className="relative h-full overflow-y-auto bg-white shadow-2xl"
            style={{ width: 480, borderLeft: "1px solid rgba(0,0,0,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(0,0,0,0.06)", color: "#555", border: "1px solid rgba(0,0,0,0.10)" }}
                >
                  DEV
                </span>
                <span className="text-sm font-medium text-gray-700">关系强度实验室</span>
              </div>
              <button
                onClick={() => setDevOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Widget content */}
            <div className="p-4">
              <RelationStrengthPanel />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
