'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { toast } from 'sonner'
import { COMPANY_SCALE_LABELS, TEMPERATURE_LABELS, type CompanyScale, type Temperature } from '@/types'

type Company = {
  id: string
  name: string
  industry: string | null
  scale: CompanyScale | null
  tags: string | null
  temperature: Temperature | null
  energyScore: number
  familiarityLevel: number | null
  mainBusiness: string | null
  notes: string | null
  contacts: { id: string; name: string }[]
  createdAt: Date | string
  updatedAt: Date | string
}

type GroupBy = 'none' | 'scale' | 'industry' | 'temperature'
type ViewKey = 'all' | 'core' | 'hot'
type ColumnKey = 'name' | 'industry' | 'mainBusiness' | 'scale' | 'familiarityLevel' | 'energyScore' | 'temperature' | 'createdAt' | 'updatedAt'
type ColumnConfig = { key: ColumnKey; label: string; defaultOn: boolean; defaultWidth: number }
type BatchField = 'temperature' | 'scale' | 'familiarityLevel'
type SavedView = {
  id: string
  name: string
  config: Record<string, unknown>
  updatedAt?: string
}
type UndoEntry = {
  id: string
  rows: Array<Pick<Company, 'id' | 'temperature' | 'scale' | 'familiarityLevel'>>
}

type DeletedCompanyEntry = {
  id: string
  row: Company
}

const STORAGE_KEY = 'pm-companies-table-v1'
const COLUMNS: ColumnConfig[] = [
  { key: 'name', label: '企业名称', defaultOn: true, defaultWidth: 220 },
  { key: 'industry', label: '行业', defaultOn: true, defaultWidth: 160 },
  { key: 'mainBusiness', label: '主营业务', defaultOn: true, defaultWidth: 240 },
  { key: 'scale', label: '企业规模', defaultOn: true, defaultWidth: 140 },
  { key: 'familiarityLevel', label: '熟悉度', defaultOn: true, defaultWidth: 130 },
  { key: 'energyScore', label: '能量值', defaultOn: true, defaultWidth: 120 },
  { key: 'temperature', label: '温度', defaultOn: true, defaultWidth: 120 },
  { key: 'createdAt', label: '入库时间', defaultOn: true, defaultWidth: 150 },
  { key: 'updatedAt', label: '最近更新', defaultOn: false, defaultWidth: 150 },
]
const TEMP_COLOR: Record<Temperature, string> = {
  HOT: 'bg-rose-100 text-rose-700 border-rose-200',
  WARM: 'bg-amber-100 text-amber-700 border-amber-200',
  COLD: 'bg-sky-100 text-sky-700 border-sky-200',
}
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
  if (groupBy === 'scale') return value === 'NONE' ? '未设置规模' : COMPANY_SCALE_LABELS[value as CompanyScale]?.name ?? value
  if (groupBy === 'temperature') return value === 'NONE' ? '未设置温度' : TEMPERATURE_LABELS[value as Temperature]
  if (groupBy === 'industry') return value === 'NONE' ? '未填写行业' : value
  return value
}

function isAiGeneratedCompany(row: Company) {
  return (row.notes ?? '').includes('自动生成的测试数据')
}

