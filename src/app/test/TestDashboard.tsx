'use client'

import { useState, useEffect } from 'react'

// ─── 预设测试数据 ─────────────────────────────────────────────

const SEED_CONTACTS = [
  { name: '张伟', roleArchetype: 'EVANGELIST', tags: ['互联网', 'VC'], energyScore: 80, temperature: 'HOT', trustLevel: 4 },
  { name: '李娜', roleArchetype: 'BREAKER', tags: ['投资', '金融'], energyScore: 70, temperature: 'WARM', trustLevel: 3 },
  { name: '王强', roleArchetype: 'ANALYST', tags: ['AI', '产品'], energyScore: 60, temperature: 'WARM', trustLevel: 4 },
  { name: '刘芳', roleArchetype: 'BREAKER', tags: ['互联网', '创业'], energyScore: 50, temperature: 'COLD', trustLevel: 2 },
  { name: '陈磊', roleArchetype: 'BINDER', tags: ['工程师', 'AI'], energyScore: 85, temperature: 'HOT', trustLevel: 5 },
]

const SEED_COMPANIES = [
  { name: '字节跳动', industry: '互联网', scale: 'LARGE', mainBusiness: '短视频、信息流', tags: ['AI', '互联网'], founderName: '张一鸣', investors: ['红杉资本', '软银'], energyScore: 78, temperature: 'WARM', familiarityLevel: 3 },
  { name: '红杉资本', industry: '投资', scale: 'SME', mainBusiness: '早期科技投资', tags: ['VC', '投资'], energyScore: 60, temperature: 'COLD', familiarityLevel: 2 },
  { name: '某AI初创', industry: 'AI', scale: 'STARTUP', mainBusiness: 'LLM企业应用', tags: ['AI', 'SaaS'], founderName: '李明', investors: ['IDG'], energyScore: 92, temperature: 'HOT', familiarityLevel: 5 },
]

const EXTRACT_SAMPLE = '字节跳动成立于2012年，总部北京，旗下有抖音、TikTok，创始人张一鸣，员工超10万，投资方包括红杉资本、软银，上游合作阿里云、AWS，主要客户为品牌广告主。'

// ─── 类型 ─────────────────────────────────────────────────────

type ApiStatus = 'idle' | 'loading' | 'ok' | 'error'
type LogEntry = { time: string; msg: string; type: 'ok' | 'err' | 'info' }
type DbStats = { contacts: number; companies: number; journeys: number }

// ─── 组件 ─────────────────────────────────────────────────────

