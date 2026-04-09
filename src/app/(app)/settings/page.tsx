'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Settings2,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { InlineLoadingSpinner } from '@/components/ThinkingToast'
import { INDUSTRY_L1_OPTIONS, INDUSTRY_L2_MAP } from '@/types'

type ContactsView = 'table' | 'card'
type Density = 'comfortable' | 'compact'
type ExportFormat = 'csv' | 'json'

type PreferenceState = {
  contactsView: ContactsView
  density: Density
  showEnergy: boolean
  exportFormat: ExportFormat
  generatorCount: number
  generatorVariability: number
  generatorIndustries: string[]
}

const STORAGE_KEY = 'peoplemine.settings.v2'

const defaultPreferences: PreferenceState = {
  contactsView: 'table',
  density: 'comfortable',
  showEnergy: true,
  exportFormat: 'csv',
  generatorCount: 24,
  generatorVariability: 55,
  generatorIndustries: [],
}

const pageWrap = 'min-h-full bg-[#f6f6f4]'
const shell = 'mx-auto max-w-5xl px-6 py-4 lg:px-8'
const card = 'rounded-3xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
const subtleCard = 'rounded-2xl border border-gray-200 bg-[#fafaf9]'
const inputCls =
  'w-full h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
const sectionTitle = 'text-2xl font-semibold text-gray-900'
const sectionDesc = 'text-sm leading-6 text-gray-500'

function loadPreferences(): PreferenceState {
  if (typeof window === 'undefined') return defaultPreferences

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPreferences
    const parsed = JSON.parse(raw) as Partial<PreferenceState>
    return {
      ...defaultPreferences,
      ...parsed,
      generatorIndustries: Array.isArray(parsed.generatorIndustries)
        ? parsed.generatorIndustries.filter((item): item is string => typeof item === 'string')
        : defaultPreferences.generatorIndustries,
    }
  } catch {
    return defaultPreferences
  }
}

function savePreferences(preferences: PreferenceState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">
      {children}
    </p>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className={sectionTitle}>{title}</h2>
      <p className={sectionDesc}>{description}</p>
    </div>
  )
}

function OptionButton({
  active,
  icon,
  label,
  hint,
  onClick,
}: {
  active: boolean
  icon?: React.ReactNode
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`mt-2 text-xs leading-5 ${active ? 'text-gray-300' : 'text-gray-500'}`}>
        {hint}
      </p>
    </button>
  )
}