export default function CompaniesTable({ companies }: { companies: Company[] }) {
  const [rows, setRows] = useState(companies)
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState<ViewKey>('all')
  const [scaleFilter, setScaleFilter] = useState<'ALL' | CompanyScale>('ALL')
  const [tempFilter, setTempFilter] = useState<'ALL' | Temperature>('ALL')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBatching, setIsBatching] = useState(false)
  const [batchPanelOpen] = useState(false)
  const [batchField, setBatchField] = useState<BatchField>('temperature')
  const [batchValue, setBatchValue] = useState('HOT')
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [deleteUndoStack, setDeleteUndoStack] = useState<DeletedCompanyEntry[]>([])
  const [isDeletingAll, setIsDeletingAll] = useState(false)
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
    setRows(companies)
  }, [companies])

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
    fetch('/api/table-views?table=companies')
      .then((r) => r.json())
      .then((data) => setSavedViews(Array.isArray(data.views) ? data.views : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ visibleColumns, columnOrder, columnWidths, groupBy, activeView }))
  }, [visibleColumns, columnOrder, columnWidths, groupBy, activeView])

  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.trim().toLowerCase()
    const hitSearch = !q || c.name.toLowerCase().includes(q) || (c.industry ?? '').toLowerCase().includes(q) || (c.mainBusiness ?? '').toLowerCase().includes(q)
    const hitScale = scaleFilter === 'ALL' || c.scale === scaleFilter
    const hitTemp = tempFilter === 'ALL' || c.temperature === tempFilter
    const hitView = activeView === 'all' ? true : activeView === 'core' ? (c.energyScore >= 70 || (c.familiarityLevel ?? 0) >= 4) : c.temperature === 'HOT'
    return hitSearch && hitScale && hitTemp && hitView
  }), [rows, search, scaleFilter, tempFilter, activeView])

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'ALL', title: `全部企业 (${filtered.length})`, rows: filtered }]
    const map = new Map<string, Company[]>()
    for (const row of filtered) {
      const key = groupBy === 'scale' ? row.scale ?? 'NONE' : groupBy === 'temperature' ? row.temperature ?? 'NONE' : row.industry ?? 'NONE'
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
    const onMove = (ev: MouseEvent) => setColumnWidths((prev) => ({ ...prev, [key]: Math.max(100, Math.min(460, startW + ev.clientX - startX)) }))
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
        scale: row.scale,
        familiarityLevel: row.familiarityLevel,
      }))
    const undoId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setUndoStack((prev) => [{ id: undoId, rows: snapshotRows }, ...prev].slice(0, 3))
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const payload =
            batchField === 'temperature'
              ? { temperature: batchValue }
              : batchField === 'scale'
              ? { scale: batchValue }
              : { familiarityLevel: Number(batchValue) }
          return fetch(`/api/companies/${id}`, {
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
                scale: batchField === 'scale' ? (batchValue as CompanyScale) : row.scale,
                familiarityLevel: batchField === 'familiarityLevel' ? Number(batchValue) : row.familiarityLevel,
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
          table: 'companies',
          name,
          config: { search, scaleFilter, tempFilter, groupBy, activeView },
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
    setScaleFilter((cfg.scaleFilter as 'ALL' | CompanyScale) ?? 'ALL')
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
              scale: oldRow.scale,
              familiarityLevel: oldRow.familiarityLevel,
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
          const resp = await fetch(`/api/companies/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              temperature: r.temperature,
              scale: r.scale,
              familiarityLevel: r.familiarityLevel,
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
        const resp = await fetch(`/api/companies/${r.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temperature: r.temperature,
            scale: r.scale,
            familiarityLevel: r.familiarityLevel,
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

  const deleteOne = async (row: Company) => {
    if (!window.confirm(`确认删除企业 ${row.name} 吗？`)) return
    const res = await fetch(`/api/companies/${row.id}`, { method: 'DELETE' })
    if (!res.ok) {
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
      industry: entry.row.industry,
      scale: entry.row.scale,
      tags: entry.row.tags ? (() => { try { return JSON.parse(entry.row.tags) } catch { return [] } })() : [],
      temperature: entry.row.temperature,
      familiarityLevel: entry.row.familiarityLevel,
      energyScore: entry.row.energyScore,
      mainBusiness: entry.row.mainBusiness,
      notes: entry.row.notes ?? null,
    }
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.error('撤销失败')
      return
    }
    const data = await res.json().catch(() => null)
    const restored = data?.company
    if (restored) {
      setRows((prev) => [{ ...entry.row, id: restored.id, createdAt: restored.createdAt ?? entry.row.createdAt, updatedAt: restored.updatedAt ?? entry.row.updatedAt }, ...prev])
    }
    setDeleteUndoStack((prev) => prev.filter((v) => v.id !== entryId))
    toast.success('已撤销删除')
  }

  const deleteAll = async () => {
    const token = window.prompt('请输入 alldelete 以确认删除全部企业')
    if (token !== 'alldelete') {
      toast.error('口令不正确，已取消')
      return
    }
    setIsDeletingAll(true)
    try {
      const all = [...rows]
      await Promise.all(all.map((row) => fetch(`/api/companies/${row.id}`, { method: 'DELETE' })))
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

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/companies/new" className="inline-flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500">+ 新建</Link>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索企业、行业、主营业务" className="h-8 w-56 rounded-md border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-cyan-400" />
          <select value={scaleFilter} onChange={(e) => setScaleFilter(e.target.value as 'ALL' | CompanyScale)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
            <option value="ALL">全部规模</option>{Object.entries(COMPANY_SCALE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
          <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value as 'ALL' | Temperature)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
            <option value="ALL">全部温度</option><option value="HOT">热</option><option value="WARM">温</option><option value="COLD">冷</option>
          </select>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
            <option value="none">不分组</option><option value="scale">按规模分组</option><option value="industry">按行业分组</option><option value="temperature">按温度分组</option>
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
          <button onClick={() => setActiveView('core')} className={`px-2.5 py-1 text-xs rounded-md border ${activeView === 'core' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-300'}`}>核心企业</button>
          <button onClick={() => setActiveView('hot')} className={`px-2.5 py-1 text-xs rounded-md border ${activeView === 'hot' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-300'}`}>高温企业</button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            全选当前结果
          </label>

          <span className="text-xs text-slate-500">已选 {selectedIds.length}</span>

          <button onClick={deleteAll} disabled={isDeletingAll} className="px-2.5 py-1 text-xs rounded-md border border-rose-300 text-rose-700 disabled:opacity-50">
            全部删除
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
              setBatchValue(field === 'temperature' ? 'HOT' : field === 'scale' ? 'LISTED' : '3')
            }} className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs">
              <option value="temperature">温度</option>
              <option value="scale">企业规模</option>
              <option value="familiarityLevel">熟悉度</option>
            </select>

            {batchField === 'temperature' && (
              <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs">
                <option value="HOT">热</option>
                <option value="WARM">温</option>
                <option value="COLD">冷</option>
              </select>
            )}
            {batchField === 'scale' && (
              <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-md border border-indigo-200 bg-white px-2 text-xs">
                {Object.entries(COMPANY_SCALE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label.name}</option>
                ))}
              </select>
            )}
            {batchField === 'familiarityLevel' && (
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

      {filtered.length === 0 ? <div className="px-6 py-14 text-center text-sm text-slate-500">暂无匹配企业</div> : (
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
                          <Link href={`/companies/${row.id}/edit`} className="rounded border border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50">编辑</Link>
                          <button onClick={() => deleteOne(row)} className="rounded border border-rose-300 px-1.5 py-0.5 text-[11px] text-rose-700 hover:bg-rose-50">删除</button>
                        </div>
                      </td>
                      <td className="border-b border-r border-slate-100 px-2 py-2">
                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                      </td>
                      {visibleColumns.name && <td className="border-b border-r border-slate-100 px-3 py-2 font-medium text-slate-800"><Link href={`/companies/${row.id}`} className="hover:text-cyan-700">{row.name}{isAiGeneratedCompany(row) ? '*' : ''}</Link></td>}
                      {visibleColumns.industry && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-700">{row.industry ?? '—'}</td>}
                      {visibleColumns.mainBusiness && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-700">{row.mainBusiness ?? '—'}</td>}
                      {visibleColumns.scale && <td className="border-b border-r border-slate-100 px-3 py-2">{row.scale ? <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${COMPANY_SCALE_LABELS[row.scale].color}`}>{COMPANY_SCALE_LABELS[row.scale].name}</span> : <span className="text-slate-400">—</span>}</td>}
                      {visibleColumns.familiarityLevel && <td className="border-b border-r border-slate-100 px-3 py-2 text-amber-500">{row.familiarityLevel ? '★'.repeat(row.familiarityLevel) : <span className="text-slate-400">—</span>}</td>}
                      {visibleColumns.energyScore && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-700">{row.energyScore}</td>}
                      {visibleColumns.temperature && <td className="border-b border-r border-slate-100 px-3 py-2">{row.temperature ? <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${TEMP_COLOR[row.temperature]}`}>{TEMPERATURE_LABELS[row.temperature]}</span> : <span className="text-slate-400">—</span>}</td>}
                      {visibleColumns.createdAt && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-600">{formatDate(row.createdAt)}</td>}
                      {visibleColumns.updatedAt && <td className="border-b border-r border-slate-100 px-3 py-2 text-slate-600">{formatDate(row.updatedAt)}</td>}
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
