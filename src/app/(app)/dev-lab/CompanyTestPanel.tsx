'use client'

import { useState } from 'react'

const TEST_COMPANIES = [
  {
    name: '字节跳动',
    industry: '互联网',
    scale: 'LARGE',
    mainBusiness: '短视频、信息流、企业服务',
    tags: ['AI', '互联网', '内容', '广告', '出海'],
    founderName: '张一鸣',
    investors: ['红杉资本', 'KKR', '软银'],
    upstreams: ['AWS', '阿里云'],
    downstreams: ['品牌广告主', '电商商家'],
    familiarityLevel: 3,
    temperature: 'WARM',
    energyScore: 78,
  },
  {
    name: '红杉资本中国',
    industry: '投资',
    scale: 'SME',
    mainBusiness: '早期及成长期科技投资',
    tags: ['投资', 'VC', '科技', '消费'],
    founderName: '沈南鹏',
    investors: [],
    upstreams: [],
    downstreams: ['字节跳动', '美团', '滴滴'],
    familiarityLevel: 2,
    temperature: 'COLD',
    energyScore: 60,
  },
  {
    name: '美团',
    industry: '互联网',
    scale: 'LISTED',
    mainBusiness: '本地生活服务、外卖、到店',
    tags: ['互联网', '本地生活', '外卖', '新零售'],
    founderName: '王兴',
    investors: ['腾讯', '红杉资本'],
    upstreams: ['餐饮供应商', '骑手平台'],
    downstreams: ['消费者', '商家'],
    familiarityLevel: 4,
    temperature: 'HOT',
    energyScore: 85,
  },
  {
    name: '某 AI 初创',
    industry: 'AI',
    scale: 'STARTUP',
    mainBusiness: 'LLM 应用、企业 AI 助手',
    tags: ['AI', 'SaaS', 'B2B', '大模型'],
    founderName: '李明',
    investors: ['源码资本', 'IDG'],
    upstreams: ['OpenAI', 'Anthropic'],
    downstreams: ['企业客户'],
    familiarityLevel: 5,
    temperature: 'HOT',
    energyScore: 92,
  },
  {
    name: '华为',
    industry: '科技制造',
    scale: 'LARGE',
    mainBusiness: '通信设备、智能终端、云服务',
    tags: ['硬件', '5G', '芯片', '云计算', '制造'],
    founderName: '任正非',
    investors: [],
    upstreams: ['台积电', '三星', '高通'],
    downstreams: ['运营商', '企业客户'],
    familiarityLevel: 2,
    temperature: 'COLD',
    energyScore: 55,
  },
]

const SAMPLE_EXTRACT_TEXT = `字节跳动成立于2012年，总部位于北京，是一家以技术为驱动的互联网公司，旗下产品包括抖音、今日头条、TikTok等。公司创始人为张一鸣，目前员工超过10万人，估值超过2000亿美元。主要投资方包括红杉资本、KKR和软银集团。公司上游合作伙伴包括阿里云、AWS等云服务商，下游客户主要为品牌广告主和电商商家。所在行业：互联网/科技。`

type Company = {
  id: string
  name: string
  industry: string | null
  scale: string | null
  energyScore: number
  temperature: string | null
}

