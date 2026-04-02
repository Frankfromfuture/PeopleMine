"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { COMPANY_SCALE_LABELS } from '@/types'
import type { CompanyScale, Temperature } from '@/types'

const TEMP_LABELS: Record<Temperature, { label: string; color: string }> = {
  COLD: { label: '冷', color: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200' },
  WARM: { label: '温', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  HOT:  { label: '热', color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' },
}

const DEFAULT_TAGS = ['AI', '互联网', '金融', '医疗', '教育', '消费', '制造', '能源', '地产', '物流', '传媒', '文旅']

type InitialCompany = {
  id?: string
  name?: string | null
  mainBusiness?: string | null
  website?: string | null
  scale?: string | null
  industry?: string | null
  tags?: string[]
  founderName?: string | null
  founderContactId?: string | null
  investors?: string[]
  upstreams?: string[]
  downstreams?: string[]
  familiarityLevel?: number | null
  temperature?: string | null
  energyScore?: number | null
  notes?: string | null
}

type PeopleContact = { id: string; name: string }

export default function CompanyForm({
  initialCompany,
  contacts = [],
  mode = 'create',
}: {
  initialCompany?: InitialCompany
  contacts?: PeopleContact[]
  mode?: 'create' | 'edit'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = mode === 'edit' && Boolean(initialCompany?.id)

  // Tab state
  const [tab, setTab] = useState<'simple' | 'full'>('simple')

  // Form fields
  const [name, setName] = useState(initialCompany?.name ?? '')
  const [mainBusiness, setMainBusiness] = useState(initialCompany?.mainBusiness ?? '')
  const [website, setWebsite] = useState(initialCompany?.website ?? '')
  const [scale, setScale] = useState<CompanyScale | ''>(initialCompany?.scale as CompanyScale ?? '')
  const [industry, setIndustry] = useState(initialCompany?.industry ?? '')
  const [tags, setTags] = useState<string[]>(initialCompany?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [founderName, setFounderName] = useState(initialCompany?.founderName ?? '')
  const [founderContactId, setFounderContactId] = useState(initialCompany?.founderContactId ?? '')
  const [investors, setInvestors] = useState((initialCompany?.investors ?? []).join('、'))
  const [upstreams, setUpstreams] = useState((initialCompany?.upstreams ?? []).join('、'))
  const [downstreams, setDownstreams] = useState((initialCompany?.downstreams ?? []).join('、'))
  const [familiarityLevel, setFamiliarityLevel] = useState<number>(initialCompany?.familiarityLevel ?? 3)
  const [temperature, setTemperature] = useState<Temperature | ''>(initialCompany?.temperature as Temperature ?? '')
  const [energyScore, setEnergyScore] = useState<number>(initialCompany?.energyScore ?? 50)
  const [notes, setNotes] = useState(initialCompany?.notes ?? '')

  // AI extract
  const [extractText, setExtractText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [showExtract, setShowExtract] = useState(false)

  // Errors
  const [error, setError] = useState('')

  function toggleTag(t: string) {
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }

  function addCustomTag() {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }

  async function handleExtract() {
    if (!extractText.trim()) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/companies/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const e = data.extracted
      if (e.name) setName(e.name)
      if (e.mainBusiness) setMainBusiness(e.mainBusiness)
      if (e.website) setWebsite(e.website)
      if (e.scale) setScale(e.scale as CompanyScale)
      if (e.industry) setIndustry(e.industry)
      if (e.tags?.length) setTags((prev) => Array.from(new Set([...prev, ...e.tags])))
      if (e.founderName) setFounderName(e.founderName)
      if (e.investors?.length) setInvestors(e.investors.join('、'))
      if (e.upstreams?.length) setUpstreams(e.upstreams.join('、'))
      if (e.downstreams?.length) setDownstreams(e.downstreams.join('、'))
      setShowExtract(false)
      setExtractText('')
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'AI 提取失败')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('公司名称不能为空'); return }
    setError('')

    const payload = {
      name: name.trim(),
      mainBusiness: mainBusiness.trim() || null,
      website: website.trim() || null,
      scale: scale || null,
      industry: industry.trim() || null,
      tags,
      founderName: founderName.trim() || null,
      founderContactId: founderContactId || null,
      investors: investors.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean),
      upstreams: upstreams.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean),
      downstreams: downstreams.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean),
      familiarityLevel,
      temperature: temperature || null,
      energyScore,
      notes: notes.trim() || null,
    }

    const url = isEdit ? `/api/companies/${initialCompany!.id}` : '/api/companies'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '保存失败')
      return
    }

    startTransition(() => { router.push('/companies') })
    router.refresh()
  }

  return (
    <div className="min-h-full px-8 py-7">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/dashboard" className="hover:text-gray-600 transition-colors">首页</a>
        <span>/</span>
        <a href="/companies" className="hover:text-gray-600 transition-colors">企业数据库</a>
        <span>/</span>
        <span className="text-gray-700 font-medium">{isEdit ? '编辑企业' : '新增企业'}</span>
      </div>

      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? '编辑企业标签' : '新增企业标签'}</h1>
          {/* AI Extract button */}
          <button
            onClick={() => setShowExtract(!showExtract)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <span>✨</span>
            AI 智能提取
          </button>
        </div>

        {/* AI Extract panel */}
        {showExtract && (
          <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
            <p className="text-sm font-medium text-violet-800 mb-2">粘贴公司介绍、新闻报道、官网内容等，AI 自动识别填写表单</p>
            <textarea
              value={extractText}
              onChange={(e) => setExtractText(e.target.value)}
              placeholder="粘贴公司资料文本..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-violet-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
            {extractError && <p className="text-xs text-red-500 mt-1">{extractError}</p>}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleExtract}
                disabled={extracting || !extractText.trim()}
                className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {extracting ? '提取中…' : '开始提取'}
              </button>
              <button
                onClick={() => { setShowExtract(false); setExtractText(''); setExtractError('') }}
                className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setTab('simple')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === 'simple' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            简易模式
          </button>
          <button
            onClick={() => setTab('full')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === 'full' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            完整模式
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* ── 基本信息 ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">基本信息</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">公司名称 <span className="text-red-500">*</span></label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：字节跳动"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">所在行业</label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例：互联网 / 医疗健康"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </div>

          {/* ── 企业规模 ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">企业规模</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(COMPANY_SCALE_LABELS) as [CompanyScale, { name: string; desc: string; color: string }][]).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScale(scale === key ? '' : key)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                    scale === key
                      ? val.color + ' border-current font-medium'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {val.name}
                  <span className="text-xs ml-1 opacity-70">{val.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 行业标签 ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">行业标签</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEFAULT_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    tags.includes(t)
                      ? 'bg-violet-100 text-violet-700 border-violet-300 font-medium'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tags.includes(t) ? '✓ ' : ''}{t}
                </button>
              ))}
              {tags.filter((t) => !DEFAULT_TAGS.includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className="px-2.5 py-1 text-xs rounded-full border bg-violet-100 text-violet-700 border-violet-300 font-medium"
                >
                  ✓ {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                placeholder="自定义标签，回车添加"
                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                添加
              </button>
            </div>
          </div>

          {/* ── 完整模式额外字段 ── */}
          {tab === 'full' && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">企业详情</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">主营业务</label>
                    <textarea
                      value={mainBusiness}
                      onChange={(e) => setMainBusiness(e.target.value)}
                      placeholder="简述公司核心业务..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">官网</label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      type="url"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">创始人 / 核心人物</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">创始人姓名</label>
                    <input
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
                      placeholder="例：张一鸣"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  {contacts.length > 0 && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">关联人物（人脉库）</label>
                      <select
                        value={founderContactId}
                        onChange={(e) => setFounderContactId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      >
                        <option value="">不关联</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">资本与生态</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">投资机构</label>
                    <input
                      value={investors}
                      onChange={(e) => setInvestors(e.target.value)}
                      placeholder="红杉、IDG、高瓴（多个用顿号分隔）"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">上游合作方</label>
                    <input
                      value={upstreams}
                      onChange={(e) => setUpstreams(e.target.value)}
                      placeholder="供应商、原材料、技术提供方..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">下游客户/合作方</label>
                    <input
                      value={downstreams}
                      onChange={(e) => setDownstreams(e.target.value)}
                      placeholder="主要客户、渠道、分销方..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">关系评估</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      熟悉程度 <span className="text-gray-400">({familiarityLevel}/5)</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={familiarityLevel}
                      onChange={(e) => setFamiliarityLevel(parseInt(e.target.value))}
                      className="w-full accent-violet-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>陌生</span><span>了解</span><span>熟悉</span><span>深度合作</span><span>战略伙伴</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">合作温度</label>
                    <div className="flex gap-2">
                      {(Object.entries(TEMP_LABELS) as [Temperature, { label: string; color: string }][]).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setTemperature(temperature === k ? '' : k)}
                          className={`px-4 py-1.5 text-sm rounded-lg border transition-all ${
                            temperature === k ? v.color + ' font-medium border-current' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      能量值 <span className="text-gray-400">({energyScore})</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={energyScore}
                      onChange={(e) => setEnergyScore(parseInt(e.target.value))}
                      className="w-full accent-violet-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">备注</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="关于这家公司的额外信息..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {tab === 'simple' && (
              <button
                type="button"
                onClick={() => setTab('full')}
                className="text-sm text-violet-600 hover:text-violet-700 transition-colors"
              >
                进入完整模式 →
              </button>
            )}
            {tab === 'full' && <span />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="px-6 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isPending ? '保存中…' : isEdit ? '保存更改' : '保存企业'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
