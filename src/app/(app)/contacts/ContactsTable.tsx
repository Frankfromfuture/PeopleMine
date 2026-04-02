'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { toast } from 'sonner'
import { RELATION_ROLE_LABELS, TEMPERATURE_LABELS, type RelationRole, type Temperature } from '@/types'

type ContactRow = {
  id: string
  name: string
  relationRole: RelationRole
  tags: string | null
  temperature: Temperature | null
  trustLevel: number | null
  company: string | null
  title: string | null
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
  lastContactedAt: Date | string | null
}

type GroupBy = 'none' | 'relationRole' | 'temperature' | 'company'
type ViewKey = 'all' | 'followup' | 'hot'
type ColumnKey = 'name' | 'company' | 'title' | 'trustLevel' | 'relationRole' | 'createdAt' | 'lastContactedAt' | 'temperature'
type ColumnConfig = { key: ColumnKey; label: string; defaultOn: boolean; defaultWidth: number }
type BatchField = 'temperature' | 'relationRole' | 'trustLevel'
type SavedView = {
  id: string
  name: string
  config: Record<string, unknown>
  updatedAt?: string
}
type UndoEntry = {
  id: string
  rows: Array<Pick<ContactRow, 'id' | 'temperature' | 'relationRole' | 'trustLevel'>>
}

type DeletedContactEntry = {
  id: string
  row: ContactRow
}

const STORAGE_KEY = 'pm-contacts-table-v1'
const ROLE_COLOR: Record<RelationRole, string> = {
  BIG_INVESTOR: 'bg-amber-100 text-amber-700 border-amber-200',
  GATEWAY: 'bg-blue-100 text-blue-700 border-blue-200',
  ADVISOR: 'bg-violet-100 text-violet-700 border-violet-200',
  THERMOMETER: 'bg-rose-100 text-rose-700 border-rose-200',
  LIGHTHOUSE: 'bg-orange-100 text-orange-700 border-orange-200',
  COMRADE: 'bg-green-100 text-green-700 border-green-200',
}
const TEMP_COLOR: Record<Temperature, string> = {
  HOT: 'bg-rose-100 text-rose-700 border-rose-200',
  WARM: 'bg-amber-100 text-amber-700 border-amber-200',
  COLD: 'bg-sky-100 text-sky-700 border-sky-200',
}
const COLUMNS: ColumnConfig[] = [
  { key: 'name', label: '姓名', defaultOn: true, defaultWidth: 180 },
  { key: 'company', label: '公司', defaultOn: true, defaultWidth: 200 },
  { key: 'title', label: '职位', defaultOn: true, defaultWidth: 160 },
  { key: 'trustLevel', label: '信任度', defaultOn: true, defaultWidth: 140 },
  { key: 'relationRole', label: '角色关系', defaultOn: true, defaultWidth: 160 },
  { key: 'createdAt', label: '入库时间', defaultOn: true, defaultWidth: 160 },
  { key: 'lastContactedAt', label: '上次联络', defaultOn: true, defaultWidth: 160 },
  { key: 'temperature', label: '温度', defaultOn: false, defaultWidth: 120 },
]
const DEFAULT_VISIBLE = Object.fromEntries(COLUMNS.map((c) => [c.key, c.defaultOn])) as Record<ColumnKey, boolean>
const DEFAULT_WIDTHS = Object.fromEntries(COLUMNS.map((c) => [c.key, c.defaultWidth])) as Record<ColumnKey, number>
const DEFAULT_ORDER = COLUMNS.map((c) => c.key)

