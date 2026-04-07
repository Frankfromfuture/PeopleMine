"use client"

import CompanyUniverseView from "../../../(app)/journey/CompanyUniverseView"

export default function CompanyUniversePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden">
      <div className="shrink-0 px-5 py-3 border-b border-gray-200" style={{ background: "#f4f4f4" }}>
        <h1 className="text-gray-800 font-medium" style={{ fontSize: 15 }}>企业宇宙</h1>
      </div>
      <div className="flex-1 relative min-w-0 flex overflow-hidden">
        <CompanyUniverseView />
      </div>
    </div>
  )
}
