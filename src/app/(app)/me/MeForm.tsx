'use client'

import { Check, Layers3, Sparkles, Target, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type FormState = {
  name: string
  company: string
  title: string
  city: string
  focus: string
  annualGoal: string
  targetPeople: string
  strengths: string
  resources: string
  tags: string
  bio: string
}

type SectionKey = 'basic' | 'goal' | 'profile'

const STORAGE_KEY = 'me-profile-draft-v1'

const INITIAL_STATE: FormState = {
  name: '',
  company: '',
  title: '',
  city: '',
  focus: '',
  annualGoal: '',
  targetPeople: '',
  strengths: '',
  resources: '',
  tags: '',
  bio: '',
}

const fieldCls =
  'h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
const textAreaCls =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 resize-none'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-gray-900">{children}</label>
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">{eyebrow}</p>
      <h3 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
      {description ? <p className="text-sm leading-6 text-gray-500">{description}</p> : null}
    </div>
  )
}

function SectionTab({
  icon,
  title,
  complete,
  active,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  complete: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            active ? 'bg-white/20 text-white' : 'bg-[#f5f5f4] text-gray-700'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{title}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                active
                  ? 'bg-white/20 text-white'
                  : complete
                    ? 'bg-[#202020] text-white'
                    : 'bg-[#f3f4f6] text-gray-500'
              }`}
            >
              {complete ? '已完成' : '待补充'}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function MeForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [saved, setSaved] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('basic')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setForm({ ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<FormState>) })
      }
    } catch {
      // Ignore invalid local data and keep the default empty state.
    } finally {
      setHydrated(true)
    }
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSaved(false)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    setSaved(true)
  }

  const completionCount = useMemo(
    () => Object.values(form).filter((value) => value.trim().length > 0).length,
    [form]
  )
  const progress = Math.round((completionCount / Object.keys(INITIAL_STATE).length) * 100)
  const tagList = form.tags
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)

  const sections = [
    {
      key: 'basic' as const,
      title: '基础身份',
      description: '填写你的基本身份。',
      complete: Boolean(form.name && form.company && form.title),
      icon: <UserRound className="h-4 w-4" />,
    },
    {
      key: 'goal' as const,
      title: '当前目标',
      description: '填写近期重点。',
      complete: Boolean(form.focus && form.annualGoal && form.targetPeople),
      icon: <Target className="h-4 w-4" />,
    },
    {
      key: 'profile' as const,
      title: '个人画像',
      description: '补充你的优势与资源。',
      complete: Boolean(form.tags && form.strengths && form.resources),
      icon: <Layers3 className="h-4 w-4" />,
    },
  ]

  const currentSection = sections.find((item) => item.key === activeSection) ?? sections[0]

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col overflow-y-auto rounded-[32px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Profile</p>
        <div className="mt-3">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">我的画像</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">点击左侧标签编辑对应内容。</p>
        </div>

        <div className="mt-5 space-y-3">
          {sections.map((section) => (
            <SectionTab
              key={section.key}
              icon={section.icon}
              title={section.title}
              complete={section.complete}
              active={activeSection === section.key}
              onClick={() => setActiveSection(section.key)}
            />
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-gray-200 bg-[#fafaf9] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">完成度</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{progress}%</p>
          <p className="mt-2 text-xs leading-5 text-gray-500">填得越完整，建议越准确。</p>
        </div>

        <div className="mt-5 rounded-[24px] border border-gray-200 bg-[#fafaf9] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
              {(form.name || '我').slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900">{form.name || '你的名字'}</p>
              <p className="mt-1 text-sm text-gray-500">
                {[form.company, form.title].filter(Boolean).join(' / ') || '补充基础身份后会显示你的当前角色'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tagList.length > 0 ? (
                  tagList.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400">
                    你的标签会显示在这里
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 h-full flex-col rounded-[32px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Section</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{currentSection.title}</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">{currentSection.description}</p>
            </div>
            <div className="rounded-full border border-gray-200 bg-[#fafaf9] px-3 py-1 text-xs text-gray-500">
              {hydrated ? '个人档案' : '载入中'}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {activeSection === 'basic' ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <SectionHeading eyebrow="Section 01" title="基础身份" />
              </div>
              <div>
                <FieldLabel>姓名</FieldLabel>
                <input
                  className={fieldCls}
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="例如：Frank Fan"
                />
              </div>
              <div>
                <FieldLabel>所在城市</FieldLabel>
                <input
                  className={fieldCls}
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                  placeholder="例如：上海"
                />
              </div>
              <div>
                <FieldLabel>当前公司 / 项目</FieldLabel>
                <input
                  className={fieldCls}
                  value={form.company}
                  onChange={(event) => update('company', event.target.value)}
                  placeholder="公司或项目"
                />
              </div>
              <div>
                <FieldLabel>当前角色</FieldLabel>
                <input
                  className={fieldCls}
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder="例如：创始人 / 顾问"
                />
              </div>
            </div>
          ) : null}

          {activeSection === 'goal' ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <SectionHeading eyebrow="Section 02" title="当前目标" />
              </div>
              <div>
                <FieldLabel>当前最重要的主题</FieldLabel>
                <input
                  className={fieldCls}
                  value={form.focus}
                  onChange={(event) => update('focus', event.target.value)}
                  placeholder="例如：产品增长"
                />
              </div>
              <div>
                <FieldLabel>今年的核心目标</FieldLabel>
                <input
                  className={fieldCls}
                  value={form.annualGoal}
                  onChange={(event) => update('annualGoal', event.target.value)}
                  placeholder="例如：年度关键结果"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>希望连接的人脉类型</FieldLabel>
                <textarea
                  rows={5}
                  className={textAreaCls}
                  value={form.targetPeople}
                  onChange={(event) => update('targetPeople', event.target.value)}
                  placeholder="例如：行业专家、关键决策者、投资人"
                />
              </div>
            </div>
          ) : null}

          {activeSection === 'profile' ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <SectionHeading eyebrow="Section 03" title="个人画像" />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>我的标签</FieldLabel>
                <input
                  className={fieldCls}
                  value={form.tags}
                  onChange={(event) => update('tags', event.target.value)}
                  placeholder="逗号分隔，例如：AI、产品、增长"
                />
              </div>
              <div>
                <FieldLabel>我的核心优势</FieldLabel>
                <textarea
                  rows={5}
                  className={textAreaCls}
                  value={form.strengths}
                  onChange={(event) => update('strengths', event.target.value)}
                  placeholder="你最核心的优势"
                />
              </div>
              <div>
                <FieldLabel>我能提供的资源</FieldLabel>
                <textarea
                  rows={5}
                  className={textAreaCls}
                  value={form.resources}
                  onChange={(event) => update('resources', event.target.value)}
                  placeholder="你可提供的资源或机会"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>关于我</FieldLabel>
                <textarea
                  rows={5}
                  className={textAreaCls}
                  value={form.bio}
                  onChange={(event) => update('bio', event.target.value)}
                  placeholder="一句话介绍你自己"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            {saved ? '已保存到当前浏览器。' : '修改后请保存。'}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#A04F47] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A04F47]/90"
          >
            {saved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            保存我的画像
          </button>
        </div>
      </section>
    </div>
  )
}