const formatDate = (v: Date | string | null) => {
  if (!v) return '—'
  const date = new Date(v)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function groupTitle(groupBy: GroupBy, value: string) {
  if (!value) return '未分组'
  if (groupBy === 'relationRole') return RELATION_ROLE_LABELS[value as RelationRole]?.name ?? value
  if (groupBy === 'temperature') return value === 'NONE' ? '未设置温度' : TEMPERATURE_LABELS[value as Temperature]
  if (groupBy === 'company') return value === 'NONE' ? '未填写公司' : value
  return value
}

function isAiGeneratedContact(row: ContactRow) {
  return (row.notes ?? '').includes('自动生成的测试数据')
}

export default function ContactsTable({ contacts }: { contacts: ContactRow[] }) {
  const [rows, setRows] = useState(contacts)
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState<ViewKey>('all')
  const [roleFilter, setRoleFilter] = useState<'ALL' | RelationRole>('ALL')
  const [tempFilter, setTempFilter] = useState<'ALL' | Temperature>('ALL')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBatching, setIsBatching] = useState(false)
  const [batchPanelOpen] = useState(false)
  const [batchField, setBatchField] = useState<BatchField>('temperature')
  const [batchValue, setBatchValue] = useState('HOT')
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [deleteUndoStack, setDeleteUndoStack] = useState<DeletedContactEntry[]>([])
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [isDeletingAi, setIsDeletingAi] = useState(false)
  const [undoSync, setUndoSync] = useState<{ running: boolean; done: number; total: number; failedRows: UndoEntry['rows'] }>({
    running: false,
    done: 0,
    total: 0,
    failedRows: [],
  })
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(DEFAULT_VISIBLE)
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_ORDER)
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(DEFAULT_WIDTHS)

  useEffect(() => {
    setRows(contacts)
  }, [contacts])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { visibleColumns?: Record<ColumnKey, boolean>; columnOrder?: ColumnKey[]; columnWidths?: Record<ColumnKey, number>; groupBy?: GroupBy; activeView?: ViewKey }
      if (parsed.visibleColumns) setVisibleColumns({ ...DEFAULT_VISIBLE, ...parsed.visibleColumns })
      if (parsed.columnOrder?.length) {
        const merged = [...parsed.columnOrder.filter((k) => DEFAULT_ORDER.includes(k)), ...DEFAULT_ORDER.filter((k) => !parsed.columnOrder!.includes(k))]
        setColumnOrder(merged)
      }
      if (parsed.columnWidths) setColumnWidths({ ...DEFAULT_WIDTHS, ...parsed.columnWidths })
      if (parsed.groupBy) setGroupBy(parsed.groupBy)
      if (parsed.activeView) setActiveView(parsed.activeView)
    } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/table-views?table=contacts')
      .then((r) => r.json())
      .then((data) => setSavedViews(Array.isArray(data.views) ? data.views : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ visibleColumns, columnOrder, columnWidths, groupBy, activeView }))
  }, [visibleColumns, columnOrder, columnWidths, groupBy, activeView])

  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.trim().toLowerCase()
    const hitSearch = !q || c.name.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q) || (c.title ?? '').toLowerCase().includes(q)
    const hitRole = roleFilter === 'ALL' || c.relationRole === roleFilter
    const hitTemp = tempFilter === 'ALL' || c.temperature === tempFilter

    const daysSinceContact = c.lastContactedAt
      ? Math.floor((Date.now() - new Date(c.lastContactedAt).getTime()) / 86400000)
      : 999

    const hitView =
      activeView === 'all'
        ? true
        : activeView === 'followup'
        ? daysSinceContact >= 14
        : c.temperature === 'HOT'

    return hitSearch && hitRole && hitTemp && hitView
  }), [rows, search, roleFilter, tempFilter, activeView])

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'ALL', title: `全部联系人 (${filtered.length})`, rows: filtered }]
    const map = new Map<string, ContactRow[]>()
    for (const row of filtered) {
      const key = groupBy === 'relationRole' ? row.relationRole : groupBy === 'temperature' ? row.temperature ?? 'NONE' : row.company ?? 'NONE'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return Array.from(map.entries()).map(([key, rows]) => ({ key, title: `${groupTitle(groupBy, key)} (${rows.length})`, rows }))
  }, [filtered, groupBy])

  const shownColumns = columnOrder.map((key) => COLUMNS.find((c) => c.key === key)).filter((c): c is ColumnConfig => Boolean(c && visibleColumns[c.key]))

  const handleDropColumn = (from: ColumnKey, to: ColumnKey) => {
    if (from === to) return
    const next = [...columnOrder]
    const a = next.indexOf(from)
    const b = next.indexOf(to)
    if (a < 0 || b < 0) return
    next.splice(a, 1)
    next.splice(b, 0, from)
    setColumnOrder(next)
  }

  const startResize = (key: ColumnKey, e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = columnWidths[key]
    const onMove = (ev: MouseEvent) => setColumnWidths((prev) => ({ ...prev, [key]: Math.max(100, Math.min(420, startW + ev.clientX - startX)) }))
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const visibleIds = filtered.map((r) => r.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const applyBatch = async () => {
    if (selectedIds.length === 0) return
    setIsBatching(true)
    const snapshotRows = rows
      .filter((row) => selectedIds.includes(row.id))
      .map((row) => ({
        id: row.id,
        temperature: row.temperature,
        relationRole: row.relationRole,
        trustLevel: row.trustLevel,
      }))
    const undoId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setUndoStack((prev) => [{ id: undoId, rows: snapshotRows }, ...prev].slice(0, 3))
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const payload =
            batchField === 'temperature'
              ? { temperature: batchValue }
              : batchField === 'relationRole'
              ? { relationRole: batchValue }
              : { trustLevel: Number(batchValue) }
          return fetch(`/api/contacts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        })
      )

      setRows((prev) =>
        prev.map((row) =>
          selectedIds.includes(row.id)
            ? {
                ...row,
                temperature: batchField === 'temperature' ? (batchValue as Temperature) : row.temperature,
                relationRole: batchField === 'relationRole' ? (batchValue as RelationRole) : row.relationRole,
                trustLevel: batchField === 'trustLevel' ? Number(batchValue) : row.trustLevel,
              }
            : row
        )
      )

      toast.success('批量更新完成')
      setTimeout(() => {
        setUndoStack((prev) => prev.filter((item) => item.id !== undoId))
      }, 10000)
    } catch {
      toast.error('批量更新失败')
    } finally {
      setIsBatching(false)
    }
  }

  const saveCurrentView = async () => {
    const name = window.prompt('请输入视图名称')?.trim()
    if (!name) return
    try {
      const res = await fetch('/api/table-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'contacts',
          name,
          config: { search, roleFilter, tempFilter, groupBy, activeView },
        }),
      })
      const data = await res.json()
      if (data.view) {
        setSavedViews((prev) => [data.view, ...prev.filter((v) => v.id !== data.view.id)])
        toast.success('视图已保存到云端')
      }
    } catch {
      toast.error('保存视图失败')
    }
  }

  const applySavedView = (view: SavedView & { config?: Record<string, unknown> }) => {
    const cfg = (view.config ?? {}) as Record<string, string>
    setSearch((cfg.search as string) ?? '')
    setRoleFilter((cfg.roleFilter as 'ALL' | RelationRole) ?? 'ALL')
    setTempFilter((cfg.tempFilter as 'ALL' | Temperature) ?? 'ALL')
    setGroupBy((cfg.groupBy as GroupBy) ?? 'none')
    setActiveView((cfg.activeView as ViewKey) ?? 'all')
  }

  const removeSavedView = async (id: string) => {
    try {
      await fetch(`/api/table-views?id=${id}`, { method: 'DELETE' })
      setSavedViews((prev) => prev.filter((v) => v.id !== id))
    } catch {
      toast.error('删除视图失败')
    }
  }

  const renameSavedView = async (id: string, currentName: string) => {
    const nextName = window.prompt('请输入新的视图名称', currentName)?.trim()
    if (!nextName || nextName === currentName) return
    try {
      await fetch('/api/table-views', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: nextName }),
      })
      setSavedViews((prev) => prev.map((v) => (v.id === id ? { ...v, name: nextName } : v)))
      toast.success('视图已重命名')
    } catch {
      toast.error('重命名失败')
    }
  }

  const undoBatch = async (id: string) => {
    const entry = undoStack.find((v) => v.id === id)
    if (!entry) return

    setRows((prev) =>
      prev.map((row) => {
        const oldRow = entry.rows.find((r) => r.id === row.id)
        return oldRow
          ? {
              ...row,
              temperature: oldRow.temperature,
              relationRole: oldRow.relationRole,
              trustLevel: oldRow.trustLevel,
            }
          : row
      })
    )

    setUndoStack((prev) => prev.filter((v) => v.id !== id))

    const syncRows = async (rowsToSync: UndoEntry['rows']) => {
      setUndoSync({ running: true, done: 0, total: rowsToSync.length, failedRows: [] })
      const failedRows: UndoEntry['rows'] = []

      for (let i = 0; i < rowsToSync.length; i++) {
        const r = rowsToSync[i]
        try {
          const resp = await fetch(`/api/contacts/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              temperature: r.temperature,
              relationRole: r.relationRole,
              trustLevel: r.trustLevel,
            }),
          })
          if (!resp.ok) failedRows.push(r)
        } catch {
          failedRows.push(r)
        }
        setUndoSync((prev) => ({ ...prev, done: i + 1 }))
      }

      setUndoSync({ running: false, done: rowsToSync.length, total: rowsToSync.length, failedRows })
      if (failedRows.length > 0) {
        toast.error(`服务端回滚失败 ${failedRows.length} 条，可重试`)
      } else {
        toast.success('已撤销并同步到服务端')
      }
    }

    await syncRows(entry.rows)
  }

  const retryUndoSync = async () => {
    if (undoSync.failedRows.length === 0 || undoSync.running) return
    const rowsToSync = undoSync.failedRows
    setUndoSync({ running: false, done: 0, total: 0, failedRows: [] })

    const failedRows: UndoEntry['rows'] = []
    setUndoSync({ running: true, done: 0, total: rowsToSync.length, failedRows: [] })

    for (let i = 0; i < rowsToSync.length; i++) {
      const r = rowsToSync[i]
      try {
        const resp = await fetch(`/api/contacts/${r.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temperature: r.temperature,
            relationRole: r.relationRole,
            trustLevel: r.trustLevel,
          }),
        })
        if (!resp.ok) failedRows.push(r)
      } catch {
        failedRows.push(r)
      }
      setUndoSync((prev) => ({ ...prev, done: i + 1 }))
    }

    setUndoSync({ running: false, done: rowsToSync.length, total: rowsToSync.length, failedRows })
    if (failedRows.length > 0) {
      toast.error(`仍有 ${failedRows.length} 条回滚失败`)
    } else {
      toast.success('重试成功，已全部同步')
    }
  }

  const deleteOne = async (row: ContactRow) => {
    if (!window.confirm(`确认删除 ${row.name} 吗？`)) return
    const ok = await fetch(`/api/contacts/${row.id}`, { method: 'DELETE' })
    if (!ok.ok) {
      toast.error('删除失败')
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id))
    setSelectedIds((prev) => prev.filter((id) => id !== row.id))
    setDeleteUndoStack((prev) => [{ id: `${Date.now()}-${row.id}`, row }, ...prev].slice(0, 5))
    toast.success('已删除，可撤销')
  }

  const undoDelete = async (entryId: string) => {
    const entry = deleteUndoStack.find((v) => v.id === entryId)
    if (!entry) return
    const payload = {
      name: entry.row.name,
      relationRole: entry.row.relationRole,
      tags: entry.row.tags ? (() => { try { return JSON.parse(entry.row.tags) } catch { return [] } })() : [],
      company: entry.row.company,
      title: entry.row.title,
      trustLevel: entry.row.trustLevel,
      temperature: entry.row.temperature,
      notes: entry.row.notes ?? null,
    }
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.error('撤销失败')
      return
    }
    const data = await res.json().catch(() => null)
    const restored = data?.contact
    if (restored) {
      setRows((prev) => [{ ...entry.row, id: restored.id, createdAt: restored.createdAt ?? entry.row.createdAt, updatedAt: restored.updatedAt ?? entry.row.updatedAt }, ...prev])
    }
    setDeleteUndoStack((prev) => prev.filter((v) => v.id !== entryId))
    toast.success('已撤销删除')
  }

  const deleteAll = async () => {
    const token = window.prompt('请输入 alldelete 以确认删除全部联系人')
    if (token !== 'alldelete') {
      toast.error('口令不正确，已取消')
      return
    }
    setIsDeletingAll(true)
    try {
      const all = [...rows]
      const res = await fetch('/api/contacts/clear-all', { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      setRows([])
      setSelectedIds([])
      setDeleteUndoStack((prev) => [...all.map((row) => ({ id: `${Date.now()}-${row.id}`, row })), ...prev].slice(0, 5))
      toast.success('已全部删除')
    } catch {
      toast.error('全部删除失败')
    } finally {
      setIsDeletingAll(false)
    }
  }

  const deleteAllAiGenerated = async () => {
    const aiRows = rows.filter(isAiGeneratedContact)
    if (aiRows.length === 0) {
      toast.message('没有 AI 生成联系人')
      return
    }
    setIsDeletingAi(true)
    try {
      await Promise.all(aiRows.map((row) => fetch(`/api/contacts/${row.id}`, { method: 'DELETE' })))
      setRows((prev) => prev.filter((row) => !isAiGeneratedContact(row)))
      setSelectedIds((prev) => prev.filter((id) => !aiRows.some((r) => r.id === id)))
      setDeleteUndoStack((prev) => [...aiRows.map((row) => ({ id: `${Date.now()}-${row.id}`, row })), ...prev].slice(0, 5))
      toast.success(`已删除 ${aiRows.length} 条 AI 联系人`)
    } catch {
      toast.error('删除 AI 联系人失败')
    } finally {
      setIsDeletingAi(false)
    }
  }

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/contacts/new" className="inline-flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500">+ 新建</Link>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索姓名、公司、职位" className="h-8 w-56 rounded-md border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-cyan-400" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'ALL' | RelationRole)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
            <option value="ALL">全部角色</option>{Object.entries(RELATION_ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label.name}</option>)}
          </select>
          <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value as 'ALL' | Temperature)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
            <option value="ALL">全部温度</option><option value="HOT">热</option><option value="WARM">温</option><option value="COLD">冷</option>
          </select>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
            <option value="none">不分组</option><option value="relationRole">按角色分组</option><option value="temperature">按温度分组</option><option value="company">按公司分组</option>
          </select>
          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50">自定义列</summary>
            <div className="absolute left-0 top-9 z-30 w-44 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
              {COLUMNS.map((col) => <label key={col.key} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-slate-50"><input type="checkbox" checked={visibleColumns[col.key]} onChange={() => setVisibleColumns((prev) => ({ ...prev, [col.key]: !prev[col.key] }))} /><span>{col.label}</span></label>)}
            </div>
          </details>
          <span className="ml-auto text-xs text-slate-500">共 {filtered.length} 条 · 可拖拽列头排序/拉伸宽度</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick={() => setActiveView('all')} className={`px-2.5 py-1 text-xs rounded-md border ${activeView === 'all' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-300'}`}>全部</button>
          <button onClick={() => setActiveView('followup')} className={`px-2.5 py-1 text-xs rounded-md border ${activeView === 'followup' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-300'}`}>待跟进</button>
          <button onClick={() => setActiveView('hot')} className={`px-2.5 py-1 text-xs rounded-md border ${activeView === 'hot' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-300'}`}>高温关系</button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            全选当前结果
          </label>

          <span className="text-xs text-slate-500">已选 {selectedIds.length}</span>

          <button onClick={deleteAll} disabled={isDeletingAll} className="px-2.5 py-1 text-xs rounded-md border border-rose-300 text-rose-700 disabled:opacity-50">
            全部删除
          </button>

          <button onClick={deleteAllAiGenerated} disabled={isDeletingAi} className="px-2.5 py-1 text-xs rounded-md border border-amber-300 text-amber-700 disabled:opacity-50">
            全部删除AI生成人脉
          </button>

          <button onClick={saveCurrentView} className="px-2.5 py-1 text-xs rounded-md border border-emerald-300 text-emerald-700">
            保存当前视图
          </button>

          <details className="relative">
            <summary className="px-2.5 py-1 text-xs rounded-md border border-slate-300 text-slate-700 cursor-pointer list-none">已保存视图</summary>
            <div className="absolute left-0 top-8 z-30 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-xl space-y-1">
              {savedViews.length === 0 && <p className="text-xs text-slate-400 px-2 py-1">还没有保存的视图</p>}
              {savedViews.map((view) => (
                <div key={view.id} className="flex items-center gap-1">
                  <button onClick={() => applySavedView(view)} className="flex-1 text-left px-2 py-1 text-xs rounded hover:bg-slate-50">{view.name}</button>
                  <button onClick={() => renameSavedView(view.id, view.name)} className="px-2 py-1 text-xs text-indigo-600">改</button>
                  <button onClick={() => removeSavedView(view.id)} className="px-2 py-1 text-xs text-rose-600">删</button>
                </div>
              ))}
            </div>
          </details>
        </div>

        {batchPanelOpen && (
          <div className="mt-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-indigo-800">批量字段</span>
            <select value={batchField} onChange={(e) => {
              const field = e.target.value as BatchField
              setBatchField(field)
              setBatchValue(field === 'temperature' ? 'HOT' : field === 'relationRole' ? 'GATEWAY' : '3')
            }} className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs">
              <option value="temperature">温度</option>
              <option value="relationRole">角色关系</option>
              <option value="trustLevel">信任度</option>
            </select>

            {batchField === 'temperature' && (
              <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs">
                <option value="HOT">热</option>
                <option value="WARM">温</option>
                <option value="COLD">冷</option>
              </select>
            )}
            {batchField === 'relationRole' && (
              <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs">
                {Object.entries(RELATION_ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label.name}</option>
                ))}
              </select>
            )}
            {batchField === 'trustLevel' && (
              <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs">
                <option value="1">1 星</option>
                <option value="2">2 星</option>
                <option value="3">3 星</option>
                <option value="4">4 星</option>
                <option value="5">5 星</option>
              </select>
            )}

            <button disabled={isBatching || selectedIds.length === 0} onClick={applyBatch} className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white disabled:opacity-40">
              应用到已选 {selectedIds.length} 条
            </button>
          </div>
        )}

        {undoStack.length > 0 && (
          <div className="mt-2 p-2 rounded-md border border-amber-300 bg-amber-50 space-y-1">
            <p className="text-xs text-amber-800">可撤销最近批量编辑（10 秒内，最多 3 条）</p>
            {undoStack.map((entry, idx) => (
              <div key={entry.id} className="flex items-center justify-between">
                <span className="text-xs text-amber-700">操作 #{undoStack.length - idx}</span>
                <button onClick={() => undoBatch(entry.id)} className="px-2.5 py-1 text-xs rounded border border-amber-300 text-amber-800">
                  撤销
                </button>
              </div>
            ))}
          </div>
        )}

        {deleteUndoStack.length > 0 && (
          <div className="mt-2 p-2 rounded-md border border-rose-300 bg-rose-50 space-y-1">
            <p className="text-xs text-rose-800">可撤销删除（最多保留 5 次）</p>
            {deleteUndoStack.map((entry, idx) => (
              <div key={entry.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-rose-700 truncate">#{deleteUndoStack.length - idx} · {entry.row.name}</span>
                <button onClick={() => undoDelete(entry.id)} className="px-2.5 py-1 text-xs rounded border border-rose-300 text-rose-800">
                  撤销删除
                </button>
              </div>
            ))}
          </div>
        )}

        {(undoSync.running || undoSync.total > 0) && (
          <div className="mt-2 p-2 rounded-md border border-sky-300 bg-sky-50 flex items-center justify-between gap-2">
            <span className="text-xs text-sky-800">
              服务端回滚进度：{undoSync.done}/{undoSync.total}
              {undoSync.failedRows.length > 0 ? ` · 失败 ${undoSync.failedRows.length} 条` : ''}
            </span>
            {undoSync.failedRows.length > 0 && !undoSync.running && (
              <button onClick={retryUndoSync} className="px-2.5 py-1 text-xs rounded border border-sky-300 text-sky-800">
                重试失败项
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? <div className="px-6 py-14 text-center text-sm text-slate-500">暂无匹配联系人</div> : (
        <div className="overflow-x-auto">
          {grouped.map((group) => (
            <div key={group.key} className="border-b border-slate-200">
              <div className="sticky left-0 z-10 border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">{group.title}</div>
              <table className="w-full text-sm" style={{ minWidth: shownColumns.reduce((n, c) => n + columnWidths[c.key], 0) }}>
                <thead><tr className="bg-white">
                  <th className="border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-500" style={{ width: 110, minWidth: 110 }}>
                    操作
                  </th>
                  <th className="border-b border-r border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-500" style={{ width: 44, minWidth: 44 }}>
                    选
                  </th>
                  {shownColumns.map((col) => (
                    <th key={col.key} draggable onDragStart={(e) => e.dataTransfer.setData('text/col', col.key)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropColumn(e.dataTransfer.getData('text/col') as ColumnKey, col.key)} className="relative border-b border-r border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500" style={{ width: columnWidths[col.key], minWidth: columnWidths[col.key] }}>
                      {col.label}<div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize" onMouseDown={(e) => startResize(col.key, e)} />
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-cyan-50/40">
                      <td className="border-b border-r border-slate-100 px-2 py-2">
                        <div className="flex items-center gap-1">
                          <Link href={`/contacts/${row.id}/edit`} className="rounded border border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50">编辑</Link>
                          <button onClick={() => deleteOne(row)} className="rounded border border-rose-300 px-1.5 py-0.5 text-[11px] text-rose-700 hover:bg-rose-50">删除</button>
                        </div>
                      </td>
                      <td className="border-b border-r border-slate-100 px-2 py-2">
                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                      </td>
                      {visibleColumns.name && <td className="border-b border-r border-slate-100 px-3 py-2 font-medium text-slate-800"><Link href={`/contacts/${row.id}`} className="hover:text-cyan-700">{row.name}{isAiGeneratedContact(row) ? '*' : ''}</Link></td>}
                      {visibleColumns.company && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-700">{row.company ?? '—'}</td>}
                      {visibleColumns.title && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-700">{row.title ?? '—'}</td>}
                      {visibleColumns.trustLevel && <td className="border-b border-r border-slate-100 px-3 py-2">{row.trustLevel ? <span className="text-amber-500">{'★'.repeat(row.trustLevel)}</span> : <span className="text-slate-400">—</span>}</td>}
                      {visibleColumns.relationRole && <td className="border-b border-r border-slate-100 px-3 py-2"><span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[row.relationRole]}`}>{RELATION_ROLE_LABELS[row.relationRole].name}</span></td>}
                      {visibleColumns.createdAt && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-600">{formatDate(row.createdAt)}</td>}
                      {visibleColumns.lastContactedAt && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-600">{formatDate(row.lastContactedAt)}</td>}
                      {visibleColumns.temperature && <td className="border-b border-r border-slate-100 px-3 py-2">{row.temperature ? <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${TEMP_COLOR[row.temperature]}`}>{TEMPERATURE_LABELS[row.temperature]}</span> : <span className="text-slate-400">—</span>}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
