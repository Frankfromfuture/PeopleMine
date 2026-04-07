'use client'

import { useState, useCallback, useRef } from 'react'
import type { FormulaConfig, FormulaCondition, ScoreResult } from '@/lib/dev/formula-store'

const ROLES = ['BREAKER', 'EVANGELIST', 'ANALYST', 'BINDER'] as const
const ROLE_LABELS: Record<string, string> = {
  BREAKER: '破局者', EVANGELIST: '布道者', ANALYST: '分析师', BINDER: '粘合剂',
}
const GOAL_TYPES = ['introduction', 'resource', 'advice', 'collaboration', 'information'] as const
const GOAL_LABELS: Record<string, string> = {
  introduction: '引荐', resource: '资源', advice: '建议',
  collaboration: '合作', information: '信息',
}

function genId() { return 'c-' + Math.random().toString(36).slice(2, 8) }

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-24 shrink-0">{label}</span>
      <input
        type="range" min={0} max={1} step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-gray-600"
      />
      <input
        type="number" min={0} max={1} step={0.01}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
        className="w-16 text-xs text-right border border-zinc-200 rounded px-2 py-1 outline-none focus:border-gray-400"
      />
    </div>
  )
}

function ScoreBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-gray-500' : pct >= 40 ? 'bg-gray-500' : 'bg-gray-500'
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="w-16 bg-zinc-200 rounded-full h-1.5 shrink-0">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 w-8">{value.toFixed(2)}</span>
      {label && <span className="text-xs text-zinc-400">{label}</span>}
    </div>
  )
}

interface FormulaEditorProps {
  initialConfig: FormulaConfig
}

