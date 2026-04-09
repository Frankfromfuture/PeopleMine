'use client'

/**
 * 关系强度实验室 — Dashboard 右上角 <dev> 面板
 *
 * 全面展示「人脉之间关系强弱」的运算因子与调参界面：
 *  - 8 个维度权重滑块
 *  - 角色互补矩阵 4×4
 *  - 气场动物相性矩阵 4×4
 *  - 温度匹配矩阵 3×3
 *  - 职能相关性矩阵 8×8
 *  - 层级差计算配置
 *  - 行业重叠配置
 *  - 时效衰减配置
 *  - 企业宇宙联动配置
 *  - 实时双人对比测试
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RelationStrengthConfig, ContactForStrength, StrengthBreakdown } from '@/lib/dev/relation-strength-store'
import { DEFAULT_RELATION_STRENGTH_CONFIG, computePairStrength } from '@/lib/dev/relation-strength-store'

// ─── Label maps ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  BREAKER: '破局者', EVANGELIST: '布道者', ANALYST: '分析师', BINDER: '粘合剂',
}
const ANIMAL_LABELS: Record<string, string> = {
  TIGER: '🐯老虎', PEACOCK: '🦚孔雀', OWL: '🦉猫头鹰', KOALA: '🐨考拉',
}
const TEMP_LABELS: Record<string, string> = { HOT: '🔥热', WARM: '☀️温', COLD: '❄️冷' }
const FUNC_LABELS: Record<string, string> = {
  MANAGEMENT: '管理', INVESTMENT: '投资', SALES: '销售', ENGINEER: '工程',
  MARKETING: '市场', BUSINESS_DEV: '招商', ADMIN: '行政', OTHER: '其他',
}
const POS_LABELS: Record<string, string> = {
  FOUNDER: '创始人', PARTNER: '合伙人', GENERAL_MANAGER: '总经理',
  VP: '副总裁', DIRECTOR: '总监', MANAGER: '经理', OTHER: '其他',
}

const FACTOR_LABELS: Record<string, string> = {
  roleComplement:      '角色互补性',
  industryOverlap:     '行业重叠度',
  temperatureMatch:    '温度匹配',
  positionLevel:       '层级协调',
  functionAffinity:    '职能相关性',
  spiritAnimalAffinity:'气场相性',
  trustBonus:          '契合度加成',
  recencyDecay:        '时效衰减',
}

type Tab = 'weights' | 'matrices' | 'misc' | 'test' | 'universe'

// ─── Micro components ─────────────────────────────────────────────────────────

function Slider({
  label, value, onChange, min = 0, max = 1, step = 0.01, badge,
}: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; badge?: string
}) {
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-[11px] text-gray-500 w-24 shrink-0 leading-tight">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-gray-700 cursor-pointer"
      />
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, parseFloat(e.target.value) || 0)))}
        className="w-14 text-[11px] text-right border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-gray-400 bg-white"
      />
      {badge && <span className="text-[10px] text-gray-400 w-12 shrink-0">{badge}</span>}
    </div>
  )
}


/** 4×4 or N×N editable cell matrix */
function MatrixEditor<K extends string>({
  keys, labels, matrix, onChange,
}: {
  keys: K[]
  labels: Record<string, string>
  matrix: Record<K, Record<K, number>>
  onChange: (updated: Record<K, Record<K, number>>) => void
}) {
  const update = (row: K, col: K, val: number) => {
    const next = { ...matrix, [row]: { ...matrix[row], [col]: val } }
    // Keep symmetric
    const nextNext = { ...next, [col]: { ...next[col], [row]: val } }
    onChange(nextNext as Record<K, Record<K, number>>)
  }
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="w-16 text-gray-400 font-normal pb-1" />
            {keys.map(k => (
              <th key={k} className="px-1 pb-1 text-gray-500 font-medium text-center whitespace-nowrap">
                {labels[k] ?? k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map(row => (
            <tr key={row}>
              <td className="pr-2 text-gray-500 font-medium whitespace-nowrap py-0.5">{labels[row] ?? row}</td>
              {keys.map(col => {
                const v = matrix[row]?.[col] ?? 0.5
                const isDiag = row === col
                return (
                  <td key={col} className="px-0.5 py-0.5">
                    <input
                      type="number" min={0} max={1} step={0.05}
                      value={v}
                      onChange={e => update(row, col, Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                      className="w-12 h-6 text-center text-[10px] rounded border outline-none focus:border-gray-400"
                      style={{
                        background: isDiag
                          ? '#f3f4f6'
                          : `rgba(55,65,81,${0.08 + v * 0.30})`,
                        color: v > 0.6 ? '#111' : '#555',
                        borderColor: isDiag ? '#e5e7eb' : `rgba(55,65,81,${0.2 + v * 0.3})`,
                        fontWeight: isDiag ? 400 : v > 0.7 ? 700 : 400,
                        cursor: isDiag ? 'default' : 'text',
                      }}
                      disabled={isDiag}
                      title={`${labels[row]} × ${labels[col]} = ${v}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RelationStrengthPanel() {
  const [cfg, setCfg] = useState<RelationStrengthConfig>(DEFAULT_RELATION_STRENGTH_CONFIG)
  const [tab, setTab] = useState<Tab>('weights')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Live test state
  const [contacts, setContacts] = useState<ContactForStrength[]>([])
  const [contactIdA, setContactIdA] = useState('')
  const [contactIdB, setContactIdB] = useState('')
  const [testResult, setTestResult] = useState<StrengthBreakdown | null>(null)
  const loadedRef = useRef(false)

  // Load config + contacts
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    fetch('/api/dev/relation-strength')
      .then(r => r.json())
      .then(d => { if (d.config) setCfg(d.config) })
      .catch(() => {})

    fetch('/api/contacts?limit=200')
      .then(r => r.json())
      .then(d => {
        const list = (d.contacts ?? d.data ?? []) as ContactForStrength[]
        setContacts(list)
        if (list.length >= 2) {
          setContactIdA(list[0].id)
          setContactIdB(list[1].id)
        }
      })
      .catch(() => {})
  }, [])

  // Recompute test result whenever inputs change
  useEffect(() => {
    if (!contactIdA || !contactIdB || contactIdA === contactIdB) { setTestResult(null); return }
    const a = contacts.find(c => c.id === contactIdA)
    const b = contacts.find(c => c.id === contactIdB)
    if (!a || !b) { setTestResult(null); return }
    setTestResult(computePairStrength(a, b, cfg))
  }, [contactIdA, contactIdB, cfg, contacts])

  const update = useCallback(<K extends keyof RelationStrengthConfig>(key: K, val: RelationStrengthConfig[K]) => {
    setCfg(prev => ({ ...prev, [key]: val }))
  }, [])

  const updateWeights = useCallback((key: keyof RelationStrengthConfig['weights'], val: number) => {
    setCfg(prev => ({ ...prev, weights: { ...prev.weights, [key]: val } }))
  }, [])

  const save = useCallback(async () => {
    setSaving(true); setSaved(false)
    try {
      await fetch('/api/dev/relation-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }, [cfg])

  const reset = useCallback(() => {
    setCfg(DEFAULT_RELATION_STRENGTH_CONFIG)
  }, [])

  const totalW = Object.values(cfg.weights).reduce((s, v) => s + v, 0)
  const weightWarning = Math.abs(totalW - 1) > 0.05

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'weights',  label: '⚖️ 维度权重' },
    { id: 'matrices', label: '🔢 相性矩阵' },
    { id: 'misc',     label: '🔧 细项配置' },
    { id: 'test',     label: '🧪 实时测试' },
    { id: 'universe', label: '🌌 人脉宇宙' },
  ]

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 overflow-hidden" style={{ fontSize: 12 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-gray-100 shrink-0">
        <span className="text-base">🔬</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-xs leading-tight">关系强度实验室</div>
          <div className="text-gray-400" style={{ fontSize: 10 }}>人脉关系运算因子调控台</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={reset}
            className="px-2 py-1 rounded text-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50"
          >重置</button>
          <button
            onClick={save}
            disabled={saving}
            className="px-2.5 py-1 rounded text-[10px] bg-[#A04F47] text-white hover:bg-[#A04F47]/90 disabled:opacity-50"
          >{saving ? '保存中…' : saved ? '✓ 已保存' : '保存'}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2.5 py-1.5 whitespace-nowrap transition-colors ${tab === t.id ? 'border-b-2 border-gray-700 text-gray-800 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
            style={{ fontSize: 11 }}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">

        {/* ── Tab: Weights ── */}
        {tab === 'weights' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-400">
                调整 8 个维度的权重，决定各因素对关系强度的贡献比例。
              </p>
              {weightWarning && (
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  权重总和 {totalW.toFixed(2)} ≠ 1
                </span>
              )}
            </div>
            <div className="space-y-2">
              {(Object.keys(cfg.weights) as Array<keyof typeof cfg.weights>).map(key => (
                <div key={key}>
                  <Slider
                    label={FACTOR_LABELS[key] ?? key}
                    value={cfg.weights[key]}
                    onChange={v => updateWeights(key, v)}
                    badge={`${Math.round(cfg.weights[key] * 100)}%`}
                  />
                  <div className="ml-24 mt-0.5">
                    <div className="h-0.5 bg-gray-100 rounded-full" style={{ width: '100%' }}>
                      <div className="h-0.5 bg-gray-400 rounded-full" style={{ width: `${Math.round(cfg.weights[key] * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 space-y-1.5">
              <p className="text-[11px] font-medium text-gray-600">运算公式</p>
              <code className="text-[10px] text-gray-500 leading-relaxed block">
                strength = Σ(weight_i × factor_i) / Σweight_i
              </code>
              <p className="text-[10px] text-gray-400">
                每个因子值 ∈ [0,1]，最终强度分 ∈ [0,1]，权重可不等于 1（自动归一化）
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Matrices ── */}
        {tab === 'matrices' && (
          <div className="space-y-5">
            {/* Role Complement */}
            <div>
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1">角色互补矩阵</h3>
              <p className="text-[10px] text-gray-400 mb-2">4 种角色两两组合时的互补程度（对角线 = 同角色，不可编辑）</p>
              <MatrixEditor
                keys={['BREAKER', 'EVANGELIST', 'ANALYST', 'BINDER']}
                labels={ROLE_LABELS}
                matrix={cfg.roleComplementMatrix}
                onChange={m => update('roleComplementMatrix', m)}
              />
            </div>

            {/* Spirit Animal */}
            <div>
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1">气场动物相性矩阵</h3>
              <p className="text-[10px] text-gray-400 mb-2">4 种气场两两组合时的人格化学反应</p>
              <MatrixEditor
                keys={['TIGER', 'PEACOCK', 'OWL', 'KOALA']}
                labels={ANIMAL_LABELS}
                matrix={cfg.animalAffinityMatrix}
                onChange={m => update('animalAffinityMatrix', m)}
              />
            </div>

            {/* Temperature */}
            <div>
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1">温度匹配矩阵</h3>
              <p className="text-[10px] text-gray-400 mb-2">双方温度组合对关系活跃度的共同效应</p>
              <MatrixEditor
                keys={['HOT', 'WARM', 'COLD']}
                labels={TEMP_LABELS}
                matrix={cfg.temperatureMatrix}
                onChange={m => update('temperatureMatrix', m)}
              />
            </div>

            {/* Function Affinity */}
            <div>
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1">职能相关性矩阵</h3>
              <p className="text-[10px] text-gray-400 mb-2">8 种职能之间的天然协作倾向（值越高=越容易产生业务交集）</p>
              <MatrixEditor
                keys={['MANAGEMENT', 'INVESTMENT', 'SALES', 'ENGINEER', 'MARKETING', 'BUSINESS_DEV', 'ADMIN', 'OTHER']}
                labels={FUNC_LABELS}
                matrix={cfg.functionAffinityMatrix}
                onChange={m => update('functionAffinityMatrix', m)}
              />
            </div>
          </div>
        )}

        {/* ── Tab: Misc Config ── */}
        {tab === 'misc' && (
          <div className="space-y-4">
            {/* Position ordinals */}
            <div>
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1">层级权重（序数）</h3>
              <p className="text-[10px] text-gray-400 mb-2">数值越高 = 职级越高。差值 ±1 时关系得分最高（上下级最容易建立协作）</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(cfg.positionOrdinals) as Array<keyof typeof cfg.positionOrdinals>).map(pos => (
                  <div key={pos} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-20 shrink-0">{POS_LABELS[pos] ?? pos}</span>
                    <input
                      type="number" min={1} max={10}
                      value={cfg.positionOrdinals[pos]}
                      onChange={e => update('positionOrdinals', { ...cfg.positionOrdinals, [pos]: parseInt(e.target.value) || 1 })}
                      className="w-14 h-6 text-center text-[11px] border border-gray-200 rounded outline-none focus:border-gray-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Industry config */}
            <div>
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1">行业重叠配置</h3>
              <div className="space-y-2">
                <Slider label="同 L1 基础分" value={cfg.industryConfig.sameL1Score} max={1}
                  onChange={v => update('industryConfig', { ...cfg.industryConfig, sameL1Score: v })} />
                <Slider label="同 L2 加成" value={cfg.industryConfig.sameL2Bonus} max={0.5}
                  onChange={v => update('industryConfig', { ...cfg.industryConfig, sameL2Bonus: v })} />
                <Slider label="跨行业桥梁" value={cfg.industryConfig.crossIndustryBridgeBonus} max={0.4}
                  onChange={v => update('industryConfig', { ...cfg.industryConfig, crossIndustryBridgeBonus: v })} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                同行业得分 = L1基础分 + L2加成（L2一致时）；跨行业 = 桥梁分
              </p>
            </div>

            {/* Recency decay */}
            <div>
              <h3 className="text-[11px] font-semibold text-gray-700 mb-1">时效衰减配置</h3>
              <div className="space-y-2">
                <Slider label="新鲜期（天）" value={cfg.recencyConfig.freshDays} min={1} max={120} step={1}
                  onChange={v => update('recencyConfig', { ...cfg.recencyConfig, freshDays: v })} />
                <Slider label="衰减完成（天）" value={cfg.recencyConfig.staleDays} min={30} max={730} step={1}
                  onChange={v => update('recencyConfig', { ...cfg.recencyConfig, staleDays: v })} />
                <Slider label="最小分值" value={cfg.recencyConfig.minScore} max={0.8}
                  onChange={v => update('recencyConfig', { ...cfg.recencyConfig, minScore: v })} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                新鲜期内 = 1.0，超过衰减完成天数 = 最小分，线性插值
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Live Test ── */}
        {tab === 'test' && (
          <div className="space-y-4">
            <p className="text-[11px] text-gray-400">选择两位联系人，实时查看关系强度分解。</p>

            {contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">暂无联系人数据</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '联系人 A', id: contactIdA, setter: setContactIdA },
                    { label: '联系人 B', id: contactIdB, setter: setContactIdB },
                  ].map(({ label, id, setter }) => (
                    <div key={label}>
                      <div className="text-[10px] text-gray-400 mb-1">{label}</div>
                      <select
                        value={id}
                        onChange={e => setter(e.target.value)}
                        className="w-full h-7 border border-gray-200 rounded text-[11px] px-1.5 outline-none focus:border-gray-400 bg-white"
                      >
                        <option value="">— 选择 —</option>
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>
                            {(c as { fullName?: string }).fullName ?? c.name}
                            {c.roleArchetype ? ` · ${ROLE_LABELS[c.roleArchetype] ?? c.roleArchetype}` : ''}
                          </option>
                        ))}
                      </select>
                      {/* Mini profile */}
                      {(() => {
                        const c = contacts.find(x => x.id === id)
                        if (!c) return null
                        return (
                          <div className="mt-1.5 p-2 rounded bg-gray-50 border border-gray-100 space-y-0.5">
                            {c.spiritAnimal && <div className="text-[10px] text-gray-500">{ANIMAL_LABELS[c.spiritAnimal] ?? c.spiritAnimal}</div>}
                            {c.roleArchetype && <div className="text-[10px] text-gray-500">角色：{ROLE_LABELS[c.roleArchetype] ?? c.roleArchetype}</div>}
                            {c.temperature && <div className="text-[10px] text-gray-500">温度：{TEMP_LABELS[c.temperature] ?? c.temperature}</div>}
                            {c.industryL1 && <div className="text-[10px] text-gray-500">行业：{c.industryL1}{c.industryL2 ? ` / ${c.industryL2}` : ''}</div>}
                            {c.jobPosition && <div className="text-[10px] text-gray-500">层级：{POS_LABELS[c.jobPosition] ?? c.jobPosition}</div>}
                            {c.jobFunction && <div className="text-[10px] text-gray-500">职能：{FUNC_LABELS[c.jobFunction] ?? c.jobFunction}</div>}
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>

                {testResult && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    {/* Score summary */}
                    <div className="bg-gray-50 px-3 py-2.5 flex items-center gap-3 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="text-[10px] text-gray-400 mb-1">综合关系强度</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(testResult.score * 100)}%`,
                                background: testResult.score > 0.65 ? '#374151' : testResult.score > 0.40 ? '#6b7280' : '#9ca3af',
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold tabular-nums text-gray-800">
                            {Math.round(testResult.score * 100)}
                          </span>
                          <span className="text-[10px] text-gray-400">/ 100</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-semibold ${testResult.score > 0.65 ? 'text-gray-800' : testResult.score > 0.40 ? 'text-gray-600' : 'text-gray-400'}`}>
                          {testResult.score > 0.65 ? '强' : testResult.score > 0.40 ? '中' : '弱'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {testResult.score > 0.65 ? '关键链接' : testResult.score > 0.40 ? '有效连接' : '弱关联'}
                        </div>
                      </div>
                    </div>

                    {/* Factor breakdown */}
                    <div className="px-3 py-2 space-y-1.5">
                      {(Object.entries(testResult.factors) as Array<[string, number]>).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 w-24 shrink-0">{FACTOR_LABELS[key] ?? key}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(val * 100)}%`,
                                background: val > 0.7 ? '#374151' : val > 0.45 ? '#6b7280' : '#d1d5db',
                              }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-gray-500 w-8 text-right">{Math.round(val * 100)}</span>
                          <span className="text-[10px] text-gray-300 w-8 text-right shrink-0">
                            ×{(cfg.weights[key as keyof typeof cfg.weights] ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Weighted contribution */}
                    <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50">
                      <p className="text-[10px] text-gray-400 mb-1.5">加权贡献（factor × weight / totalWeight）</p>
                      <div className="flex gap-0.5 h-4 rounded overflow-hidden">
                        {(Object.entries(testResult.factors) as Array<[string, number]>).map(([key, val]) => {
                          const w = cfg.weights[key as keyof typeof cfg.weights] ?? 0
                          const contribution = val * w / Math.max(0.001, Object.values(cfg.weights).reduce((s, v) => s + v, 0))
                          const pct = Math.max(1, Math.round(contribution * 100))
                          const colors = ['#374151','#4b5563','#6b7280','#9ca3af','#d1d5db','#e5e7eb','#f3f4f6','#f9fafb']
                          const colorIdx = Object.keys(testResult.factors).indexOf(key)
                          return (
                            <div
                              key={key}
                              style={{ width: `${pct}%`, background: colors[colorIdx % colors.length], minWidth: 2 }}
                              title={`${FACTOR_LABELS[key] ?? key}: ${Math.round(contribution * 100)}%`}
                              className="cursor-help"
                            />
                          )
                        })}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                        {(Object.keys(testResult.factors) as string[]).map((key, i) => {
                          const colors = ['#374151','#4b5563','#6b7280','#9ca3af','#d1d5db','#e5e7eb','#f3f4f6','#f9fafb']
                          return (
                            <span key={key} className="text-[9px] text-gray-500 flex items-center gap-0.5">
                              <span className="w-2 h-2 rounded-sm inline-block shrink-0" style={{ background: colors[i % colors.length] }} />
                              {FACTOR_LABELS[key] ?? key}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Universe Link ── */}
        {tab === 'universe' && (
          <div className="space-y-4">
            <p className="text-[11px] text-gray-400">
              人脉宇宙（航程图）中两位联系人之间的连线粗细/颜色 = 关系强度分实时驱动。<br/>
              <span className="text-gray-300">企业宇宙的公司间关联仅基于行业 L1/L2 与产业链上下游，不受此处配置影响。</span>
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600">启用关系强度驱动连线</span>
                <button
                  onClick={() => update('universeConfig', { ...cfg.universeConfig, enableDynamicEdges: !cfg.universeConfig.enableDynamicEdges })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${cfg.universeConfig.enableDynamicEdges ? 'bg-gray-700' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.universeConfig.enableDynamicEdges ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <Slider
                label="边显示阈值"
                value={cfg.universeConfig.edgeThreshold}
                onChange={v => update('universeConfig', { ...cfg.universeConfig, edgeThreshold: v })}
                badge={`≥${Math.round(cfg.universeConfig.edgeThreshold * 100)}`}
              />
              <p className="text-[10px] text-gray-400 ml-24">低于此强度分的推断连线在人脉宇宙中隐藏（不影响已知人工关系）</p>

              <Slider
                label="同公司加成"
                value={cfg.universeConfig.intraCompanyBoost}
                max={0.4}
                onChange={v => update('universeConfig', { ...cfg.universeConfig, intraCompanyBoost: v })}
                badge={`+${Math.round(cfg.universeConfig.intraCompanyBoost * 100)}%`}
              />
              <p className="text-[10px] text-gray-400 ml-24">同公司联系人之间关系强度额外加成</p>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 space-y-1.5">
              <p className="text-[11px] font-medium text-gray-600">边强度 → 视觉映射</p>
              <div className="space-y-1">
                {[
                  { label: '强边 (≥0.65)', w: '2.5px', opacity: '0.85', dash: false },
                  { label: '中边 (0.40–0.65)', w: '1.5px', opacity: '0.55', dash: false },
                  { label: '弱边 (<0.40)', w: '1px', opacity: '0.25', dash: true },
                ].map(e => (
                  <div key={e.label} className="flex items-center gap-2">
                    <svg width="40" height="8">
                      <line x1="0" y1="4" x2="40" y2="4"
                        stroke="#374151" strokeWidth={e.w} opacity={e.opacity}
                        strokeDasharray={e.dash ? '4 3' : undefined} />
                    </svg>
                    <span className="text-[10px] text-gray-500">{e.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5">
              <p className="text-[11px] font-medium text-gray-600 mb-1">联动说明</p>
              <ul className="text-[10px] text-gray-500 space-y-1 list-disc list-inside">
                <li>人脉宇宙（航程图）中，所有连线的粗细、颜色、透明度都由关系强度分实时驱动</li>
                <li>已知人工关系（实线）+ 推断关系（虚线）都会根据强度分染色</li>
                <li>强度 ≥0.65 = 粗深色实线；0.38–0.65 = 中等线；&lt;0.38 = 细浅线</li>
                <li>修改配置后点击「保存」，前往「人脉航程」页面刷新即时生效</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
