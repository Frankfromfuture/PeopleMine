'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp, ChevronsUpDown, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { toast } from 'sonner'
import {
  ROLE_ARCHETYPE_LABELS, TEMPERATURE_LABELS, SPIRIT_ANIMAL_NEW_LABELS,
  JOB_POSITION_LABELS, JOB_FUNCTION_LABELS, INDUSTRY_L1_OPTIONS, INDUSTRY_L2_MAP,
  type RoleArchetype, type Temperature, type SpiritAnimalNew, type JobPosition, type JobFunction,
} from '@/types'
import { ARCHETYPE_STYLES } from '@/components/RoleArchetypeTag'

type ContactRow = {
  id: string
  name: string
  fullName?: string | null
  roleArchetype: RoleArchetype | null
  spiritAnimal?: SpiritAnimalNew | null
  industry?: string | null
  industryL1?: string | null
  industryL2?: string | null
  temperature: Temperature | null
  trustLevel: number | null
  chemistryScore?: number | null
  company: string | null
  companyName?: string | null
  title: string | null
  jobTitle?: string | null
  jobPosition?: string | null
  jobFunction?: string | null
  noteSummary?: string | null
  notes: string | null
  gender?: string | null
  age?: number | null
  personalRelation?: string | null
  reciprocityLevel?: number | null
  valueScore?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  lastContactedAt: Date | string | null
}

type GroupBy = 'none' | 'roleArchetype' | 'temperature' | 'company'
type ViewKey = 'all' | 'followup' | 'hot'
type ColumnKey =
  | 'name' | 'spiritAnimal' | 'roleArchetype' | 'temperature' | 'trustLevel'
  | 'industryL1' | 'industryL2' | 'jobPosition' | 'jobFunction'
  | 'company' | 'title' | 'createdAt' | 'lastContactedAt'
type EditType = 'text' | 'select' | 'stars'
type ColumnConfig = {
  key: ColumnKey
  label: string
  defaultOn: boolean
  defaultWidth: number
  editable: boolean
  editType: EditType
}
type BatchField = 'temperature' | 'roleArchetype' | 'trustLevel'
type SavedView = { id: string; name: string; config: Record<string, unknown>; updatedAt?: string }
type UndoEntry = { id: string; rows: Array<Pick<ContactRow, 'id' | 'temperature' | 'roleArchetype' | 'trustLevel'>> }
type DeletedContactEntry = { id: string; row: ContactRow }
type EditingCell = { rowId: string; field: ColumnKey } | null
type SortState = { key: ColumnKey; direction: 'desc' | 'asc' } | null

const STORAGE_KEY = 'pm-contacts-table-v4'

const COLUMNS: ColumnConfig[] = [
  { key: 'name',           label: '姓名',   defaultOn: true,  defaultWidth: 168, editable: false, editType: 'text' },
  { key: 'spiritAnimal',   label: '气场',   defaultOn: true,  defaultWidth: 100, editable: true,  editType: 'select' },
  { key: 'roleArchetype',  label: '角色',   defaultOn: true,  defaultWidth: 100, editable: true,  editType: 'select' },
  { key: 'temperature',    label: '温度',   defaultOn: true,  defaultWidth: 70,  editable: true,  editType: 'select' },
  { key: 'trustLevel',     label: '契合',   defaultOn: true,  defaultWidth: 80,  editable: true,  editType: 'stars' },
  { key: 'industryL1',     label: '行业',   defaultOn: true,  defaultWidth: 100, editable: true,  editType: 'select' },
  { key: 'industryL2',     label: '细分',   defaultOn: true,  defaultWidth: 100, editable: true,  editType: 'select' },
  { key: 'jobPosition',    label: '层级',   defaultOn: true,  defaultWidth: 90,  editable: true,  editType: 'select' },
  { key: 'jobFunction',    label: '职能',   defaultOn: true,  defaultWidth: 90,  editable: true,  editType: 'select' },
  { key: 'company',        label: '公司',   defaultOn: true,  defaultWidth: 140, editable: true,  editType: 'text' },
  { key: 'title',          label: '职位',   defaultOn: false, defaultWidth: 120, editable: true,  editType: 'text' },
  { key: 'createdAt',      label: '入库',   defaultOn: false, defaultWidth: 80,  editable: false, editType: 'text' },
  { key: 'lastContactedAt',label: '联络',   defaultOn: false, defaultWidth: 80,  editable: false, editType: 'text' },
]

const DEFAULT_VISIBLE = Object.fromEntries(COLUMNS.map((c) => [c.key, c.defaultOn])) as Record<ColumnKey, boolean>
const DEFAULT_WIDTHS  = Object.fromEntries(COLUMNS.map((c) => [c.key, c.defaultWidth])) as Record<ColumnKey, number>
const DEFAULT_ORDER   = COLUMNS.map((c) => c.key)