export default function TestDashboard() {
  const [log, setLog] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<DbStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // API test states
  const [apiStatus, setApiStatus] = useState<Record<string, ApiStatus>>({})
  const [extractResult, setExtractResult] = useState<string>('')
  const [journeyGoal, setJourneyGoal] = useState('我想拿到 A 轮融资，认识合适的投资人')
  const [journeyResult, setJourneyResult] = useState<string>('')

  function log_(msg: string, type: LogEntry['type'] = 'info') {
    const time = new Date().toLocaleTimeString('zh', { hour12: false })
    setLog((p) => [{ time, msg, type }, ...p.slice(0, 49)])
  }

  function setStatus(key: string, s: ApiStatus) {
    setApiStatus((p) => ({ ...p, [key]: s }))
  }

  async function fetchStats() {
    setStatsLoading(true)
    try {
      const [c, co] = await Promise.all([
        fetch('/api/contacts').then(r => r.json()).catch(() => ({ contacts: [] })),
        fetch('/api/companies').then(r => r.json()).catch(() => ({ companies: [] })),
      ])
      setStats({
        contacts: c.contacts?.length ?? 0,
        companies: co.companies?.length ?? 0,
        journeys: 0,
      })
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  // ── 生成人脉测试数据 ──
  async function seedContacts() {
    setStatus('seedContacts', 'loading')
    let ok = 0
    for (const c of SEED_CONTACTS) {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      if (res.ok) { ok++; log_(`✓ 人脉：${c.name}`, 'ok') }
      else { log_(`✗ 人脉：${c.name}`, 'err') }
    }
    log_(`人脉生成完成 ${ok}/${SEED_CONTACTS.length}`, ok === SEED_CONTACTS.length ? 'ok' : 'err')
    setStatus('seedContacts', ok > 0 ? 'ok' : 'error')
    fetchStats()
  }

  // ── 生成企业测试数据 ──
  async function seedCompanies() {
    setStatus('seedCompanies', 'loading')
    let ok = 0
    for (const c of SEED_COMPANIES) {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      if (res.ok) { ok++; log_(`✓ 企业：${c.name}`, 'ok') }
      else { log_(`✗ 企业：${c.name}`, 'err') }
    }
    log_(`企业生成完成 ${ok}/${SEED_COMPANIES.length}`, ok === SEED_COMPANIES.length ? 'ok' : 'err')
    setStatus('seedCompanies', ok > 0 ? 'ok' : 'error')
    fetchStats()
  }

  // ── 清空数据 ──
  async function clearContacts() {
    setStatus('clearContacts', 'loading')
    const res = await fetch('/api/contacts').then(r => r.json()).catch(() => ({ contacts: [] }))
    let deleted = 0
    for (const c of res.contacts ?? []) {
      const r = await fetch(`/api/contacts/${c.id}`, { method: 'DELETE' })
      if (r.ok) deleted++
    }
    log_(`🗑 清空人脉 ${deleted} 条`, 'info')
    setStatus('clearContacts', 'ok')
    fetchStats()
  }

  async function clearCompanies() {
    setStatus('clearCompanies', 'loading')
    const res = await fetch('/api/companies').then(r => r.json()).catch(() => ({ companies: [] }))
    let deleted = 0
    for (const c of res.companies ?? []) {
      const r = await fetch(`/api/companies/${c.id}`, { method: 'DELETE' })
      if (r.ok) deleted++
    }
    log_(`🗑 清空企业 ${deleted} 条`, 'info')
    setStatus('clearCompanies', 'ok')
    fetchStats()
  }

  // ── 测试 AI 提取 ──
  async function testExtract() {
    setStatus('extract', 'loading')
    setExtractResult('')
    try {
      const res = await fetch('/api/companies/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: EXTRACT_SAMPLE }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExtractResult(JSON.stringify(data.extracted, null, 2))
      log_(`✓ AI提取成功：${data.extracted?.name}`, 'ok')
      setStatus('extract', 'ok')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setExtractResult(`错误：${msg}`)
      log_(`✗ AI提取失败：${msg}`, 'err')
      setStatus('extract', 'error')
    }
  }

  // ── 测试航程分析 ──
  async function testJourney() {
    setStatus('journey', 'loading')
    setJourneyResult('')
    log_('开始航程分析…', 'info')
    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: journeyGoal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      const pd = data.journey?.pathData
      setJourneyResult(`置信度: ${((pd?.overallConfidence ?? 0) * 100).toFixed(0)}%\n主路径: ${pd?.primaryPath?.map((s: { contactName: string }) => s.contactName).join(' → ')}\n策略: ${pd?.overallStrategy}`)
      log_(`✓ 航程分析完成，置信度 ${((pd?.overallConfidence ?? 0) * 100).toFixed(0)}%`, 'ok')
      setStatus('journey', 'ok')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setJourneyResult(`错误：${msg}`)
      log_(`✗ 航程分析失败：${msg}`, 'err')
      setStatus('journey', 'error')
    }
  }

  // ── 测试各 API 连通性 ──
  async function pingApi(key: string, url: string, method = 'GET', body?: object) {
    setStatus(key, 'loading')
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        log_(`✓ ${url} → ${res.status}`, 'ok')
        setStatus(key, 'ok')
      } else {
        log_(`✗ ${url} → ${res.status} ${data.error ?? ''}`, 'err')
        setStatus(key, 'error')
      }
    } catch {
      log_(`✗ ${url} 网络错误`, 'err')
      setStatus(key, 'error')
    }
  }

  const S = (key: string) => {
    const s = apiStatus[key]
    if (s === 'loading') return <span className="text-gray-500 text-xs">⏳</span>
    if (s === 'ok') return <span className="text-gray-500 text-xs">✓</span>
    if (s === 'error') return <span className="text-gray-500 text-xs">✗</span>
    return <span className="text-gray-300 text-xs">○</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">🧪 PeopleMine 测试面板</h1>
          <p className="text-xs text-gray-400 mt-0.5">localhost:3000/test · 仅 dev 模式可用</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchStats} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded">
            {statsLoading ? '刷新中…' : '刷新统计'}
          </button>
          {stats && (
            <div className="flex gap-3 text-xs">
              <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded border border-gray-200">👤 人脉 {stats.contacts}</span>
              <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded border border-gray-200">🏢 企业 {stats.companies}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* ── 左列：数据 + API ── */}
        <div className="col-span-2 space-y-5">

          {/* 测试数据 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">测试数据</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">人脉</p>
                <div className="flex gap-2">
                  <Btn onClick={seedContacts} status={apiStatus.seedContacts} color="violet">
                    生成 {SEED_CONTACTS.length} 位联系人
                  </Btn>
                  <Btn onClick={clearContacts} status={apiStatus.clearContacts} color="red" outline>
                    清空
                  </Btn>
                </div>
                <p className="text-[10px] text-gray-400">{SEED_CONTACTS.map(c => c.name).join('、')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">企业</p>
                <div className="flex gap-2">
                  <Btn onClick={seedCompanies} status={apiStatus.seedCompanies} color="blue">
                    生成 {SEED_COMPANIES.length} 家企业
                  </Btn>
                  <Btn onClick={clearCompanies} status={apiStatus.clearCompanies} color="red" outline>
                    清空
                  </Btn>
                </div>
                <p className="text-[10px] text-gray-400">{SEED_COMPANIES.map(c => c.name).join('、')}</p>
              </div>
            </div>
          </div>

          {/* API 连通性 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">API 连通性</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'getContacts', label: 'GET /api/contacts', fn: () => pingApi('getContacts', '/api/contacts') },
                { key: 'getCompanies', label: 'GET /api/companies', fn: () => pingApi('getCompanies', '/api/companies') },
                { key: 'getRelations', label: 'GET /api/company-relations', fn: () => pingApi('getRelations', '/api/company-relations') },
                { key: 'getNetwork', label: 'GET /api/network', fn: () => pingApi('getNetwork', '/api/network') },
                { key: 'getJourney', label: 'GET /api/journey', fn: () => pingApi('getJourney', '/api/journey') },
                { key: 'getMe', label: 'GET /api/auth/me', fn: () => pingApi('getMe', '/api/auth/me') },
              ].map(({ key, label, fn }) => (
                <button key={key} onClick={fn}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-gray-600 border border-gray-100 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  {S(key)} {label}
                </button>
              ))}
            </div>
          </div>

          {/* AI 提取 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">AI 提取 — /api/companies/extract</h2>
              <Btn onClick={testExtract} status={apiStatus.extract} color="violet">测试</Btn>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">样本文本（固定）：{EXTRACT_SAMPLE.slice(0, 60)}…</p>
            {extractResult && (
              <pre className={`text-[10px] font-mono p-3 rounded-lg max-h-36 overflow-auto ${extractResult.startsWith('错误') ? 'bg-gray-50 text-gray-700 border border-gray-200' : 'bg-gray-50 text-gray-800 border border-gray-200'}`}>
                {extractResult}
              </pre>
            )}
          </div>

          {/* 航程分析 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">航程分析 — POST /api/journey</h2>
              <Btn onClick={testJourney} status={apiStatus.journey} color="violet">分析</Btn>
            </div>
            <input
              value={journeyGoal}
              onChange={e => setJourneyGoal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 mb-2"
              placeholder="输入测试目标…"
            />
            {journeyResult && (
              <pre className={`text-[10px] font-mono p-3 rounded-lg max-h-36 overflow-auto whitespace-pre-wrap ${journeyResult.startsWith('错误') ? 'bg-gray-50 text-gray-700 border border-gray-200' : 'bg-gray-50 text-gray-800 border border-gray-200'}`}>
                {journeyResult}
              </pre>
            )}
          </div>
        </div>

        {/* ── 右列：日志 + 导航 ── */}
        <div className="space-y-5">

          {/* 操作日志 */}
          <div className="bg-zinc-900 rounded-xl p-4 h-80">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">操作日志</p>
              <button onClick={() => setLog([])} className="text-[10px] text-zinc-600 hover:text-zinc-400">清空</button>
            </div>
            <div className="space-y-1 overflow-y-auto h-[calc(100%-1.5rem)]">
              {log.length === 0 && <p className="text-xs text-zinc-600">等待操作…</p>}
              {log.map((e, i) => (
                <div key={i} className="flex gap-1.5 text-[10px] font-mono">
                  <span className="text-zinc-600 shrink-0">{e.time}</span>
                  <span className={e.type === 'ok' ? 'text-gray-400' : e.type === 'err' ? 'text-gray-400' : 'text-zinc-300'}>
                    {e.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 页面导航 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">页面</p>
            <div className="space-y-1">
              {[
                { href: '/', label: '🏠 首页仪表盘' },
                { href: '/contacts', label: '👥 人脉数据库' },
                { href: '/contacts/new', label: '➕ 新增人脉' },
                { href: '/companies', label: '🏢 企业数据库' },
                { href: '/companies/new', label: '➕ 新增企业' },
                { href: '/journey', label: '🧭 航程 + 企业宇宙' },
                { href: '/dev-lab', label: '⚗️ 开发者实验室' },
              ].map(({ href, label }) => (
                <a key={href} href={href}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* 环境变量检查 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">环境变量（客户端可见）</p>
            <div className="space-y-1 text-xs font-mono">
              {[
                'NEXT_PUBLIC_APP_URL',
              ].map(k => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="text-gray-600">{process.env[k] ?? '未设置'}</span>
                </div>
              ))}
              <p className="text-[10px] text-gray-300 mt-1">服务端变量（如 QWEN_API_KEY）需在日志中通过 API 响应间接确认</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 按钮组件 ──────────────────────────────────────────────────

function Btn({
  onClick, status, color, outline, children,
}: {
  onClick: () => void
  status?: ApiStatus
  color: 'violet' | 'blue' | 'red'
  outline?: boolean
  children: React.ReactNode
}) {
  const loading = status === 'loading'
  const base = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1'
  const styles = {
    violet: outline ? 'border border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-gray-600 text-white hover:bg-gray-700',
    blue: outline ? 'border border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-gray-600 text-white hover:bg-gray-700',
    red: outline ? 'border border-gray-200 text-gray-500 hover:bg-gray-50' : 'bg-gray-600 text-white hover:bg-gray-700',
  }
  return (
    <button onClick={onClick} disabled={loading} className={`${base} ${styles[color]}`}>
      {loading && <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  )
}
