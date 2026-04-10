'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

type SettingsSectionKey = 'workspace' | 'generator' | 'backup' | 'safety'

const card = 'rounded-[28px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
const subtleCard = 'rounded-[24px] border border-gray-200 bg-[#fafaf9]'
const inputCls =
  'w-full h-10 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
const sectionTitle = 'text-xl font-semibold tracking-tight text-gray-900'
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
      className={`rounded-2xl border px-4 py-3.5 text-left transition ${
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

function GuideButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
        active
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            active ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </p>
          <p
            className={`mt-1 text-xs leading-5 ${
              active ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
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
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('workspace')
  const workspaceRef = useRef<HTMLElement | null>(null)
  const generatorRef = useRef<HTMLElement | null>(null)
  const backupRef = useRef<HTMLElement | null>(null)
  const safetyRef = useRef<HTMLElement | null>(null)

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

  const sectionMap: Record<SettingsSectionKey, React.RefObject<HTMLElement | null>> = {
    workspace: workspaceRef,
    generator: generatorRef,
    backup: backupRef,
    safety: safetyRef,
  }

  const guideItems: Array<{
    key: SettingsSectionKey
    icon: React.ReactNode
    title: string
    description: string
  }> = [
    {
      key: 'workspace',
      icon: <Settings2 className="h-4 w-4" />,
      title: '工作区偏好',
      description: '控制人脉列表的默认视图、阅读密度和能量信号展示。',
    },
    {
      key: 'generator',
      icon: <Sparkles className="h-4 w-4" />,
      title: '测试数据生成',
      description: '管理随机生成人脉时的数量、行业和多样性范围。',
    },
    {
      key: 'backup',
      icon: <Download className="h-4 w-4" />,
      title: '导出与常用入口',
      description: '快速导出数据，并回到个人资料或“+人脉”录入流程。',
    },
    {
      key: 'safety',
      icon: <ShieldAlert className="h-4 w-4" />,
      title: '风险操作',
      description: '在最后集中放置删除与版本说明，降低误触风险。',
    },
  ]

  function jumpToSection(section: SettingsSectionKey) {
    setActiveSection(section)
    sectionMap[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
    <div className="min-h-full bg-[#f6f6f4] lg:h-[100dvh] lg:overflow-hidden">
      <div className="flex min-h-screen w-full min-w-0 flex-col px-4 py-3 sm:px-5 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden lg:px-6 lg:py-3 xl:px-8">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '设置' },
          ]}
          title="设置"
          className="pb-3 lg:pb-3"
          titleNote={
            <span className="text-sm italic text-gray-500">
              用同一套“+人脉”式工作台整理偏好、样本生成、导出备份和风险操作。
            </span>
          }
          hints={[
            '设置页改成左侧引导 + 右侧工作区，桌面端会尽量保持在一个屏幕里完成浏览。',
            '偏好项默认保存在当前浏览器，本地不会影响服务端数据结构。',
            '生成、导出和清空联系人仍然复用现有接口，但高风险动作被固定放在最后一组。',
          ]}
        />

        <div className="mt-1 grid min-h-0 flex-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)]">
          <aside className={`${card} p-4 lg:min-h-0 lg:overflow-y-auto`}>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">
              Guide
            </p>
            <div className="mt-4 space-y-3">
              {guideItems.map((item) => (
                <GuideButton
                  key={item.key}
                  active={activeSection === item.key}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  onClick={() => jumpToSection(item.key)}
                />
              ))}
            </div>
          </aside>

          <section className={`${card} flex min-h-[640px] flex-col lg:min-h-0 lg:overflow-hidden`}>
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">
                    Settings Workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                    设置工作台
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    常用偏好、数据工具与风险操作被放进同一个工作区里，浏览和调整都更集中。
                  </p>
                </div>
                <div className="rounded-full border border-gray-200 bg-[#fafaf9] px-3 py-1 text-xs text-gray-500">
                  自动保存
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
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

            <section ref={workspaceRef} className={`${subtleCard} grid gap-5 p-4 sm:p-5 xl:grid-cols-[220px_minmax(0,1fr)]`}>
              <SectionHeader
                eyebrow="Workspace"
                title="工作区偏好"
                description="先确定默认视图和阅读密度，让人脉列表进入你习惯的工作节奏。"
              />

              <div className="grid gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-gray-900">人脉列表默认视图</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionButton
                      active={preferences.contactsView === 'table'}
                      icon={<List className="h-4 w-4" />}
                      label="表格"
                      hint="适合快速扫视、批量筛选和更高频的数据录入。"
                      onClick={() => updatePreference('contactsView', 'table')}
                    />
                    <OptionButton
                      active={preferences.contactsView === 'card'}
                      icon={<LayoutGrid className="h-4 w-4" />}
                      label="卡片"
                      hint="适合浏览人物细节、备注信息和关系语境。"
                      onClick={() => updatePreference('contactsView', 'card')}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-gray-900">阅读密度</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionButton
                      active={preferences.density === 'comfortable'}
                      label="舒展"
                      hint="保留更多留白，适合首次梳理和更长时间的阅读。"
                      onClick={() => updatePreference('density', 'comfortable')}
                    />
                    <OptionButton
                      active={preferences.density === 'compact'}
                      label="紧凑"
                      hint="在同一屏放进更多信息，适合高频筛查和密集浏览。"
                      onClick={() => updatePreference('density', 'compact')}
                    />
                  </div>
                </div>

                <ToggleRow
                  title="在列表中显示能量信号"
                  description="把能量值一直留在列表中，便于优先识别值得维护或需要跟进的人脉。"
                  value={preferences.showEnergy}
                  onToggle={() => updatePreference('showEnergy', !preferences.showEnergy)}
                />
              </div>
            </section>

            <section ref={generatorRef} className={`${subtleCard} grid gap-5 p-4 sm:p-5 xl:grid-cols-[220px_minmax(0,1fr)]`}>
              <SectionHeader
                eyebrow="Generator"
                title="测试数据生成"
                description="把样本数量、行业范围和多样性控制集中起来，方便你快速生成演示数据。"
              />

              <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4">
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
                      多样性 <span className="text-gray-400">({preferences.generatorVariability}%)</span>
                    </span>
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4">
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
                        ? '不限制行业，随机池会覆盖全部一级行业。'
                        : `已选择 ${preferences.generatorIndustries.length} 个一级行业`}
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
                  <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4">
                    <p className="text-xs leading-5 text-gray-500">
                      当前配置下，细分行业会在以下范围内随机生成。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {availableL2.map(({ l1, l2 }) => (
                        <span
                          key={`${l1}-${l2}`}
                          className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-600"
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

            <section ref={backupRef} className={`${subtleCard} grid gap-5 p-4 sm:p-5 xl:grid-cols-[220px_minmax(0,1fr)]`}>
              <SectionHeader
                eyebrow="Backup"
                title="导出与常用入口"
                description="把导出、个人资料和“+人脉”入口放在一起，设置页也能保持实用。"
              />

              <div className="grid gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-gray-900">默认导出格式</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionButton
                      active={preferences.exportFormat === 'csv'}
                      icon={<FileSpreadsheet className="h-4 w-4" />}
                      label="CSV"
                      hint="适合 Excel、表格工具和轻量级本地备份。"
                      onClick={() => updatePreference('exportFormat', 'csv')}
                    />
                    <OptionButton
                      active={preferences.exportFormat === 'json'}
                      icon={<FileJson className="h-4 w-4" />}
                      label="JSON"
                      hint="适合完整迁移、开发调试和结构化归档。"
                      onClick={() => updatePreference('exportFormat', 'json')}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-gray-900">你可能会用到</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href="/me"
                      className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <UserRound className="h-4 w-4" />
                        个人资料
                      </div>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        更新“我”的标签、目标和个人背景，影响旅程分析的上下文。
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400">
                        前往编辑 <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>

                    <a
                      href="/contacts/new"
                      className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Settings2 className="h-4 w-4" />
                        新建人脉
                      </div>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        直接回到“+人脉”流程，继续沿用同样的标题区、引导和录入节奏。
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400">
                        立即前往 <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section ref={safetyRef} className={`${subtleCard} grid gap-5 p-4 sm:p-5 xl:grid-cols-[220px_minmax(0,1fr)]`}>
              <SectionHeader
                eyebrow="Safety"
                title="风险操作与版本信息"
                description="把危险动作留在最后，前面完成偏好和备份后再进入删除确认。"
              />

              <div className="grid gap-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                    <ShieldAlert className="h-4 w-4" />
                    清空全部联系人
                  </div>
                  <p className="mt-2 text-xs leading-6 text-red-700">
                    这里会调用现有清空接口，删除当前账号下的全部联系人，且操作不可撤销。
                  </p>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium text-red-700">
                      输入 &quot;DELETE ALL&quot; 进行确认
                    </label>
                    <input
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      placeholder="DELETE ALL"
                      className="h-10 w-full rounded-2xl border border-red-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
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
                        正在清空
                      </>
                    ) : (
                      '确认清空全部联系人'
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-900">关于当前版本</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Version</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">Web Demo 1.0</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Stack</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">Next.js 14 / TypeScript / Prisma 7</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Auth</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">OTP + iron-session</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">AI</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">Journey analysis enabled by Qwen API config</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-6 text-gray-500">
                    当前页里的偏好项会保存在浏览器本地，生成、导出和清空则继续复用项目中已有接口。
                  </p>
                </div>
              </div>
            </section>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