const SPIRIT_ANIMAL_OPTIONS = Object.entries(SPIRIT_ANIMAL_NEW_LABELS).map(([v, l]) => ({ value: v, label: `${l.emoji} ${l.name}` }))
const ROLE_OPTIONS          = Object.entries(ROLE_ARCHETYPE_LABELS).map(([v, l]) => ({ value: v, label: l.name }))
const TEMP_OPTIONS          = [{ value: 'HOT', label: '热' }, { value: 'WARM', label: '温' }, { value: 'COLD', label: '冷' }]
const JOB_POSITION_OPTIONS  = Object.entries(JOB_POSITION_LABELS).map(([v, l]) => ({ value: v, label: l }))
const JOB_FUNCTION_OPTIONS  = Object.entries(JOB_FUNCTION_LABELS).map(([v, l]) => ({ value: v, label: l }))
const INDUSTRY_L1_OPTS      = INDUSTRY_L1_OPTIONS.map((v) => ({ value: v, label: v }))

function getIndustryL2Options(l1: string | null | undefined) {
  if (!l1 || !INDUSTRY_L2_MAP[l1]) return []
  return INDUSTRY_L2_MAP[l1].map((v) => ({ value: v, label: v }))
}

function selectOptionsForColumn(col: ColumnKey, row: ContactRow) {
  if (col === 'spiritAnimal')  return SPIRIT_ANIMAL_OPTIONS
  if (col === 'roleArchetype') return ROLE_OPTIONS
  if (col === 'temperature')   return TEMP_OPTIONS
  if (col === 'jobPosition')   return JOB_POSITION_OPTIONS
  if (col === 'jobFunction')   return JOB_FUNCTION_OPTIONS
  if (col === 'industryL1')    return INDUSTRY_L1_OPTS
  if (col === 'industryL2')    return getIndustryL2Options(row.industryL1)
  return []
}

function getCellValue(col: ColumnKey, row: ContactRow): string | null {
  if (col === 'name')            return row.fullName ?? row.name
  if (col === 'spiritAnimal')    return row.spiritAnimal ?? null
  if (col === 'roleArchetype')   return row.roleArchetype ?? null
  if (col === 'temperature')     return row.temperature ?? null
  if (col === 'trustLevel')      return String(row.chemistryScore ?? row.trustLevel ?? '') || null
  if (col === 'industryL1')      return row.industryL1 ?? null
  if (col === 'industryL2')      return row.industryL2 ?? null
  if (col === 'jobPosition')     return row.jobPosition ?? null
  if (col === 'jobFunction')     return row.jobFunction ?? null
  if (col === 'company')         return row.companyName ?? row.company ?? null
  if (col === 'title')           return row.jobTitle ?? row.title ?? null
  if (col === 'createdAt')       return formatDate(row.createdAt)
  if (col === 'lastContactedAt') return formatDate(row.lastContactedAt)
  return null
}

function buildPatchPayload(col: ColumnKey, value: string | null): Record<string, unknown> {
  if (col === 'name')          return { fullName: value, name: value }
  if (col === 'spiritAnimal')  return { spiritAnimal: value }
  if (col === 'roleArchetype') return { roleArchetype: value }
  if (col === 'temperature')   return { temperature: value }
  if (col === 'trustLevel')    return { trustLevel: value ? Number(value) : null }
  if (col === 'industryL1')    return { industryL1: value, industryL2: null }
  if (col === 'industryL2')    return { industryL2: value }
  if (col === 'jobPosition')   return { jobPosition: value }
  if (col === 'jobFunction')   return { jobFunction: value }
  if (col === 'company')       return { companyName: value }
  if (col === 'title')         return { jobTitle: value, title: value }
  return {}
}

function applyLocalUpdate(row: ContactRow, col: ColumnKey, value: string | null): ContactRow {
  if (col === 'name')          return { ...row, fullName: value, name: value ?? row.name }
  if (col === 'spiritAnimal')  return { ...row, spiritAnimal: value as SpiritAnimalNew | null }
  if (col === 'roleArchetype') return { ...row, roleArchetype: value as RoleArchetype | null }
  if (col === 'temperature')   return { ...row, temperature: value as Temperature | null }
  if (col === 'trustLevel')    return { ...row, trustLevel: value ? Number(value) : null, chemistryScore: value ? Number(value) : null }
  if (col === 'industryL1')    return { ...row, industryL1: value, industryL2: null }
  if (col === 'industryL2')    return { ...row, industryL2: value }
  if (col === 'jobPosition')   return { ...row, jobPosition: value }
  if (col === 'jobFunction')   return { ...row, jobFunction: value }
  if (col === 'company')       return { ...row, companyName: value, company: value }
  if (col === 'title')         return { ...row, jobTitle: value, title: value }
  return row
}