export default function CompanyTestPanel() {
  const [generating, setGenerating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingList, setLoadingList] = useState(false)

  // AI extract test
  const [extractText, setExtractText] = useState(SAMPLE_EXTRACT_TEXT)
  const [extracting, setExtracting] = useState(false)
  const [extractResult, setExtractResult] = useState<Record<string, unknown> | null>(null)
  const [extractError, setExtractError] = useState('')

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)])
  }

  async function generateTestCompanies() {
    setGenerating(true)
    addLog('开始生成测试企业数据…')
    let created = 0
    for (const co of TEST_COMPANIES) {
      try {
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(co),
        })
        if (res.ok) {
          created++
          addLog(`✓ 创建：${co.name}`)
        } else {
          const err = await res.json()
          addLog(`✗ 失败：${co.name} — ${err.error}`)
        }
      } catch {
        addLog(`✗ 网络错误：${co.name}`)
      }
    }
    addLog(`完成！共创建 ${created}/${TEST_COMPANIES.length} 家企业`)
    setGenerating(false)
    loadCompanies()
  }

  async function loadCompanies() {
    setLoadingList(true)
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      setCompanies(data.companies || [])
    } catch {
      addLog('✗ 加载列表失败')
    } finally {
      setLoadingList(false)
    }
  }

  async function deleteCompany(id: string, name: string) {
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    if (res.ok) {
      addLog(`🗑 删除：${name}`)
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    } else {
      addLog(`✗ 删除失败：${name}`)
    }
  }

  async function clearAll() {
    if (!confirm(`确定删除全部 ${companies.length} 家企业？`)) return
    setClearing(true)
    let deleted = 0
    for (const c of companies) {
      const res = await fetch(`/api/companies/${c.id}`, { method: 'DELETE' })
      if (res.ok) deleted++
    }
    addLog(`🗑 已清空 ${deleted} 家企业`)
    setCompanies([])
    setClearing(false)
  }

  async function testExtract() {
    if (!extractText.trim()) return
    setExtracting(true)
    setExtractResult(null)
    setExtractError('')
    try {
      const res = await fetch('/api/companies/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExtractResult(data.extracted)
      addLog(`✓ AI 提取成功：${data.extracted.name}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 提取失败'
      setExtractError(msg)
      addLog(`✗ AI 提取失败：${msg}`)
    } finally {
      setExtracting(false)
    }
  }

  const TEMP_COLOR: Record<string, string> = {
    COLD: 'text-sky-600 bg-sky-50',
    WARM: 'text-amber-600 bg-amber-50',
    HOT: 'text-rose-600 bg-rose-50',
  }
  const TEMP_LABEL: Record<string, string> = { COLD: '冷', WARM: '温', HOT: '热' }
  const SCALE_LABEL: Record<string, string> = {
    STARTUP: '初创', SME: '中小', MID: '中型', LARGE: '大型', LISTED: '上市',
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Generate + Clear ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">企业测试数据生成</h2>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={generateTestCompanies}
            disabled={generating}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-medium"
          >
            {generating ? '生成中…' : `一键生成 ${TEST_COMPANIES.length} 家测试企业`}
          </button>
          <button
            onClick={loadCompanies}
            disabled={loadingList}
            className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {loadingList ? '加载中…' : '刷新列表'}
          </button>
          {companies.length > 0 && (
            <button
              onClick={clearAll}
              disabled={clearing}
              className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-auto"
            >
              {clearing ? '清空中…' : `清空全部 (${companies.length})`}
            </button>
          )}
        </div>

        {/* Company list */}
        {companies.length > 0 && (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">公司</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">行业</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">规模</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">温度</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">能量</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 font-medium text-gray-900">
                      <a href={`/companies/${c.id}`} className="hover:text-violet-600 transition-colors">{c.name}</a>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{c.industry ?? '—'}</td>
                    <td className="px-3 py-2">
                      {c.scale && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">{SCALE_LABEL[c.scale] ?? c.scale}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {c.temperature && (
                        <span className={`px-1.5 py-0.5 text-[10px] rounded ${TEMP_COLOR[c.temperature] ?? ''}`}>{TEMP_LABEL[c.temperature] ?? c.temperature}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${c.energyScore}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400">{c.energyScore}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => deleteCompany(c.id, c.name)}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {companies.length === 0 && !loadingList && (
          <p className="text-sm text-gray-400">尚无企业，点击生成或刷新列表</p>
        )}
      </div>

      {/* ── 2. AI Extract Test ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">AI 智能提取测试</h2>
        <p className="text-xs text-gray-400 mb-4">需配置 ANTHROPIC_API_KEY</p>

        <textarea
          value={extractText}
          onChange={(e) => setExtractText(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none mb-3 font-mono"
        />

        <button
          onClick={testExtract}
          disabled={extracting || !extractText.trim()}
          className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {extracting ? 'AI 提取中…' : '测试 AI 提取'}
        </button>

        {extractError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {extractError}
          </div>
        )}

        {extractResult && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-xs font-semibold text-emerald-700 mb-2">提取结果：</p>
            <pre className="text-xs text-emerald-800 overflow-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(extractResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ── 3. Log ── */}
      {log.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">操作日志</p>
            <button onClick={() => setLog([])} className="text-xs text-zinc-500 hover:text-zinc-300">清空</button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {log.map((entry, i) => (
              <p key={i} className={`text-xs font-mono ${entry.includes('✓') ? 'text-emerald-400' : entry.includes('✗') ? 'text-red-400' : 'text-zinc-300'}`}>
                {entry}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Quick links ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">快速导航</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/companies', label: '企业数据库' },
            { href: '/companies/new', label: '新增企业' },
            { href: '/journey', label: '航程 + 企业宇宙' },
            { href: '/contacts', label: '人脉数据库' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-violet-300 hover:text-violet-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
