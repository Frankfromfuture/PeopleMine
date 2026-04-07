'use client'

import { useState, useCallback } from 'react'
import type { TagConfig, TagCategory, TagSubcategory } from '@/lib/dev/tag-store'

function genId() {
  return 'id-' + Math.random().toString(36).slice(2, 9)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-gray-500' : pct >= 40 ? 'bg-gray-500' : 'bg-gray-500'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 bg-zinc-200 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 w-8 text-right">{value.toFixed(2)}</span>
    </div>
  )
}

interface TagEditorProps {
  initialConfig: TagConfig
}

export default function TagEditor({ initialConfig }: TagEditorProps) {
  const [config, setConfig] = useState<TagConfig>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editingSub, setEditingSub] = useState<string | null>(null)

  const save = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/dev/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [config])

  // ─── Category ops ─────────────────────────────────────────────────────────
  function addCategory() {
    setConfig((c) => ({
      ...c,
      categories: [...c.categories, { id: genId(), name: '新目录', subcategories: [] }],
    }))
  }

  function deleteCategory(catId: string) {
    setConfig((c) => ({ ...c, categories: c.categories.filter((cat) => cat.id !== catId) }))
  }

  function updateCategoryName(catId: string, name: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) => cat.id === catId ? { ...cat, name } : cat),
    }))
  }

  // ─── Subcategory ops ──────────────────────────────────────────────────────
  function addSubcategory(catId: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? { ...cat, subcategories: [...cat.subcategories, { id: genId(), name: '新子目录', tags: [] }] }
          : cat,
      ),
    }))
  }

  function deleteSubcategory(catId: string, subId: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? { ...cat, subcategories: cat.subcategories.filter((s) => s.id !== subId) }
          : cat,
      ),
    }))
  }

  function updateSubcategoryName(catId: string, subId: string, name: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? { ...cat, subcategories: cat.subcategories.map((s) => s.id === subId ? { ...s, name } : s) }
          : cat,
      ),
    }))
  }

  // ─── Tag ops ──────────────────────────────────────────────────────────────
  function addTag(catId: string, subId: string, tagName: string) {
    const trimmed = tagName.trim()
    if (!trimmed) return
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((s) =>
                s.id === subId && !s.tags.includes(trimmed)
                  ? { ...s, tags: [...s.tags, trimmed] }
                  : s,
              ),
            }
          : cat,
      ),
    }))
  }

  function deleteTag(catId: string, subId: string, tag: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((s) =>
                s.id === subId ? { ...s, tags: s.tags.filter((t) => t !== tag) } : s,
              ),
            }
          : cat,
      ),
    }))
  }

  const totalTags = config.categories.reduce((a, cat) => a + cat.subcategories.reduce((b, s) => b + s.tags.length, 0), 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">
          共 {config.categories.length} 个一级目录 · {totalTags} 个标签
        </div>
        <div className="flex gap-2">
          <button
            onClick={addCategory}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition"
          >
            + 添加一级目录
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${saved ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
          >
            {saved ? '✓ 已同步到人物标签页' : saving ? '保存中…' : '保存并同步'}
          </button>
        </div>
      </div>

      {/* Category tree */}
      <div className="space-y-3">
        {config.categories.map((cat) => (
          <CategoryNode
            key={cat.id}
            cat={cat}
            editingCat={editingCat}
            editingSub={editingSub}
            onEditCat={setEditingCat}
            onEditSub={setEditingSub}
            onDeleteCat={deleteCategory}
            onRenameCat={updateCategoryName}
            onAddSub={addSubcategory}
            onDeleteSub={deleteSubcategory}
            onRenameSub={updateSubcategoryName}
            onAddTag={addTag}
            onDeleteTag={deleteTag}
          />
        ))}
      </div>

      {config.categories.length === 0 && (
        <div className="text-center py-12 text-zinc-400 text-sm">
          没有标签目录 · 点击「添加一级目录」开始
        </div>
      )}
    </div>
  )
}