function ToggleRow({
  title,
  description,
  value,
  onToggle,
}: {
  title: string
  description: string
  value: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative mt-1 h-6 w-11 rounded-full transition-colors ${
          value ? 'bg-gray-900' : 'bg-gray-300'
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            value ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<PreferenceState>(defaultPreferences)
  const [isReady, setIsReady] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const next = loadPreferences()
    setPreferences(next)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    savePreferences(preferences)
  }, [isReady, preferences])

  const availableL2 = useMemo(
    () =>
      preferences.generatorIndustries.flatMap((l1) =>
        (INDUSTRY_L2_MAP[l1] ?? []).map((l2) => ({ l1, l2 }))
      ),
    [preferences.generatorIndustries]
  )

  function updatePreference<K extends keyof PreferenceState>(key: K, value: PreferenceState[K]) {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  function toggleIndustry(industry: string) {
    setPreferences((current) => {
      const exists = current.generatorIndustries.includes(industry)
      return {
        ...current,
        generatorIndustries: exists
          ? current.generatorIndustries.filter((item) => item !== industry)
          : [...current.generatorIndustries, industry],
      }
    })
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setMessage(null)

    try {
      const res = await fetch('/api/contacts/generate-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: preferences.generatorCount,
          tagVariability: preferences.generatorVariability,
          industryFilter:
            preferences.generatorIndustries.length > 0 ? preferences.generatorIndustries : undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '生成测试数据失败，请稍后再试。' })
        return
      }

      setMessage({ type: 'success', text: `已生成 ${data.count} 位测试联系人。` })
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (error) {
      setMessage({ type: 'error', text: `生成失败：${String(error)}` })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/contacts?limit=9999')
      const data = await res.json()
      const contacts = data.contacts ?? data ?? []

      let content = ''
      let filename = ''
      let mime = ''

      if (preferences.exportFormat === 'json') {
        content = JSON.stringify(contacts, null, 2)
        filename = `peoplemine_export_${new Date().toISOString().slice(0, 10)}.json`
        mime = 'application/json'
      } else {
        const headers = ['姓名', '公司', '一级行业', '二级行业', '职位', '角色', '能量', '温度', '微信', '手机', '邮箱', '备注']
        const rows = contacts.map((contact: Record<string, unknown>) =>
          [
            contact.fullName ?? contact.name,
            contact.companyName ?? contact.company,
            contact.industryL1,
            contact.industryL2,
            contact.jobTitle ?? contact.title,
            contact.roleArchetype,
            contact.energyScore,
            contact.temperature,
            contact.wechat,
            contact.phone,
            contact.email,
            contact.notes,
          ]
            .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
        content = [headers.join(','), ...rows].join('\n')
        filename = `peoplemine_export_${new Date().toISOString().slice(0, 10)}.csv`
        mime = 'text/csv;charset=utf-8;'
      }

      const blob = new Blob(['\uFEFF' + content], { type: mime })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: '已导出 ' + contacts.length + ' 条记录。' })
    } catch (error) {
      setMessage({ type: 'error', text: '导出失败：' + String(error) })
    } finally {
      setIsExporting(false)
    }
  }

  async function handleClear() {
    if (confirmText !== 'DELETE ALL') return

    setIsClearing(true)
    setMessage(null)

    try {
      const res = await fetch('/api/contacts/clear-all', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: '清空失败：' + String(data.error || '请稍后再试。') })
        return
      }

      setMessage({ type: 'success', text: '已清空全部联系人。' })
      setConfirmText('')
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (error) {
      setMessage({ type: 'error', text: '清空失败：' + String(error) })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className={pageWrap}>
      <div className={shell}>
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '设置' },
          ]}
          title="设置"
          summary="管理工作区偏好、测试数据、导出备份和关键风险操作。"
          hints={[
            '这里的偏好默认保存在当前浏览器 localStorage。',
            '测试数据、导出和清空联系人仍然连接现有接口。',
            '常用入口和高风险操作已分开放置，避免误触。',
          ]}
        />

        <div className={`mt-1 ${card} overflow-hidden`}>
          <div className="space-y-10 px-8 py-8">
            {message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  message.type === 'success'
                    ? 'border-gray-200 bg-gray-50 text-gray-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionHeader
                eyebrow="Workspace"
                title="Workspace preferences"
                description="Keep the setup surface calm and lightweight, and group the options people change most often in one place."
              />

              <div className="grid gap-4">
                <div className={`${subtleCard} p-4`}>
                  <p className="mb-3 text-sm font-medium text-gray-900">人脉列表默认视图</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionButton
                      active={preferences.contactsView === 'table'}
                      icon={<List className="h-4 w-4" />}
                      label="表格"
                      hint="Best for quick scanning, batch filtering, and fast data entry."
                      onClick={() => updatePreference('contactsView', 'table')}
                    />
                    <OptionButton
                      active={preferences.contactsView === 'card'}
                      icon={<LayoutGrid className="h-4 w-4" />}
                      label="卡片"
                      hint="Best for browsing profile details, notes, and relationship context."
                      onClick={() => updatePreference('contactsView', 'card')}
                    />
                  </div>
                </div>

                <div className={`${subtleCard} p-4`}>
                  <p className="mb-3 text-sm font-medium text-gray-900">阅读密度</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionButton
                      active={preferences.density === 'comfortable'}
                      label="Comfortable"
                      hint="More whitespace for longer reading sessions and first-pass review."
                      onClick={() => updatePreference('density', 'comfortable')}
                    />
                    <OptionButton
                      active={preferences.density === 'compact'}
                      label="紧凑"
                      hint="Fits more information on screen for higher-frequency triage."
                      onClick={() => updatePreference('density', 'compact')}
                    />
                  </div>
                </div>

                <ToggleRow
                  title="在列表中显示能量信号"
                  description="Keep energy signals visible so it is easier to spot relationships that need care or deserve priority follow-up."
                  value={preferences.showEnergy}
                  onToggle={() => updatePreference('showEnergy', !preferences.showEnergy)}
                />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionHeader
                eyebrow="Generator"
                title="Sample data defaults"
                description="This project already includes random contact generation, so the default parameters live here as a cleaner set of controls."
              />

              <div className={`${subtleCard} space-y-5 p-5`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">默认生成数量</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={preferences.generatorCount}
                      onChange={(event) =>
                        updatePreference(
                          'generatorCount',
                          Math.max(1, Math.min(500, Number(event.target.value) || 1))
                        )
                      }
                      className={inputCls}
                    />
                  </label>

                  <div>
                    <span className="mb-2 block text-sm font-medium text-gray-700">
                      Variability <span className="text-gray-400">({preferences.generatorVariability}%)</span>
                    </span>
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={preferences.generatorVariability}
                        onChange={(event) =>
                          updatePreference('generatorVariability', Number(event.target.value))
                        }
                        className="w-full accent-gray-800"
                      />
                      <div className="mt-2 flex justify-between text-xs text-gray-400">
                        <span>集中</span>
                        <span>多样</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-gray-700">偏好行业</p>
                    <p className="text-xs text-gray-400">
                      {preferences.generatorIndustries.length === 0
                        ? 'No restriction. All industries stay in the random pool.'
                        : `Selected ${preferences.generatorIndustries.length} primary industries`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_L1_OPTIONS.map((industry) => {
                      const active = preferences.generatorIndustries.includes(industry)
                      return (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => toggleIndustry(industry)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {industry}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {availableL2.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                    <p className="text-xs leading-5 text-gray-500">
                      当前配置下，细分行业将从以下范围内随机生成。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {availableL2.map(({ l1, l2 }) => (
                        <span
                          key={`${l1}-${l2}`}
                          className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600"
                        >
                          <span className="text-gray-400">{l1} / </span>
                          {l2}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A04F47] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#A04F47]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <InlineLoadingSpinner className="h-4 w-4" />
                      正在生成
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      使用当前配置生成测试数据
                    </>
                  )}
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionHeader
                eyebrow="Backup"
                title="Export and data access"
                description="Keep export and key data-entry paths together so the settings page stays practical instead of becoming read-only documentation."
              />

              <div className="grid gap-4">
                <div className={`${subtleCard} p-5`}>
                  <p className="mb-3 text-sm font-medium text-gray-900">默认导出格式</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionButton
                      active={preferences.exportFormat === 'csv'}
                      icon={<FileSpreadsheet className="h-4 w-4" />}
                      label="CSV"
                      hint="Best for Excel, spreadsheet tools, and lightweight backups."
                      onClick={() => updatePreference('exportFormat', 'csv')}
                    />
                    <OptionButton
                      active={preferences.exportFormat === 'json'}
                      icon={<FileJson className="h-4 w-4" />}
                      label="JSON"
                      hint="Best for full migration, development debugging, and structured archiving."
                      onClick={() => updatePreference('exportFormat', 'json')}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <InlineLoadingSpinner className="h-4 w-4" />
                        正在导出
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        导出当前人脉数据
                      </>
                    )}
                  </button>
                </div>

                <div className={`${subtleCard} p-5`}>
                  <p className="mb-3 text-sm font-medium text-gray-900">你可能会用到</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href="/me"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <UserRound className="h-4 w-4" />
                        个人资料
                      </div>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        更新“我”的标签、目标和个人背景，影响旅程分析上下文。
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400">
                        前往编辑 <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>

                    <a
                      href="/contacts/new"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Settings2 className="h-4 w-4" />
                        新建人脉
                      </div>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        直接回到“+人脉”流程，延续同样的输入节奏和视觉语言。
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400">
                        立即前往 <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionHeader
                eyebrow="Safety"
                title="Risky actions and current build info"
                description="Put destructive actions and build metadata at the end so they are harder to mis-tap and the page still closes in a tidy way."
              />

              <div className="grid gap-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                    <ShieldAlert className="h-4 w-4" />
                    Delete all contacts
                  </div>
                  <p className="mt-2 text-xs leading-6 text-red-700">
                    This calls the existing clear endpoint and removes every contact under the current account. This action cannot be undone.
                  </p>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium text-red-700">
                      Type &quot;DELETE ALL&quot; to confirm
                    </label>
                    <input
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      placeholder="DELETE ALL"
                      className="h-11 w-full rounded-2xl border border-red-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={confirmText !== 'DELETE ALL' || isClearing}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isClearing ? (
                      <>
                        <InlineLoadingSpinner className="h-4 w-4" />
                        Clearing
                      </>
                    ) : (
                      'Confirm delete all contacts'
                    )}
                  </button>
                </div>

                <div className={`${subtleCard} p-5`}>
                  <p className="text-sm font-medium text-gray-900">关于当前版本</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Version</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">Web Demo 1.0</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Stack</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">Next.js 14 / TypeScript / Prisma 7</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Auth</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">OTP + iron-session</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">AI</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">Journey analysis enabled by Qwen API config</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-6 text-gray-500">
                    当前页新增的偏好项都会保存在本地浏览器，生成、导出、清空这三类动作则继续复用仓库里已有接口。
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
