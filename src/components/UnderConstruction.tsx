import { Construction } from "lucide-react"

export default function UnderConstruction({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-gray-400">
      <Construction size={40} strokeWidth={1.2} className="text-gray-300" />
      <div className="text-center">
        <p className="text-gray-600 font-medium" style={{ fontSize: 15 }}>{title}</p>
        <p className="mt-1" style={{ fontSize: 13 }}>建设中，敬请期待</p>
      </div>
    </div>
  )
}
