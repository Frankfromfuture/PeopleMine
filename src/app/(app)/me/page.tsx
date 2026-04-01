import MeForm from './MeForm'

export default function MePage() {
  return (
    <div className="px-8 py-7">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">我的档案</h1>
        <p className="text-sm text-gray-500 mt-1">
          填写你自己的标签，AI 将以「你」为起点规划最优人脉航程
        </p>
      </div>
      <div className="mt-6">
        <MeForm />
      </div>
    </div>
  )
}
