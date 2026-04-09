import UnderConstruction from '@/components/UnderConstruction'

export default function PlaygroundPage() {
  return (
    <UnderConstruction
      title="游乐场"
      summary="承接实验功能、原型和快速验证模块，保持和主工作台一致的简洁画布式布局。"
      hints={[
        '这个页面适合放实验性工具和新想法。',
        '统一壳层之后，后续临时功能也不会破坏整体观感。',
        '当前先保留简洁占位，后续再按模块逐步填充。',
      ]}
    />
  )
}
