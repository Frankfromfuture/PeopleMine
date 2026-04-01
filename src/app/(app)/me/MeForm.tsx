'use client'

import { useState, useEffect } from 'react'

const SPIRIT_ANIMAL_OPTIONS = [
  { value: 'LION',      emoji: '🦁', label: '狮子',   desc: '强势、权威、领袖型' },
  { value: 'FOX',       emoji: '🦊', label: '狐狸',   desc: '精明、圆滑、策略型' },
  { value: 'BEAR',      emoji: '🐻', label: '熊',     desc: '稳重、可靠、信赖型' },
  { value: 'CHAMELEON', emoji: '🦎', label: '变色龙', desc: '适应力强、多面型' },
  { value: 'EAGLE',     emoji: '🦅', label: '鹰',     desc: '敏锐、远见、判断力强' },
  { value: 'DOLPHIN',   emoji: '🐬', label: '海豚',   desc: '亲和、感染力、社交型' },
  { value: 'OWL',       emoji: '🦉', label: '猫头鹰', desc: '深沉、安静、知识型' },
  { value: 'SKUNK',     emoji: '🦨', label: '臭鼬',   desc: '古怪、独特、反常规' },
]

const JOB_POSITION_OPTIONS = [
  '总经理', '董事长', '副总裁', '总监', '经理',
  '销售', '市场', '产品经理', '工程师', '设计师',
  '财务', '行政', '人力资源', '运营', '法务', '其他',
]

const TAG_SUGGESTIONS = [
  'AI', '互联网', '投资', '产品', '设计', '运营',
  '教育', '医疗', '金融', '销售', '市场', '创业',
  '技术', '内容', '品牌', '咨询', '法律', '制造',
]

interface SelfProfile {
  name?: string | null
  goal?: string | null
  selfTags?: string | null
  selfCompany?: string | null
  selfTitle?: string | null
  selfJobPosition?: string | null
  selfSpiritAnimal?: string | null
  selfBio?: string | null
}

export default function MeForm() {
  const [profile, setProfile] = useState<SelfProfile>({})
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        const u = data.user ?? {}
        setProfile(u)
        if (u.selfTags) {
          try { setSelectedTags(JSON.parse(u.selfTags)) } catch {}
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const tag = customTag.trim()
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag])
    }
    setCustomTag('')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, selfTags: selectedTags }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* 基础信息 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">基础信息</p>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <label className="block col-span-2">
            <span className="text-sm text-gray-600">我的名字</span>
            <input
              value={profile.name ?? ''}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="你的名字"
              className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">公司 / 组织</span>
            <input
              value={profile.selfCompany ?? ''}
              onChange={e => setProfile(p => ({ ...p, selfCompany: e.target.value }))}
              placeholder="在哪家公司"
              className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">职位头衔</span>
            <input
              value={profile.selfTitle ?? ''}
              onChange={e => setProfile(p => ({ ...p, selfTitle: e.target.value }))}
              placeholder="例：产品经理"
              className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 text-sm"
            />
          </label>
          <label className="block col-span-2">
            <span className="text-sm text-gray-600">岗位类别</span>
            <select
              value={profile.selfJobPosition ?? ''}
              onChange={e => setProfile(p => ({ ...p, selfJobPosition: e.target.value }))}
              className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 bg-white text-sm"
            >
              <option value="">不填</option>
              {JOB_POSITION_OPTIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </label>
          <label className="block col-span-2">
            <span className="text-sm text-gray-600">一句话介绍自己</span>
            <textarea
              value={profile.selfBio ?? ''}
              onChange={e => setProfile(p => ({ ...p, selfBio: e.target.value }))}
              placeholder="例：做 B2B SaaS 的产品负责人，专注企业服务赛道 3 年"
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 text-sm resize-none"
            />
          </label>
        </div>
      </div>

      {/* 行业标签 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">行业标签</p>
          <p className="text-xs text-gray-400 mt-0.5">选择你所在的行业领域，AI 会以此推算你的人脉位置</p>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {TAG_SUGGESTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.filter(t => !TAG_SUGGESTIONS.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.filter(t => !TAG_SUGGESTIONS.includes(t)).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 text-sm rounded-full border bg-violet-600 text-white border-violet-600"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomTag()}
              placeholder="添加自定义标签，回车确认"
              className="flex-1 h-9 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 text-sm"
            />
            <button
              onClick={addCustomTag}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              添加
            </button>
          </div>
        </div>
      </div>

      {/* 气场动物 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">气场动物</p>
          <p className="text-xs text-gray-400 mt-0.5">选一个最能描述你的气场风格</p>
        </div>
        <div className="p-6 grid grid-cols-4 gap-3">
          {SPIRIT_ANIMAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setProfile(p => ({
                ...p,
                selfSpiritAnimal: p.selfSpiritAnimal === opt.value ? null : opt.value,
              }))}
              className={`border rounded-xl p-3 text-left transition-all ${
                profile.selfSpiritAnimal === opt.value
                  ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{opt.emoji}</div>
              <div className="text-sm font-medium text-gray-800">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 核心目标 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">核心目标</p>
          <p className="text-xs text-gray-400 mt-0.5">你当前最想通过人脉达成的目标，会作为航程分析的背景</p>
        </div>
        <div className="p-6">
          <textarea
            value={profile.goal ?? ''}
            onChange={e => setProfile(p => ({ ...p, goal: e.target.value }))}
            placeholder="例：在 6 个月内完成 A 轮融资，需要接触 VC 合伙人和行业大牛"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 text-sm resize-none"
          />
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition"
        >
          {isSaving ? '保存中…' : '保存'}
        </button>
        {saved && (
          <span className="text-sm text-green-600">✓ 已保存，航程分析将以此为起点</span>
        )}
      </div>
    </div>
  )
}