function CategoryNode({
  cat, editingCat, editingSub, onEditCat, onEditSub,
  onDeleteCat, onRenameCat, onAddSub, onDeleteSub, onRenameSub, onAddTag, onDeleteTag,
}: {
  cat: TagCategory
  editingCat: string | null
  editingSub: string | null
  onEditCat: (id: string | null) => void
  onEditSub: (id: string | null) => void
  onDeleteCat: (id: string) => void
  onRenameCat: (id: string, name: string) => void
  onAddSub: (catId: string) => void
  onDeleteSub: (catId: string, subId: string) => void
  onRenameSub: (catId: string, subId: string, name: string) => void
  onAddTag: (catId: string, subId: string, tag: string) => void
  onDeleteTag: (catId: string, subId: string, tag: string) => void
}) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
        <span className="text-zinc-400 text-xs">▼</span>
        {editingCat === cat.id ? (
          <input
            autoFocus
            defaultValue={cat.name}
            onBlur={(e) => { onRenameCat(cat.id, e.target.value); onEditCat(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onRenameCat(cat.id, e.currentTarget.value); onEditCat(null) } }}
            className="flex-1 text-sm font-semibold text-zinc-800 bg-white border border-gray-300 rounded px-2 py-0.5 outline-none"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-zinc-800 cursor-pointer hover:text-gray-600"
            onDoubleClick={() => onEditCat(cat.id)}
          >
            {cat.name}
          </span>
        )}
        <span className="text-xs text-zinc-400">{cat.subcategories.length} 个子目录</span>
        <button
          onClick={() => onAddSub(cat.id)}
          className="text-xs px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200"
        >
          + 子目录
        </button>
        <button onClick={() => onEditCat(cat.id)} className="text-xs text-zinc-400 hover:text-zinc-600 px-1">编辑</button>
        <button
          onClick={() => onDeleteCat(cat.id)}
          className="text-xs text-gray-400 hover:text-gray-600 px-1"
        >
          删除
        </button>
      </div>

      {/* Subcategories */}
      <div className="divide-y divide-zinc-100">
        {cat.subcategories.map((sub) => (
          <SubcategoryNode
            key={sub.id}
            catId={cat.id}
            sub={sub}
            editingSub={editingSub}
            onEditSub={onEditSub}
            onDeleteSub={onDeleteSub}
            onRenameSub={onRenameSub}
            onAddTag={onAddTag}
            onDeleteTag={onDeleteTag}
          />
        ))}
        {cat.subcategories.length === 0 && (
          <div className="px-6 py-3 text-xs text-zinc-400">暂无子目录 · 点击「+ 子目录」添加</div>
        )}
      </div>
    </div>
  )
}

function SubcategoryNode({
  catId, sub, editingSub, onEditSub,
  onDeleteSub, onRenameSub, onAddTag, onDeleteTag,
}: {
  catId: string
  sub: TagSubcategory
  editingSub: string | null
  onEditSub: (id: string | null) => void
  onDeleteSub: (catId: string, subId: string) => void
  onRenameSub: (catId: string, subId: string, name: string) => void
  onAddTag: (catId: string, subId: string, tag: string) => void
  onDeleteTag: (catId: string, subId: string, tag: string) => void
}) {
  const [tagInput, setTagInput] = useState('')

  function handleAddTag() {
    const tags = tagInput.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
    tags.forEach((t) => onAddTag(catId, sub.id, t))
    setTagInput('')
  }

  return (
    <div className="px-6 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-zinc-300 text-xs ml-2">└</span>
        {editingSub === sub.id ? (
          <input
            autoFocus
            defaultValue={sub.name}
            onBlur={(e) => { onRenameSub(catId, sub.id, e.target.value); onEditSub(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onRenameSub(catId, sub.id, e.currentTarget.value); onEditSub(null) } }}
            className="text-sm font-medium text-zinc-700 bg-white border border-gray-300 rounded px-2 py-0.5 outline-none"
          />
        ) : (
          <span
            className="text-sm font-medium text-zinc-700 cursor-pointer hover:text-gray-600"
            onDoubleClick={() => onEditSub(sub.id)}
          >
            {sub.name}
          </span>
        )}
        <button onClick={() => onEditSub(sub.id)} className="text-xs text-zinc-400 hover:text-zinc-600">编辑</button>
        <button
          onClick={() => onDeleteSub(catId, sub.id)}
          className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
        >
          删除子目录
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 ml-5 mb-2">
        {sub.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-700 border border-gray-200"
          >
            {tag}
            <button onClick={() => onDeleteTag(catId, sub.id, tag)} className="text-gray-400 hover:text-gray-500 leading-none">×</button>
          </span>
        ))}
        {sub.tags.length === 0 && <span className="text-xs text-zinc-400">暂无标签</span>}
      </div>

      {/* Add tag input */}
      <div className="flex items-center gap-2 ml-5">
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag() }}
          placeholder="添加标签（多个用逗号分隔）"
          className="flex-1 h-7 px-2.5 rounded-lg text-xs border border-zinc-200 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-100"
        />
        <button
          onClick={handleAddTag}
          className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          添加
        </button>
      </div>
    </div>
  )
}
