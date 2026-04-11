'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useLoading } from '@/components/ThinkingToast'
import PageHeader from '@/components/PageHeader'
import PeopleUniverseView from './PeopleUniverseView'
import { NetworkContact, NetworkRelation } from './JourneyGraph'

function strengthScore(strength?: 'STRONG' | 'MEDIUM' | 'WEAK'): number {
  return strength === 'STRONG' ? 3 : strength === 'MEDIUM' ? 2 : 1
}

const STRENGTH_CONFIG = {
  STRONG: {
    label: '强连接',
    barWidth: '100%',
    barClassName: 'bg-gray-900',
    textClassName: 'text-gray-800',
  },
  MEDIUM: {
    label: '中连接',
    barWidth: '64%',
    barClassName: 'bg-gray-500',
    textClassName: 'text-gray-500',
  },
  WEAK: {
    label: '弱连接',
    barWidth: '30%',
    barClassName: 'bg-gray-300',
    textClassName: 'text-gray-400',
  },
} as const

const WARMTH_DOT: Record<string, string> = {
  HOT: 'bg-red-400',
  WARM: 'bg-[#A04F47]',
  COLD: 'bg-blue-400',
  _: 'bg-gray-300',
}

function roleZh(role: string): string {
  const map: Record<string, string> = {
    BIG_INVESTOR: '大金主',
    GATEWAY: '传送门',
    ADVISOR: '智囊',
    THERMOMETER: '温度计',
    LIGHTHOUSE: '灯塔',
    COMRADE: '战友',
    BREAKER: '破局者',
    EVANGELIST: '布道者',
    ANALYST: '分析师',
    BINDER: '粘合剂',
  }
  return map[role] || role || '未分类'
}

function tempLabel(temperature: string | null): string {
  if (temperature === 'HOT') return '热'
  if (temperature === 'WARM') return '暖'
  if (temperature === 'COLD') return '冷'
  return '中'
}

interface RelatedContact {
  contact: NetworkContact
  strength: 'STRONG' | 'MEDIUM' | 'WEAK'
  score: number
  relationDesc: string | null
}

function getRelated(
  selectedId: string,
  contacts: NetworkContact[],
  relations: NetworkRelation[],
  max = 5
): RelatedContact[] {
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]))

  return relations
    .filter((relation) => relation.contactIdA === selectedId || relation.contactIdB === selectedId)
    .map((relation) => {
      const otherId = relation.contactIdA === selectedId ? relation.contactIdB : relation.contactIdA
      const other = contactMap.get(otherId)
      if (!other) return null

      const strength = (relation.strength ?? 'WEAK') as 'STRONG' | 'MEDIUM' | 'WEAK'
      return {
        contact: other,
        strength,
        score: strengthScore(strength) * 10 + other.energyScore / 10,
        relationDesc: relation.relationDesc,
      }
    })
    .filter((item): item is RelatedContact => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
}