const formatDate = (v: Date | string | null | undefined) => {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function groupTitle(groupBy: GroupBy, value: string) {
  if (!value) return '未分组'
  if (groupBy === 'roleArchetype') return ROLE_ARCHETYPE_LABELS[value as RoleArchetype]?.name ?? value
  if (groupBy === 'temperature')   return value === 'NONE' ? '未设置温度' : TEMPERATURE_LABELS[value as Temperature]
  if (groupBy === 'company')       return value === 'NONE' ? '未填写公司' : value
  return value
}

function isAiGeneratedContact(row: ContactRow) {
  return (row.notes ?? '').includes('自动生成的测试数据')
}

function getComparableValue(col: ColumnKey, row: ContactRow): number | string {
  if (col === 'name') return (row.fullName ?? row.name ?? '').toLowerCase()
  if (col === 'spiritAnimal') return SPIRIT_ANIMAL_NEW_LABELS[row.spiritAnimal as SpiritAnimalNew]?.name ?? ''
  if (col === 'roleArchetype') return ROLE_ARCHETYPE_LABELS[row.roleArchetype as RoleArchetype]?.name ?? ''
  if (col === 'temperature') return row.temperature === 'HOT' ? 3 : row.temperature === 'WARM' ? 2 : row.temperature === 'COLD' ? 1 : 0
  if (col === 'trustLevel') return row.chemistryScore ?? row.trustLevel ?? 0
  if (col === 'industryL1') return row.industryL1 ?? ''
  if (col === 'industryL2') return row.industryL2 ?? ''
  if (col === 'jobPosition') return JOB_POSITION_LABELS[row.jobPosition as JobPosition] ?? row.jobPosition ?? ''
  if (col === 'jobFunction') return JOB_FUNCTION_LABELS[row.jobFunction as JobFunction] ?? row.jobFunction ?? ''
  if (col === 'company') return row.companyName ?? row.company ?? ''
  if (col === 'title') return row.jobTitle ?? row.title ?? ''
  if (col === 'createdAt') return row.createdAt ? new Date(row.createdAt).getTime() : 0
  if (col === 'lastContactedAt') return row.lastContactedAt ? new Date(row.lastContactedAt).getTime() : 0
  return ''
}

function SortIcon({ state }: { state: SortState }) {
  if (!state) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-300" />
  return state.direction === 'desc' ? (
    <ChevronDown className="h-3.5 w-3.5 text-gray-700" />
  ) : (
    <ChevronUp className="h-3.5 w-3.5 text-gray-700" />
  )
}

// ── Cell display ──────────────────────────────────────────────────────────

function CellDisplay({ col, row }: { col: ColumnKey; row: ContactRow }) {
  if (col === 'name') {
    const display = row.fullName ?? row.name
    return (
      <Link
        href={`/contacts/${row.id}/edit`}
        className="block max-w-full truncate font-medium text-slate-800 transition hover:text-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {display}{isAiGeneratedContact(row) ? '*' : ''}
      </Link>
    )
  }
  if (col === 'spiritAnimal') {
    const a = row.spiritAnimal ? SPIRIT_ANIMAL_NEW_LABELS[row.spiritAnimal] : null
    return a ? <span className="whitespace-nowrap">{a.emoji} <span className="text-xs text-slate-600">{a.name}</span></span> : <span className="text-gray-300">—</span>
  }
  if (col === 'roleArchetype') {
    return row.roleArchetype
      ? <span className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] font-medium ${ARCHETYPE_STYLES[row.roleArchetype]}`}>{ROLE_ARCHETYPE_LABELS[row.roleArchetype].name}</span>
      : <span className="text-gray-300">—</span>
  }
  if (col === 'temperature') {
    const map: Record<Temperature, string> = { HOT: 'bg-gray-200 text-gray-700', WARM: 'bg-gray-100 text-gray-600', COLD: 'bg-gray-50 text-gray-500' }
    return row.temperature
      ? <span className={`inline-flex rounded border border-gray-200 px-1.5 py-0.5 text-[11px] font-medium ${map[row.temperature]}`}>{TEMPERATURE_LABELS[row.temperature]}</span>
      : <span className="text-gray-300">—</span>
  }
  if (col === 'trustLevel') {
    const v = row.chemistryScore ?? row.trustLevel
    return v ? <span className="text-[11px] tracking-tighter text-gray-500">{'★'.repeat(v)}{'☆'.repeat(5 - v)}</span> : <span className="text-gray-300">—</span>
  }
  if (col === 'industryL1') {
    return row.industryL1
      ? <span className="inline-flex rounded border border-gray-300 bg-gray-200 px-1.5 py-0.5 text-[11px] text-gray-700">{row.industryL1}</span>
      : <span className="text-gray-300">—</span>
  }
  if (col === 'industryL2') {
    return row.industryL2
      ? <span className="inline-flex rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{row.industryL2}</span>
      : <span className="text-gray-300">—</span>
  }
  if (col === 'jobPosition') {
    return row.jobPosition
      ? <span className="inline-flex rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{JOB_POSITION_LABELS[row.jobPosition as JobPosition] ?? row.jobPosition}</span>
      : <span className="text-gray-300">—</span>
  }
  if (col === 'jobFunction') {
    return row.jobFunction
      ? <span className="inline-flex rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">{JOB_FUNCTION_LABELS[row.jobFunction as JobFunction] ?? row.jobFunction}</span>
      : <span className="text-gray-300">—</span>
  }
  if (col === 'company') {
    const v = row.companyName ?? row.company
    return v ? <span className="text-xs text-slate-700 truncate">{v}</span> : <span className="text-gray-300">—</span>
  }
  if (col === 'title') {
    const v = row.jobTitle ?? row.title
    return v ? <span className="text-xs text-slate-600 truncate">{v}</span> : <span className="text-gray-300">—</span>
  }
  if (col === 'createdAt') {
    const v = formatDate(row.createdAt)
    return <span className="text-[11px] text-slate-400">{v ?? '—'}</span>
  }
  if (col === 'lastContactedAt') {
    const v = formatDate(row.lastContactedAt)
    return <span className="text-[11px] text-slate-400">{v ?? '—'}</span>
  }
  return null
}

// ── Inline editors ────────────────────────────────────────────────────────

function InlineSelect({ value, options, onSave, onCancel }: {
  value: string | null
  options: Array<{ value: string; label: string }>
  onSave: (v: string | null) => void
  onCancel: () => void
}) {
  return (
    <select
      autoFocus
      defaultValue={value ?? ''}
      onChange={(e) => onSave(e.target.value || null)}
      onBlur={onCancel}
      className="w-full h-6 text-[11px] border border-gray-400 rounded bg-white outline-none cursor-pointer"
    >
      <option value="">—</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function InlineText({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) {
  const [draft, setDraft] = useState(value ?? '')
  const save = () => onSave(draft.trim() || null)
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') onSave(value)
  }
  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={onKey}
      className="w-full h-6 text-[11px] border border-gray-400 rounded bg-white px-1 outline-none"
    />
  )
}

function InlineStars({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) {
  const current = value ? Number(value) : 0
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onSave(n === current ? null : String(n))}
          className={`text-sm leading-none ${n <= current ? 'text-gray-600' : 'text-gray-200'} hover:text-gray-500`}
        >★</button>
      ))}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function ContactsTable({ contacts }: { contacts: ContactRow[] }) {
  const [rows, setRows] = useState(contacts)
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState<ViewKey>('all')
  const [roleFilter, setRoleFilter] = useState<'ALL' | RoleArchetype>('ALL')
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
  const [undoSync, setUndoSync] = useState<{ running: boolean; done: number; total: number; failedRows: UndoEntry['rows'] }>({ running: false, done: 0, total: 0, failedRows: [] })
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(DEFAULT_VISIBLE)
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_ORDER)
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(DEFAULT_WIDTHS)
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set())
  const [sortState, setSortState] = useState<SortState>(null)

  useEffect(() => { setRows(contacts) }, [contacts])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        visibleColumns?: Record<ColumnKey, boolean>
        columnOrder?: ColumnKey[]
        columnWidths?: Record<ColumnKey, number>
        groupBy?: GroupBy
        activeView?: ViewKey
        sortState?: SortState
      }
      if (parsed.visibleColumns) setVisibleColumns({ ...DEFAULT_VISIBLE, ...parsed.visibleColumns, name: true })
      if (parsed.columnOrder?.length) {
        const merged = [
          ...parsed.columnOrder.filter((k) => DEFAULT_ORDER.includes(k)),
          ...DEFAULT_ORDER.filter((k) => !parsed.columnOrder!.includes(k)),
        ]
        setColumnOrder(merged)
      }
      if (parsed.columnWidths) setColumnWidths({ ...DEFAULT_WIDTHS, ...parsed.columnWidths })
      if (parsed.groupBy)   setGroupBy(parsed.groupBy)
      if (parsed.activeView) setActiveView(parsed.activeView)
      if (parsed.sortState) setSortState(parsed.sortState)
    } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/table-views?table=contacts')
      .then((r) => r.json())
      .then((data) => setSavedViews(Array.isArray(data.views) ? data.views : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ visibleColumns: { ...visibleColumns, name: true }, columnOrder, columnWidths, groupBy, activeView, sortState }))
  }, [visibleColumns, columnOrder, columnWidths, groupBy, activeView, sortState])

  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.trim().toLowerCase()
    const displayName = c.fullName ?? c.name
    const displayCompany = c.companyName ?? c.company ?? ''
    const displayTitle = c.jobTitle ?? c.title ?? ''
    const hitSearch = !q || displayName.toLowerCase().includes(q) || displayCompany.toLowerCase().includes(q) || displayTitle.toLowerCase().includes(q)
    const hitRole = roleFilter === 'ALL' || c.roleArchetype === roleFilter
    const hitTemp = tempFilter === 'ALL' || c.temperature === tempFilter
    const daysSinceContact = c.lastContactedAt ? Math.floor((Date.now() - new Date(c.lastContactedAt).getTime()) / 86400000) : 999
    const hitView = activeView === 'all' ? true : activeView === 'followup' ? daysSinceContact >= 14 : c.temperature === 'HOT'
    return hitSearch && hitRole && hitTemp && hitView
  }), [rows, search, roleFilter, tempFilter, activeView])

  const sorted = useMemo(() => {
    if (!sortState) return filtered
    const next = [...filtered]
    next.sort((a, b) => {
      const left = getComparableValue(sortState.key, a)
      const right = getComparableValue(sortState.key, b)
      if (typeof left === 'number' && typeof right === 'number') {
        return sortState.direction === 'desc' ? right - left : left - right
      }
      return sortState.direction === 'desc'
        ? String(right).localeCompare(String(left), 'zh-CN')
        : String(left).localeCompare(String(right), 'zh-CN')
    })
    return next
  }, [filtered, sortState])

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'ALL', title: `全部联系人 (${sorted.length})`, rows: sorted }]
    const map = new Map<string, ContactRow[]>()
    for (const row of sorted) {
      const key = groupBy === 'roleArchetype' ? (row.roleArchetype ?? 'NONE') : groupBy === 'temperature' ? (row.temperature ?? 'NONE') : (row.company ?? 'NONE')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return Array.from(map.entries()).map(([key, rows]) => ({ key, title: `${groupTitle(groupBy, key)} (${rows.length})`, rows }))
  }, [sorted, groupBy])

  const shownColumns = columnOrder
    .map((key) => COLUMNS.find((c) => c.key === key))
    .filter((c): c is ColumnConfig => Boolean(c && (c.key === 'name' || visibleColumns[c.key])))

  const handleDropColumn = (from: ColumnKey, to: ColumnKey) => {
    if (from === to) return
    const next = [...columnOrder]
    const a = next.indexOf(from), b = next.indexOf(to)
    if (a < 0 || b < 0) return
    next.splice(a, 1)
    next.splice(b, 0, from)
    setColumnOrder(next)
  }

  const startResize = (key: ColumnKey, e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX, startW = columnWidths[key]
    const onMove = (ev: MouseEvent) => setColumnWidths((prev) => ({ ...prev, [key]: Math.max(70, Math.min(420, startW + ev.clientX - startX)) }))
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const toggleSelect = (id: string) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])
  const visibleIds = filtered.map((r) => r.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    else setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
  }

  // ── Inline cell save ──────────────────────────────────────────────────

  const saveCell = async (rowId: string, col: ColumnKey, value: string | null) => {
    const cellKey = `${rowId}-${col}`
    setEditingCell(null)

    const currentRow = rows.find((r) => r.id === rowId)
    if (!currentRow) return
    const currentValue = getCellValue(col, currentRow)
    if (value === currentValue) return // no change

    setSavingCells((prev) => new Set(prev).add(cellKey))
    setRows((prev) => prev.map((r) => r.id === rowId ? applyLocalUpdate(r, col, value) : r))

    try {
      const payload = buildPatchPayload(col, value)
      const res = await fetch(`/api/contacts/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      setRows((prev) => prev.map((r) => r.id === rowId ? currentRow : r))
      toast.error('保存失败')
    } finally {
      setSavingCells((prev) => { const s = new Set(prev); s.delete(cellKey); return s })
    }
  }

  const handleCellClick = (rowId: string, col: ColumnConfig) => {
    if (!col.editable) return
    setEditingCell({ rowId, field: col.key })
  }

  const toggleSort = (key: ColumnKey) => {
    setSortState((current) => {
      if (!current || current.key !== key) return { key, direction: 'desc' }
      if (current.direction === 'desc') return { key, direction: 'asc' }
      return null
    })
  }

  // ── Batch operations ──────────────────────────────────────────────────

  const applyBatch = async () => {
    if (selectedIds.length === 0) return
    setIsBatching(true)
    const snapshotRows = rows.filter((r) => selectedIds.includes(r.id)).map((r) => ({ id: r.id, temperature: r.temperature, roleArchetype: r.roleArchetype, trustLevel: r.trustLevel }))
    const undoId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setUndoStack((prev) => [{ id: undoId, rows: snapshotRows }, ...prev].slice(0, 3))
    try {
      await Promise.all(selectedIds.map((id) => {
        const payload = batchField === 'temperature' ? { temperature: batchValue } : batchField === 'roleArchetype' ? { roleArchetype: batchValue } : { trustLevel: Number(batchValue) }
        return fetch(`/api/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }))
      setRows((prev) => prev.map((row) => selectedIds.includes(row.id) ? {
        ...row,
        temperature: batchField === 'temperature' ? (batchValue as Temperature) : row.temperature,
        roleArchetype: batchField === 'roleArchetype' ? (batchValue as RoleArchetype) : row.roleArchetype,
        trustLevel: batchField === 'trustLevel' ? Number(batchValue) : row.trustLevel,
      } : row))
      toast.success('批量更新完成')
      setTimeout(() => setUndoStack((prev) => prev.filter((item) => item.id !== undoId)), 10000)
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
      const res = await fetch('/api/table-views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'contacts', name, config: { search, roleFilter, tempFilter, groupBy, activeView } }) })
      const data = await res.json()
      if (data.view) { setSavedViews((prev) => [data.view, ...prev.filter((v) => v.id !== data.view.id)]); toast.success('视图已保存') }
    } catch { toast.error('保存视图失败') }
  }

  const applySavedView = (view: SavedView) => {
    const cfg = (view.config ?? {}) as Record<string, string>
    setSearch(cfg.search ?? '')
    setRoleFilter((cfg.roleFilter as 'ALL' | RoleArchetype) ?? 'ALL')
    setTempFilter((cfg.tempFilter as 'ALL' | Temperature) ?? 'ALL')
    setGroupBy((cfg.groupBy as GroupBy) ?? 'none')
    setActiveView((cfg.activeView as ViewKey) ?? 'all')
  }

  const removeSavedView = async (id: string) => {
    try { await fetch(`/api/table-views?id=${id}`, { method: 'DELETE' }); setSavedViews((prev) => prev.filter((v) => v.id !== id)) }
    catch { toast.error('删除视图失败') }
  }

  const renameSavedView = async (id: string, currentName: string) => {
    const nextName = window.prompt('请输入新的视图名称', currentName)?.trim()
    if (!nextName || nextName === currentName) return
    try {
      await fetch('/api/table-views', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: nextName }) })
      setSavedViews((prev) => prev.map((v) => v.id === id ? { ...v, name: nextName } : v))
      toast.success('视图已重命名')
    } catch { toast.error('重命名失败') }
  }

  const undoBatch = async (id: string) => {
    const entry = undoStack.find((v) => v.id === id)
    if (!entry) return
    setRows((prev) => prev.map((row) => { const old = entry.rows.find((r) => r.id === row.id); return old ? { ...row, temperature: old.temperature, roleArchetype: old.roleArchetype, trustLevel: old.trustLevel } : row }))
    setUndoStack((prev) => prev.filter((v) => v.id !== id))

    setUndoSync({ running: true, done: 0, total: entry.rows.length, failedRows: [] })
    const failedRows: UndoEntry['rows'] = []
    for (let i = 0; i < entry.rows.length; i++) {
      const r = entry.rows[i]
      try {
        const resp = await fetch(`/api/contacts/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ temperature: r.temperature, roleArchetype: r.roleArchetype, trustLevel: r.trustLevel }) })
        if (!resp.ok) failedRows.push(r)
      } catch { failedRows.push(r) }
      setUndoSync((prev) => ({ ...prev, done: i + 1 }))
    }
    setUndoSync({ running: false, done: entry.rows.length, total: entry.rows.length, failedRows })
    if (failedRows.length > 0) toast.error(`服务端回滚失败 ${failedRows.length} 条`)
    else toast.success('已撤销并同步')
  }

  const retryUndoSync = async () => {
    if (undoSync.failedRows.length === 0 || undoSync.running) return
    const rowsToSync = undoSync.failedRows
    setUndoSync({ running: true, done: 0, total: rowsToSync.length, failedRows: [] })
    const failedRows: UndoEntry['rows'] = []
    for (let i = 0; i < rowsToSync.length; i++) {
      const r = rowsToSync[i]
      try {
        const resp = await fetch(`/api/contacts/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ temperature: r.temperature, roleArchetype: r.roleArchetype, trustLevel: r.trustLevel }) })
        if (!resp.ok) failedRows.push(r)
      } catch { failedRows.push(r) }
      setUndoSync((prev) => ({ ...prev, done: i + 1 }))
    }
    setUndoSync({ running: false, done: rowsToSync.length, total: rowsToSync.length, failedRows })
    if (failedRows.length > 0) toast.error(`仍有 ${failedRows.length} 条回滚失败`)
    else toast.success('重试成功')
  }

  const deleteOne = async (row: ContactRow) => {
    if (!window.confirm(`确认删除 ${row.fullName ?? row.name} 吗？`)) return
    const ok = await fetch(`/api/contacts/${row.id}`, { method: 'DELETE' })
    if (!ok.ok) { toast.error('删除失败'); return }
    setRows((prev) => prev.filter((r) => r.id !== row.id))
    setSelectedIds((prev) => prev.filter((id) => id !== row.id))
    setDeleteUndoStack((prev) => [{ id: `${Date.now()}-${row.id}`, row }, ...prev].slice(0, 5))
    toast.success('已删除，可撤销')
  }

  const undoDelete = async (entryId: string) => {
    const entry = deleteUndoStack.find((v) => v.id === entryId)
    if (!entry) return
    const payload = { fullName: entry.row.fullName ?? entry.row.name, companyName: entry.row.companyName ?? entry.row.company ?? '', roleArchetype: entry.row.roleArchetype ?? null, spiritAnimal: entry.row.spiritAnimal ?? null, industryL1: entry.row.industryL1 ?? null, industryL2: entry.row.industryL2 ?? null, jobTitle: entry.row.jobTitle ?? entry.row.title ?? null, jobPosition: entry.row.jobPosition ?? null, jobFunction: entry.row.jobFunction ?? null, chemistryScore: entry.row.chemistryScore ?? entry.row.trustLevel ?? null, temperature: entry.row.temperature ?? null, notes: entry.row.noteSummary ?? entry.row.notes ?? null }
    const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) { toast.error('撤销失败'); return }
    const data = await res.json().catch(() => null)
    if (data?.contact) setRows((prev) => [{ ...entry.row, id: data.contact.id, createdAt: data.contact.createdAt ?? entry.row.createdAt, updatedAt: data.contact.updatedAt ?? entry.row.updatedAt }, ...prev])
    setDeleteUndoStack((prev) => prev.filter((v) => v.id !== entryId))
    toast.success('已撤销删除')
  }

  const deleteAll = async () => {
    const token = window.prompt('请输入 alldelete 以确认删除全部联系人')
    if (token !== 'alldelete') { toast.error('口令不正确，已取消'); return }
    setIsDeletingAll(true)
    try {
      const all = [...rows]
      const res = await fetch('/api/contacts/clear-all', { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      setRows([]); setSelectedIds([])
      setDeleteUndoStack((prev) => [...all.map((row) => ({ id: `${Date.now()}-${row.id}`, row })), ...prev].slice(0, 5))
      toast.success('已全部删除')
    } catch { toast.error('全部删除失败') }
    finally { setIsDeletingAll(false) }
  }

  const deleteAllAiGenerated = async () => {
    const aiRows = rows.filter(isAiGeneratedContact)
    if (aiRows.length === 0) { toast.message('没有 AI 生成联系人'); return }
    setIsDeletingAi(true)
    try {
      await Promise.all(aiRows.map((row) => fetch(`/api/contacts/${row.id}`, { method: 'DELETE' })))
      setRows((prev) => prev.filter((row) => !isAiGeneratedContact(row)))
      setSelectedIds((prev) => prev.filter((id) => !aiRows.some((r) => r.id === id)))
      setDeleteUndoStack((prev) => [...aiRows.map((row) => ({ id: `${Date.now()}-${row.id}`, row })), ...prev].slice(0, 5))
      toast.success(`已删除 ${aiRows.length} 条 AI 联系人`)
    } catch { toast.error('删除 AI 联系人失败') }
    finally { setIsDeletingAi(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="bg-white">
      <div className="border-b border-gray-100 bg-[#fcfcfb] px-5 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/contacts/new"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            新建联系人
          </Link>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名、公司、职位"
            className="h-9 w-[220px] rounded-2xl border border-gray-200 bg-white px-3.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'ALL' | RoleArchetype)} className="h-9 rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100">
            <option value="ALL">全部角色</option>{Object.entries(ROLE_ARCHETYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l.name}</option>)}
          </select>
          <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value as 'ALL' | Temperature)} className="h-9 rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100">
            <option value="ALL">全部温度</option><option value="HOT">热</option><option value="WARM">温</option><option value="COLD">冷</option>
          </select>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="h-9 rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100">
            <option value="none">不分组</option><option value="roleArchetype">按角色分组</option><option value="temperature">按温度分组</option><option value="company">按公司分组</option>
          </select>
          <details className="relative">
            <summary className="flex h-9 cursor-pointer list-none items-center rounded-2xl border border-gray-200 bg-white px-3.5 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">自定义列</summary>
            <div className="absolute left-0 top-11 z-30 w-48 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-200/60">
              {COLUMNS.map((col) => (
                <label key={col.key} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={col.key === 'name' ? true : visibleColumns[col.key]}
                    disabled={col.key === 'name'}
                    onChange={() => setVisibleColumns((prev) => ({ ...prev, [col.key]: !prev[col.key] }))}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </details>
          <span className="ml-auto text-sm text-gray-400">{sorted.length} 条 · 除姓名外均可直接在表格内编辑</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(['all', 'followup', 'hot'] as ViewKey[]).map((v) => (
            <button key={v} onClick={() => setActiveView(v)} className={`rounded-full border px-3 py-1 text-xs transition ${activeView === v ? 'border-[#202020] bg-[#202020] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
              {v === 'all' ? '全部' : v === 'followup' ? '待跟进' : '高温'}
            </button>
          ))}
          <div className="h-4 w-px bg-gray-200" />
          <label className="flex items-center gap-1.5 text-xs text-gray-600"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />全选</label>
          <span className="text-xs text-gray-400">已选 {selectedIds.length}</span>
          <button onClick={deleteAll} disabled={isDeletingAll} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50">全部删除</button>
          <button onClick={deleteAllAiGenerated} disabled={isDeletingAi} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50">删 AI 生成</button>
          <button onClick={saveCurrentView} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:bg-gray-50">保存视图</button>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:bg-gray-50">已保存视图</summary>
            <div className="absolute left-0 top-9 z-30 w-60 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-200/60">
              {savedViews.length === 0 && <p className="px-2 py-1 text-xs text-gray-400">还没有保存的视图</p>}
              {savedViews.map((view) => (
                <div key={view.id} className="flex items-center gap-1">
                  <button onClick={() => applySavedView(view)} className="flex-1 rounded-xl px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50">{view.name}</button>
                  <button onClick={() => renameSavedView(view.id, view.name)} className="px-1.5 py-1 text-xs text-gray-500">改</button>
                  <button onClick={() => removeSavedView(view.id)} className="px-1.5 py-1 text-xs text-gray-500">删</button>
                </div>
              ))}
            </div>
          </details>
        </div>

        {batchPanelOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-[#fafaf9] p-3">
            <span className="text-xs font-medium text-gray-800">批量字段</span>
            <select value={batchField} onChange={(e) => { const f = e.target.value as BatchField; setBatchField(f); setBatchValue(f === 'temperature' ? 'HOT' : f === 'roleArchetype' ? 'BINDER' : '3') }} className="h-8 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700">
              <option value="temperature">温度</option><option value="roleArchetype">角色定位</option><option value="trustLevel">契合度</option>
            </select>
            {batchField === 'temperature' && <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700"><option value="HOT">热</option><option value="WARM">温</option><option value="COLD">冷</option></select>}
            {batchField === 'roleArchetype' && <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700">{Object.entries(ROLE_ARCHETYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l.name}</option>)}</select>}
            {batchField === 'trustLevel' && <select value={batchValue} onChange={(e) => setBatchValue(e.target.value)} className="h-8 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700"><option value="1">1星</option><option value="2">2星</option><option value="3">3星</option><option value="4">4星</option><option value="5">5星</option></select>}
            <button disabled={isBatching || selectedIds.length === 0} onClick={applyBatch} className="rounded-xl bg-[#202020] px-3 py-1.5 text-xs text-white disabled:opacity-40">应用到已选 {selectedIds.length} 条</button>
          </div>
        )}

        {undoStack.length > 0 && (
          <div className="mt-3 space-y-1 rounded-2xl border border-gray-200 bg-[#fafaf9] p-3">
            <p className="text-xs text-gray-700">可撤销最近批量编辑（10 秒内）</p>
            {undoStack.map((entry, idx) => (
              <div key={entry.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">操作 #{undoStack.length - idx}</span>
                <button onClick={() => undoBatch(entry.id)} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700">撤销</button>
              </div>
            ))}
          </div>
        )}

        {deleteUndoStack.length > 0 && (
          <div className="mt-3 space-y-1 rounded-2xl border border-gray-200 bg-[#fafaf9] p-3">
            <p className="text-xs text-gray-700">可撤销删除</p>
            {deleteUndoStack.map((entry, idx) => (
              <div key={entry.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-gray-600">#{deleteUndoStack.length - idx} · {entry.row.name}</span>
                <button onClick={() => undoDelete(entry.id)} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700">撤销删除</button>
              </div>
            ))}
          </div>
        )}

        {(undoSync.running || undoSync.total > 0) && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-[#fafaf9] p-3">
            <span className="text-xs text-gray-700">服务端回滚：{undoSync.done}/{undoSync.total}{undoSync.failedRows.length > 0 ? ` · 失败 ${undoSync.failedRows.length}` : ''}</span>
            {undoSync.failedRows.length > 0 && !undoSync.running && <button onClick={retryUndoSync} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700">重试</button>}
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-gray-400">暂无匹配联系人</div>
      ) : (
        <div className="overflow-x-auto">
          {grouped.map((group) => (
            <div key={group.key} className="border-t border-gray-100 first:border-t-0">
              <div className="sticky left-0 z-10 bg-[#fafaf9] px-5 py-2.5 text-xs font-semibold text-gray-500">{group.title}</div>
              <table className="w-full text-xs" style={{ minWidth: shownColumns.reduce((n, c) => n + columnWidths[c.key], 0) + 56 }}>
                <thead>
                  <tr className="bg-white">
                    <th className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 backdrop-blur" style={{ width: 40, minWidth: 40 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    {shownColumns.map((col) => (
                      <th
                        key={col.key}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/col', col.key)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropColumn(e.dataTransfer.getData('text/col') as ColumnKey, col.key)}
                        className="sticky top-0 z-20 relative border-b border-gray-100 bg-white/95 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 backdrop-blur"
                        style={{ width: columnWidths[col.key], minWidth: columnWidths[col.key] }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>
                            {col.label}
                            {col.key === 'name' ? (
                              <span className="ml-1 text-[10px] normal-case italic tracking-normal text-gray-400">
                                （*为AI生成的测试人）
                              </span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              toggleSort(col.key)
                            }}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-gray-100"
                            aria-label={`按${col.label}排序`}
                          >
                            <SortIcon state={sortState?.key === col.key ? sortState : null} />
                          </button>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize" onMouseDown={(e) => startResize(col.key, e)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.id} className="group/row transition hover:bg-[#fbfbfa]">
                      <td className="border-b border-gray-100 px-3 py-3 align-top">
                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                      </td>
                      {shownColumns.map((col) => {
                        const isEditing = editingCell?.rowId === row.id && editingCell?.field === col.key
                        const cellKey = `${row.id}-${col.key}`
                        const isSaving = savingCells.has(cellKey)
                        const currentValue = getCellValue(col.key, row)

                        return (
                          <td
                            key={col.key}
                            className={`border-b border-gray-100 px-3 py-3 align-top ${col.editable && !isEditing ? 'cursor-pointer' : ''} ${isSaving ? 'opacity-60' : ''}`}
                            style={{ maxWidth: columnWidths[col.key] }}
                            onClick={() => !isEditing && handleCellClick(row.id, col)}
                          >
                            {isEditing ? (
                              col.editType === 'select' ? (
                                <InlineSelect
                                  value={currentValue}
                                  options={selectOptionsForColumn(col.key, row)}
                                  onSave={(v) => saveCell(row.id, col.key, v)}
                                  onCancel={() => setEditingCell(null)}
                                />
                              ) : col.editType === 'stars' ? (
                                <InlineStars
                                  value={currentValue}
                                  onSave={(v) => saveCell(row.id, col.key, v)}
                                />
                              ) : (
                                <InlineText
                                  value={currentValue}
                                  onSave={(v) => saveCell(row.id, col.key, v)}
                                />
                              )
                            ) : col.key === 'name' ? (
                              <div className="relative min-w-0 pl-7">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    void deleteOne(row)
                                  }}
                                  className="absolute left-0 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover/row:opacity-100"
                                  aria-label={`删除${row.fullName ?? row.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <CellDisplay col={col.key} row={row} />
                              </div>
                            ) : (
                              <CellDisplay col={col.key} row={row} />
                            )}
                          </td>
                        )
                      })}
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