export default function FormulaEditor({ initialConfig }: FormulaEditorProps) {
  const [cfg, setCfg] = useState<FormulaConfig>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testGoal, setTestGoal] = useState('我想找一个能帮我融资的人')
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<ScoreResult[]>([])
  const [testError, setTestError] = useState('')
  const testAbort = useRef<AbortController | null>(null)

  const update = useCallback(<K extends keyof FormulaConfig>(key: K, value: FormulaConfig[K]) => {
    setCfg((c) => ({ ...c, [key]: value }))
  }, [])

  const save = useCallback(async () => {
    setSaving(true); setSaved(false)
    try {
      await fetch('/api/dev/formula', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }, [cfg])

  const runTest = useCallback(async () => {
    testAbort.current?.abort()
    const ctrl = new AbortController()
    testAbort.current = ctrl
    setTesting(true); setTestError(''); setTestResults([])
    try {
      const res = await fetch('/api/dev/formula-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: testGoal, formulaConfig: cfg }),
        signal: ctrl.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '测试失败')
      setTestResults(data.results ?? [])
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setTestError(String(e))
    } finally { setTesting(false) }
  }, [cfg, testGoal])

  // ─── Condition helpers ─────────────────────────────────────────────────────
  function addCondition() {
    const newCond: FormulaCondition = {
      id: genId(), enabled: true, label: '新条件',
      variable: 'temperature', operator: '==', value: 'COLD',
      adjustment: 'multiply', amount: 0.8, target: 'journeyScore',
    }
    update('conditions', [...cfg.conditions, newCond])
  }

  function updateCondition(id: string, patch: Partial<FormulaCondition>) {
    update('conditions', cfg.conditions.map((c) => c.id === id ? { ...c, ...patch } : c))
  }

  function deleteCondition(id: string) {
    update('conditions', cfg.conditions.filter((c) => c.id !== id))
  }

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* ─── Left: Formula definition ──────────────────────────────────────── */}
      <div className="space-y-5 overflow-y-auto pr-2">

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={save} disabled={saving}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${saved ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
          >
            {saved ? '✓ 公式已保存' : saving ? '保存中…' : '保存公式'}
          </button>
        </div>

        {/* Journey weights */}
        <Section title="综合航程得分权重">
          <code className="block text-xs bg-zinc-900 text-gray-400 rounded-lg px-3 py-2 mb-3 font-mono leading-relaxed">
            journeyScore = relevance × {cfg.journeyWeights.relevance.toFixed(2)} + accessibility × {cfg.journeyWeights.accessibility.toFixed(2)} + centrality × {cfg.journeyWeights.centrality.toFixed(2)}
          </code>
          <WeightSlider label="relevance (相关性)" value={cfg.journeyWeights.relevance}
            onChange={(v) => update('journeyWeights', { ...cfg.journeyWeights, relevance: v })} />
          <WeightSlider label="accessibility (可达性)" value={cfg.journeyWeights.accessibility}
            onChange={(v) => update('journeyWeights', { ...cfg.journeyWeights, accessibility: v })} />
          <WeightSlider label="centrality (中心度)" value={cfg.journeyWeights.centrality}
            onChange={(v) => update('journeyWeights', { ...cfg.journeyWeights, centrality: v })} />
          <p className="text-xs text-zinc-400 mt-1">
            三项之和：{(cfg.journeyWeights.relevance + cfg.journeyWeights.accessibility + cfg.journeyWeights.centrality).toFixed(2)}
            {Math.abs(cfg.journeyWeights.relevance + cfg.journeyWeights.accessibility + cfg.journeyWeights.centrality - 1) > 0.01 && (
              <span className="text-gray-500 ml-2">⚠ 建议权重之和 = 1.00</span>
            )}
          </p>
          <ExprEditor
            label="自定义公式表达式"
            value={cfg.journeyExpr}
            onChange={(v) => update('journeyExpr', v)}
            hint="可用变量: relevance, accessibility, centrality, w_relevance, w_accessibility, w_centrality"
          />
        </Section>

        {/* Relevance weights */}
        <Section title="相关性分数 (relevance)">
          <code className="block text-xs bg-zinc-900 text-gray-400 rounded-lg px-3 py-2 mb-3 font-mono">
            relevance = keyword × {cfg.relevanceWeights.keyword.toFixed(2)} + roleAffinity × {cfg.relevanceWeights.roleAffinity.toFixed(2)}
          </code>
          <WeightSlider label="keyword (关键词匹配)" value={cfg.relevanceWeights.keyword}
            onChange={(v) => update('relevanceWeights', { ...cfg.relevanceWeights, keyword: v })} />
          <WeightSlider label="roleAffinity (角色亲和)" value={cfg.relevanceWeights.roleAffinity}
            onChange={(v) => update('relevanceWeights', { ...cfg.relevanceWeights, roleAffinity: v })} />
          <ExprEditor
            label="自定义公式表达式"
            value={cfg.relevanceExpr}
            onChange={(v) => update('relevanceExpr', v)}
            hint="可用变量: keyword, roleAffinity, w_keyword, w_role"
          />
        </Section>

        {/* Accessibility */}
        <Section title="可达性分数 (accessibility)">
          <code className="block text-xs bg-zinc-900 text-gray-400 rounded-lg px-3 py-2 mb-3 font-mono">
            accessibility = (energy/100) × tempMult × trustMult × recencyDecay
          </code>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {(['HOT', 'WARM', 'COLD', 'DEFAULT'] as const).map((k) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 w-16">{k}</span>
                <input type="number" step={0.1} min={0} max={3}
                  value={cfg.tempMultipliers[k]}
                  onChange={(e) => update('tempMultipliers', { ...cfg.tempMultipliers, [k]: parseFloat(e.target.value) || 0 })}
                  className="w-16 text-xs border border-zinc-200 rounded px-2 py-1 outline-none focus:border-gray-400"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">衰减起始天数</span>
              <input type="number" min={0} value={cfg.recencyDecay.warmupDays}
                onChange={(e) => update('recencyDecay', { ...cfg.recencyDecay, warmupDays: parseInt(e.target.value) || 0 })}
                className="w-16 border border-zinc-200 rounded px-2 py-1 outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">最大衰减天数</span>
              <input type="number" min={0} value={cfg.recencyDecay.maxDays}
                onChange={(e) => update('recencyDecay', { ...cfg.recencyDecay, maxDays: parseInt(e.target.value) || 0 })}
                className="w-16 border border-zinc-200 rounded px-2 py-1 outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">最低衰减系数</span>
              <input type="number" step={0.05} min={0} max={1} value={cfg.recencyDecay.minDecay}
                onChange={(e) => update('recencyDecay', { ...cfg.recencyDecay, minDecay: parseFloat(e.target.value) || 0 })}
                className="w-16 border border-zinc-200 rounded px-2 py-1 outline-none focus:border-gray-400"
              />
            </div>
          </div>
          <ExprEditor
            label="自定义公式表达式"
            value={cfg.accessibilityExpr}
            onChange={(v) => update('accessibilityExpr', v)}
            hint="可用变量: energy(0-100), tempMult, trustMult, recencyDecay"
          />
        </Section>

        {/* Role affinity matrix */}
        <Section title="角色亲和度矩阵 (roleAffinityMatrix)">
          <p className="text-xs text-zinc-400 mb-2">数值 0-1，越高代表该目标类型对该角色的依赖越强</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr>
                  <th className="text-left py-1 pr-2 text-zinc-500 font-normal">目标 \ 角色</th>
                  {ROLES.map((r) => <th key={r} className="px-1 py-1 text-center text-zinc-500 font-normal">{ROLE_LABELS[r]}</th>)}
                </tr>
              </thead>
              <tbody>
                {GOAL_TYPES.map((goalType) => (
                  <tr key={goalType} className="border-t border-zinc-100">
                    <td className="py-1 pr-2 text-zinc-600 font-medium">{GOAL_LABELS[goalType]}</td>
                    {ROLES.map((role) => {
                      const val = cfg.roleAffinityMatrix[goalType]?.[role] ?? 0.5
                      return (
                        <td key={role} className="px-1 py-1 text-center">
                          <input
                            type="number" step={0.05} min={0} max={1}
                            value={val}
                            onChange={(e) => {
                              const newMatrix = { ...cfg.roleAffinityMatrix }
                              newMatrix[goalType] = { ...(newMatrix[goalType] ?? {}), [role]: parseFloat(e.target.value) || 0 }
                              update('roleAffinityMatrix', newMatrix)
                            }}
                            className={`w-12 text-center border rounded px-1 py-0.5 outline-none focus:border-gray-400 text-xs ${
                              val >= 0.8 ? 'bg-gray-50 border-gray-200 text-gray-700' :
                              val >= 0.5 ? 'bg-gray-50 border-gray-200 text-gray-700' :
                              'border-zinc-200 text-zinc-600'
                            }`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* InferLinks weights */}
        <Section title="人脉推断连接权重 (inferLinks)">
          <div className="grid grid-cols-2 gap-2">
            {([
              ['roleComplement', '角色互补权重'],
              ['tagOverlap', '标签重叠权重'],
              ['temperatureBonus', '温度加成权重'],
              ['energyFactorMin', '能量因子最小值'],
              ['strengthThreshold', '边强度阈值'],
              ['maxDegree', '最大度数限制'],
            ] as [keyof typeof cfg.inferLinksWeights, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-28 shrink-0">{label}</span>
                <input
                  type="number" step={key === 'maxDegree' ? 1 : 0.05} min={0}
                  value={cfg.inferLinksWeights[key]}
                  onChange={(e) => update('inferLinksWeights', { ...cfg.inferLinksWeights, [key]: parseFloat(e.target.value) || 0 })}
                  className="flex-1 text-xs border border-zinc-200 rounded px-2 py-1 outline-none focus:border-gray-400"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Conditions */}
        <Section title="条件筛选 (条件修正器)">
          <p className="text-xs text-zinc-400 mb-3">满足条件时，对分数进行调整</p>
          <div className="space-y-2">
            {cfg.conditions.map((cond) => (
              <ConditionRow
                key={cond.id}
                cond={cond}
                onChange={(patch) => updateCondition(cond.id, patch)}
                onDelete={() => deleteCondition(cond.id)}
              />
            ))}
          </div>
          <button
            onClick={addCondition}
            className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200"
          >
            + 添加条件
          </button>
        </Section>
      </div>

      {/* ─── Right: Test panel ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="border border-zinc-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-800 mb-3">能量计算测试结果</h3>
          <div className="flex gap-2 mb-3">
            <input
              value={testGoal}
              onChange={(e) => setTestGoal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runTest() }}
              placeholder="输入测试目标…"
              className="flex-1 h-9 px-3 text-sm rounded-lg border border-zinc-200 outline-none focus:border-gray-400"
            />
            <button
              onClick={runTest}
              disabled={testing}
              className="px-4 py-2 text-sm rounded-lg bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 transition"
            >
              {testing ? '计算中…' : '运行测试'}
            </button>
          </div>
          <p className="text-xs text-zinc-400">使用当前表单中的公式（未保存的修改也会生效）· 基于开发者 Demo 数据</p>
        </div>

        {testError && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
            {testError}
          </div>
        )}

        {testResults.length > 0 && (
          <div className="flex-1 border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600">评分排行（共 {testResults.length} 人）</span>
              <span className="text-xs text-zinc-400">按 journeyScore 降序</span>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-380px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white border-b border-zinc-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-zinc-500 font-medium">#</th>
                    <th className="text-left px-2 py-2 text-zinc-500 font-medium">姓名</th>
                    <th className="text-left px-2 py-2 text-zinc-500 font-medium">角色</th>
                    <th className="px-2 py-2 text-zinc-500 font-medium">综合分</th>
                    <th className="px-2 py-2 text-zinc-500 font-medium">相关性</th>
                    <th className="px-2 py-2 text-zinc-500 font-medium">可达性</th>
                    <th className="px-2 py-2 text-zinc-500 font-medium">中心度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {testResults.map((r, i) => (
                    <tr key={r.contactId} className={i === 0 ? 'bg-gray-50' : 'hover:bg-zinc-50'}>
                      <td className="px-4 py-2 text-zinc-400">{i + 1}</td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-zinc-800">{r.name}</div>
                        {r.company && <div className="text-zinc-400">{r.company}</div>}
                      </td>
                      <td className="px-2 py-2 text-zinc-500">{ROLE_LABELS[r.roleArchetype] ?? r.roleArchetype}</td>
                      <td className="px-2 py-2">
                        <ScoreBar value={r.journeyScore} />
                      </td>
                      <td className="px-2 py-2 text-zinc-500">{r.relevanceScore.toFixed(2)}</td>
                      <td className="px-2 py-2 text-zinc-500">{r.accessibilityScore.toFixed(2)}</td>
                      <td className="px-2 py-2 text-zinc-500">{r.centralityScore.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!testing && testResults.length === 0 && !testError && (
          <div className="flex-1 border border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-zinc-400 gap-2">
            <span className="text-3xl">⚗️</span>
            <p className="text-sm">输入测试目标，点击「运行测试」查看评分结果</p>
            <p className="text-xs">需要先生成测试数据（首页 · 生成数据按钮）</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-left"
      >
        <span className="text-xs font-semibold text-zinc-700">{title}</span>
        <span className="text-zinc-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-3 space-y-2">{children}</div>}
    </div>
  )
}

function ExprEditor({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button onClick={() => setOpen((o) => !o)} className="text-xs text-gray-600 hover:text-gray-700">
        {open ? '▲ 收起' : '▼ '}{label}
      </button>
      {open && (
        <div className="mt-1.5">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className="w-full font-mono text-xs border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 resize-none"
          />
          {hint && <p className="text-xs text-zinc-400 mt-0.5">{hint}</p>}
        </div>
      )}
    </div>
  )
}

function ConditionRow({ cond, onChange, onDelete }: {
  cond: FormulaCondition
  onChange: (patch: Partial<FormulaCondition>) => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${cond.enabled ? 'border-gray-200 bg-gray-50' : 'border-zinc-200 bg-zinc-50 opacity-60'}`}>
      <input type="checkbox" checked={cond.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} className="mt-0.5 accent-gray-600" />
      <div className="flex-1 flex flex-wrap gap-2 items-center">
        <span className="text-zinc-500">如果</span>
        <select value={cond.variable} onChange={(e) => onChange({ variable: e.target.value })}
          className="border border-zinc-200 rounded px-1.5 py-0.5 outline-none bg-white">
          <option value="temperature">temperature</option>
          <option value="trustLevel">trustLevel</option>
          <option value="energyScore">energyScore</option>
          <option value="roleArchetype">roleArchetype</option>
        </select>
        <select value={cond.operator} onChange={(e) => onChange({ operator: e.target.value as FormulaCondition['operator'] })}
          className="border border-zinc-200 rounded px-1.5 py-0.5 outline-none bg-white">
          {(['==', '!=', '>', '<', '>=', '<='] as const).map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
        <input value={cond.value} onChange={(e) => onChange({ value: e.target.value })}
          className="w-20 border border-zinc-200 rounded px-1.5 py-0.5 outline-none" />
        <span className="text-zinc-500">则</span>
        <select value={cond.target} onChange={(e) => onChange({ target: e.target.value as FormulaCondition['target'] })}
          className="border border-zinc-200 rounded px-1.5 py-0.5 outline-none bg-white">
          <option value="journeyScore">journeyScore</option>
          <option value="relevanceScore">relevanceScore</option>
          <option value="accessibilityScore">accessibilityScore</option>
        </select>
        <select value={cond.adjustment} onChange={(e) => onChange({ adjustment: e.target.value as FormulaCondition['adjustment'] })}
          className="border border-zinc-200 rounded px-1.5 py-0.5 outline-none bg-white">
          <option value="multiply">× 乘以</option>
          <option value="add">+ 加上</option>
          <option value="subtract">- 减去</option>
        </select>
        <input type="number" step={0.05} value={cond.amount} onChange={(e) => onChange({ amount: parseFloat(e.target.value) || 0 })}
          className="w-16 border border-zinc-200 rounded px-1.5 py-0.5 outline-none" />
      </div>
      <button onClick={onDelete} className="text-gray-400 hover:text-gray-600 px-1">删除</button>
    </div>
  )
}