function ContactDetailCard({ contact }: { contact: NetworkContact }) {
  const tags = Array.isArray(contact.tags) ? (contact.tags as string[]) : []
  const warmthDotClassName = WARMTH_DOT[contact.temperature ?? '_'] ?? WARMTH_DOT._

  return (
    <section className="rounded-[20px] border border-gray-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-gray-900">{contact.name}</h3>
          <p className="mt-1 truncate text-xs text-gray-500">
            {[contact.title, contact.company].filter(Boolean).join(' · ') || '\u6682\u65e0\u804c\u4f4d\u6216\u516c\u53f8\u4fe1\u606f'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
            {'\u80fd\u91cf'} {contact.energyScore}
          </span>
          <div className="group/edit relative">
            <Link
              href={`/contacts/${contact.id}/edit`}
              aria-label={'\u524d\u5f80\u4eba\u8109\u7f16\u8f91\u9875'}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition hover:border-gray-300 hover:text-gray-700"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M9.9 2.1a1.4 1.4 0 1 1 2 2L5.3 10.7 3 11l.3-2.3L9.9 2.1Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path d="M8.7 3.3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </Link>
            <div className="pointer-events-none absolute right-0 top-full mt-1.5 min-w-[72px] whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 py-1 text-center text-[10px] text-gray-500 opacity-0 shadow-sm transition group-hover/edit:opacity-100">
              {'\u524d\u5f80\u7f16\u8f91'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
          {roleZh(contact.roleArchetype || '')}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500">
          <span className={`h-2 w-2 rounded-full ${warmthDotClassName}`} />
          {'\u6e29\u5ea6'} {tempLabel(contact.temperature)}
        </span>
        {contact.trustLevel ? (
          <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500">
            {'\u4fe1\u4efb'} {contact.trustLevel}/5
          </span>
        ) : null}
        {tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {contact.notes ? (
        <div className="mt-2.5 rounded-2xl border border-gray-200 bg-[#fafaf9] px-3 py-2">
          <p className="line-clamp-2 text-xs leading-5 text-gray-500">{contact.notes}</p>
        </div>
      ) : null}
    </section>
  )
}

function RelatedContactCard({
  item,
  onFocus,
}: {
  item: RelatedContact
  onFocus: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const config = STRENGTH_CONFIG[item.strength]
  const tags = Array.isArray(item.contact.tags) ? (item.contact.tags as string[]) : []

  return (
    <div className="rounded-[22px] border border-gray-200 bg-white">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setExpanded((current) => !current)
          }
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-gray-50"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
          {item.contact.name.slice(0, 1)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900">{item.contact.name}</p>
            <span className={`text-[11px] ${config.textClassName}`}>{config.label}</span>
          </div>
          <p className="mt-1 truncate text-xs text-gray-500">
            {[item.contact.title, item.contact.company].filter(Boolean).join(' · ') ||
              roleZh(item.contact.roleArchetype || '')}
          </p>
        </div>

        <div className="hidden shrink-0 sm:block">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${config.barClassName}`} style={{ width: config.barWidth }} />
          </div>
          <p className="mt-1 text-right text-[10px] text-gray-400">{item.contact.energyScore} energy</p>
        </div>

        <button
          type="button"
          title="在宇宙中定位"
          onClick={(event) => {
            event.stopPropagation()
            onFocus(item.contact.id)
          }}
          className="rounded-full border border-gray-200 p-2 text-gray-400 transition hover:border-gray-300 hover:text-gray-700"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="1.8" fill="currentColor" />
            <path d="M7 1v2.2M7 10.8V13M1 7h2.2M10.8 7H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-3.5 py-3">
              <div className="rounded-[18px] border border-gray-200 bg-[#fcfcfb] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-gray-900">{item.contact.name}</h4>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {[item.contact.title, item.contact.company].filter(Boolean).join(' · ') || '\u6682\u65e0\u804c\u4f4d\u6216\u516c\u53f8\u4fe1\u606f'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                    {'\u80fd\u91cf'} {item.contact.energyScore}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                    {roleZh(item.contact.roleArchetype || '')}
                  </span>
                  <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500">
                    {config.label}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500">
                    <span className={`h-2 w-2 rounded-full ${WARMTH_DOT[item.contact.temperature ?? '_'] ?? WARMTH_DOT._}`} />
                    {'\u6e29\u5ea6'} {tempLabel(item.contact.temperature)}
                  </span>
                  {item.contact.trustLevel ? (
                    <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500">
                      {'\u4fe1\u4efb'} {item.contact.trustLevel}/5
                    </span>
                  ) : null}
                  {tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {item.relationDesc || item.contact.notes ? (
                  <div className="mt-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2">
                    <p className="line-clamp-2 text-xs leading-5 text-gray-500">
                      {item.relationDesc || item.contact.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function SearchResults({
  results,
  onSelect,
}: {
  results: NetworkContact[]
  onSelect: (contact: NetworkContact) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60"
    >
      {results.map((contact) => (
        <div
          key={contact.id}
          className="group relative border-b border-gray-100 px-3 py-3 transition hover:bg-gray-50 last:border-b-0"
        >
          <button
            type="button"
            onClick={() => onSelect(contact)}
            className="block w-full pr-12 text-left"
          >
            <p className="truncate text-sm font-semibold text-gray-900">{contact.name}</p>
            <p className="mt-1 truncate text-xs text-gray-500">
              {[contact.title, contact.company].filter(Boolean).join(' · ') || '\u6682\u65e0\u804c\u4f4d\u6216\u516c\u53f8\u4fe1\u606f'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                {'\u80fd\u91cf'} {contact.energyScore}
              </span>
              <span className="rounded-full border border-gray-200 px-2.5 py-1">
                {'\u6e29\u5ea6'} {tempLabel(contact.temperature)}
              </span>
              <span className="rounded-full border border-gray-200 px-2.5 py-1">
                {roleZh(contact.roleArchetype || '')}
              </span>
            </div>
          </button>

          <div className="absolute bottom-3 right-3">
            <div className="group/edit relative">
              <Link
                href={`/contacts/${contact.id}/edit`}
                onClick={(event) => event.stopPropagation()}
                aria-label={'\u524d\u5f80\u4eba\u8109\u7f16\u8f91\u9875'}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition hover:border-gray-300 hover:text-gray-700"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M9.9 2.1a1.4 1.4 0 1 1 2 2L5.3 10.7 3 11l.3-2.3L9.9 2.1Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path d="M8.7 3.3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </Link>
              <div className="pointer-events-none absolute bottom-10 right-0 rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition group-hover/edit:opacity-100">
                {'\u524d\u5f80\u7f16\u8f91'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

function UniversePanelContent({
  searchQuery,
  setSearchQuery,
  searchResults,
  showDropdown,
  setShowDropdown,
  selectedContact,
  relatedContacts,
  onSelectContact,
  onClearSearch,
  onFocusContact,
}: {
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  searchResults: NetworkContact[]
  showDropdown: boolean
  setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>
  selectedContact: NetworkContact | null
  relatedContacts: RelatedContact[]
  onSelectContact: (contact: NetworkContact) => void
  onClearSearch: () => void
  onFocusContact: (id: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative w-full lg:max-w-[248px] xl:max-w-[236px]">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={searchQuery}
            placeholder={'\u641c\u7d22\u4eba\u8109\u59d3\u540d'}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true)
            }}
            onChange={(event) => {
              const value = event.target.value
              setSearchQuery(value)
              setShowDropdown(value.trim().length > 0)
            }}
            className="h-10 w-full rounded-2xl border border-gray-200 bg-[#fafaf9] pl-10 pr-10 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onClearSearch()
                inputRef.current?.focus()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}

          <AnimatePresence>
            {showDropdown && searchResults.length > 0 ? (
              <SearchResults
                results={searchResults}
                onSelect={(contact) => {
                  onSelectContact(contact)
                  setShowDropdown(false)
                }}
              />
            ) : null}
          </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedContact ? (
            <motion.div
              key={selectedContact.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <ContactDetailCard contact={selectedContact} />

              <section className="rounded-[20px] border border-gray-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-900">{'\u5173\u8054\u4eba\u8109'}</h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                    {relatedContacts.length} {'\u4eba'}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {relatedContacts.length > 0 ? (
                    relatedContacts.map((item) => (
                      <RelatedContactCard key={item.contact.id} item={item} onFocus={onFocusContact} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafaf9] px-4 py-8 text-center">
                      <p className="text-sm font-medium text-gray-700">暂时没有关联记录</p>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        仓库里还没有这位联系人对应的关系链数据。
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-[24px] border border-dashed border-gray-200 bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M15.2 15.2L20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">先选择一个联系人</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                你可以直接点击宇宙中的节点，也可以通过上方搜索快速定位联系人。
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function JourneyPage() {
  const { showLoading, hideLoading } = useLoading()

  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [relations, setRelations] = useState<NetworkRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<NetworkContact | null>(null)
  const [focusContactId, setFocusContactId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    showLoading()

    fetch('/api/network')
      .then((response) => response.json())
      .then((data) => {
        setContacts(data.contacts || [])
        setRelations(data.relations || [])
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false)
        hideLoading()
      })
  }, [hideLoading, showLoading])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()

    return contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          (contact.company || '').toLowerCase().includes(query)
      )
      .slice(0, 5)
  }, [contacts, searchQuery])

  const relatedContacts = useMemo(() => {
    if (!selectedContact) return []
    return getRelated(selectedContact.id, contacts, relations, 5)
  }, [contacts, relations, selectedContact])

  function handleSelectContact(contact: NetworkContact) {
    setSelectedContact(contact)
    setFocusContactId(contact.id)
    setSearchQuery(contact.name)
    setShowDropdown(false)
    setSidebarOpen(true)
  }

  function handleClearSearch() {
    setSearchQuery('')
    setSelectedContact(null)
    setFocusContactId(null)
    setShowDropdown(false)
  }

  function renderUniverseState() {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-16 w-16 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
            <p className="text-sm font-medium text-gray-700">正在加载人脉宇宙</p>
            <p className="mt-1 text-xs text-gray-500">读取联系人与关系链数据中</p>
          </div>
        </div>
      )
    }

    if (contacts.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white px-8 py-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="16.5" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M3.8 18.2c1.1-2.6 3.2-3.9 6.2-3.9 3 0 5.1 1.3 6.2 3.9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">还没有联系人数据</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              先去联系人库添加数据，宇宙视图才会生成节点与关系网络。
            </p>
          </div>
        </div>
      )
    }

    return (
      <PeopleUniverseView
        contacts={contacts}
        relations={relations}
        focusContactId={focusContactId}
        onNodeClick={(id) => {
          const contact = contacts.find((item) => item.id === id)
          if (contact) handleSelectContact(contact)
        }}
      />
    )
  }

  return (
    <div className="min-h-full bg-[#f6f6f4] lg:h-[100dvh] lg:overflow-hidden">
      <div className="flex min-h-screen w-full min-w-0 flex-col px-4 py-3 sm:px-5 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden lg:px-6 lg:py-3 xl:px-8">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '人脉宇宙' },
          ]}
          title="人脉宇宙"
          titleNote={<span className="text-sm italic text-gray-500">Xminer 智能社交关系网络图</span>}
          className="pb-3 lg:pb-3"
          hints={[
            '点击宇宙中的节点，可查看联系人详情和关联人脉。',
            '用右侧搜索快速定位联系人，并同步把宇宙焦点移动过去。',
            '关联列表仍按连接强度和能量综合排序。',
          ]}
        />

        <div className="mt-1 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_312px] xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_336px]">
          <section className="min-h-0 min-w-0">
            <div className="h-full min-h-[420px] overflow-hidden rounded-[28px] border border-gray-200 bg-[#f8f8f6] p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:min-h-0">
              <div className="h-full min-h-0 overflow-hidden rounded-[24px] border border-gray-200 bg-transparent">
                <div className="relative h-full min-h-[420px] lg:min-h-0">{renderUniverseState()}</div>
              </div>
            </div>
          </section>

          <div className="hidden min-h-0 lg:block">
            <div
              className={`h-full min-h-[420px] overflow-hidden rounded-[28px] border border-gray-200 bg-[#f8f8f6] p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 lg:min-h-0 ${
                sidebarOpen ? 'opacity-100' : 'opacity-100'
              }`}
            >
              {sidebarOpen ? (
                <UniversePanelContent
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                  showDropdown={showDropdown}
                  setShowDropdown={setShowDropdown}
                  selectedContact={selectedContact}
                  relatedContacts={relatedContacts}
                  onSelectContact={handleSelectContact}
                  onClearSearch={handleClearSearch}
                  onFocusContact={(id) => {
                    setFocusContactId(id)
                    const contact = contacts.find((item) => item.id === id)
                    if (contact) handleSelectContact(contact)
                  }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-between rounded-[28px] border border-gray-200 bg-white px-4 py-5 text-center">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-800"
                    title="展开详情面板"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M6 4L11 9L6 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">panel</p>
                    <p className="mt-3 text-sm font-medium text-gray-800">
                      {selectedContact ? selectedContact.name : '节点详情'}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">展开后可搜索联系人并查看关联人脉。</p>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-3 py-2 text-xs text-gray-500">
                      搜索
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-3 py-2 text-xs text-gray-500">
                      详情
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-3 py-2 text-xs text-gray-500">
                      关联
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 lg:hidden">
          <UniversePanelContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            selectedContact={selectedContact}
            relatedContacts={relatedContacts}
            onSelectContact={handleSelectContact}
            onClearSearch={handleClearSearch}
            onFocusContact={(id) => {
              setFocusContactId(id)
              const contact = contacts.find((item) => item.id === id)
              if (contact) handleSelectContact(contact)
            }}
          />
        </div>
      </div>
    </div>
  )
}
