'use client'

import { useState } from 'react'

type FormState = {
  name: string
  company: string
  title: string
  goal: string
  tags: string
  bio: string
}

const INITIAL_STATE: FormState = {
  name: '',
  company: '',
  title: '',
  goal: '',
  tags: '',
  bio: '',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100'

export default function MeForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [saved, setSaved] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSaved(false)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input className={inputCls} value={form.name} onChange={(e) => update('name', e.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Company</span>
          <input className={inputCls} value={form.company} onChange={(e) => update('company', e.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input className={inputCls} value={form.title} onChange={(e) => update('title', e.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Primary Goal</span>
          <input className={inputCls} value={form.goal} onChange={(e) => update('goal', e.target.value)} />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Tags</span>
        <input
          className={inputCls}
          value={form.tags}
          onChange={(e) => update('tags', e.target.value)}
          placeholder="Founder, Product, AI, Community"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Bio</span>
        <textarea
          className={`${inputCls} min-h-32 resize-y`}
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {saved ? 'Profile saved locally for now.' : 'Update the basics so planning tools have a better starting point.'}
        </p>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[#A04F47] px-7 py-2.5 text-sm font-medium text-white transition hover:bg-[#A04F47]/90"
        >
          Save Profile
        </button>
      </div>
    </div>
  )
}