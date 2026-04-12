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

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">{eyebrow}</p>
      <h3 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
    </div>
  )
}

function SummaryItem({
  icon,
  title,
  complete,
}: {
  icon: React.ReactNode
  title: string
  complete: boolean
}) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-gray-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                complete ? 'bg-[#202020] text-white' : 'bg-[#f3f4f6] text-gray-500'
              }`}
            >
              {complete ? '已完成' : '待补充'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MeForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [saved, setSaved] = useState(false)
  const [hydrated, setHydrated] = useState(false)

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
      title: '基础身份',
      complete: Boolean(form.name && form.company && form.title),
      icon: <UserRound className="h-4 w-4" />,
    },
    {
      title: '当前目标',
      complete: Boolean(form.focus && form.annualGoal && form.targetPeople),
      icon: <Target className="h-4 w-4" />,
    },
    {
      title: '个人画像',
      complete: Boolean(form.tags && form.strengths && form.resources),
      icon: <Layers3 className="h-4 w-4" />,
    },
  ]

  return (
    <div className="grid flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Profile</p>
        <div className="mt-3">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">我的画像</h2>
        </div>

        <div className="mt-5 space-y-3">
          {sections.map((section) => (
            <SummaryItem
              key={section.title}
              icon={section.icon}
              title={section.title}
              complete={section.complete}
            />
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-gray-200 bg-[#fafaf9] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">完成度</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{progress}%</p>
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

      <section className="flex min-h-[760px] flex-col rounded-[32px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Identity</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">我是谁，我正要去哪里</h2>
            </div>
            <div className="rounded-full border border-gray-200 bg-[#fafaf9] px-3 py-1 text-xs text-gray-500">
              {hydrated ? '个人档案' : '载入中'}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-8 px-6 py-6">
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
                placeholder="你当前主要投入的平台、公司或项目"
              />
            </div>
            <div>
              <FieldLabel>当前角色</FieldLabel>
              <input
                className={fieldCls}
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="例如：创始人 / 产品负责人 / 顾问"
              />
            </div>
          </div>

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
                placeholder="例如：产品增长、客户拓展、融资准备"
              />
            </div>
            <div>
              <FieldLabel>今年的核心目标</FieldLabel>
              <input
                className={fieldCls}
                value={form.annualGoal}
                onChange={(event) => update('annualGoal', event.target.value)}
                placeholder="例如：建立稳定的高质量引荐网络"
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>希望连接的人脉类型</FieldLabel>
              <textarea
                rows={4}
                className={textAreaCls}
                value={form.targetPeople}
                onChange={(event) => update('targetPeople', event.target.value)}
                placeholder="写清楚你希望认识的人群，例如行业专家、渠道合作者、关键决策者、投资人等。"
              />
            </div>
          </div>

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
                placeholder="用逗号分隔，例如：AI、产品、增长、教育、资源整合"
              />
            </div>
            <div>
              <FieldLabel>我的核心优势</FieldLabel>
              <textarea
                rows={5}
                className={textAreaCls}
                value={form.strengths}
                onChange={(event) => update('strengths', event.target.value)}
                placeholder="你最强的能力、判断力、行业理解或执行特征是什么？"
              />
            </div>
            <div>
              <FieldLabel>我能提供的资源</FieldLabel>
              <textarea
                rows={5}
                className={textAreaCls}
                value={form.resources}
                onChange={(event) => update('resources', event.target.value)}
                placeholder="你能稳定提供的资源、引荐、方法、渠道或合作机会。"
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>关于我</FieldLabel>
              <textarea
                rows={6}
                className={textAreaCls}
                value={form.bio}
                onChange={(event) => update('bio', event.target.value)}
                placeholder="用一段短介绍说明你在做什么、为什么值得被连接，以及你希望建立怎样的人脉关系。"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-5">
          <div />
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
