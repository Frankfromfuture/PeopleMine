'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  Check,
  CircleDot,
  Compass,
  Handshake,
  Heart,
  Mars,
  MessageCircle,
  Sparkles,
  Users,
  Venus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import type {
  CompanyScaleNew,
  Gender,
  InfluenceLevel,
  JobFunction,
  JobPosition,
  NetworkingNeed,
  PersonalRelation,
  RoleArchetype,
  SpiritAnimalNew,
  ValueLevel,
} from '@/types'

type InitialContact = {
  id?: string
  name?: string | null
  fullName?: string | null
  gender?: Gender | null
  age?: number | null
  firstMetYear?: number | null
  personalRelation?: PersonalRelation | null
  reciprocityLevel?: number | null
  city?: string | null
  friendLinks?: string[]
  company?: string | null
  companyName?: string | null
  companyProfile?: string | null
  companyScale?: CompanyScaleNew | null
  industry?: string | null
  industryL1?: string | null
  industryL2?: string | null
  title?: string | null
  jobTitle?: string | null
  jobPosition?: JobPosition | null
  jobFunction?: JobFunction | null
  influence?: InfluenceLevel | null
  networkingNeeds?: NetworkingNeed[]
  spiritAnimal?: SpiritAnimalNew | null
  roleArchetype?: RoleArchetype | null
  chemistryScore?: number | null
  valueScore?: ValueLevel | null
  potentialProjects?: string | null
  socialPosition?: string | null
  hobbies?: string | null
  personalNotes?: string | null
  notes?: string | null
  wechat?: string | null
  phone?: string | null
  email?: string | null
  companyAddress?: string | null
  personalAddress?: string | null
}

type StageId = 'flash' | 'depth' | 'portrait'

const STAGES: Array<{
  id: StageId
  kicker: string
  label: string
}> = [
  {
    id: 'flash',
    kicker: '7秒',
    label: '印象',
  },
  {
    id: 'depth',
    kicker: '15秒',
    label: '链接',
  },
  {
    id: 'portrait',
    kicker: '30秒',
    label: '画像',
  },
]

const fieldClass =
  'h-10 w-full rounded-2xl border border-black/10 bg-white/94 px-3.5 text-sm text-[#161514] outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100'
const textareaClass =
  'w-full rounded-2xl border border-black/10 bg-white/94 px-3.5 py-3 text-sm text-[#161514] outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-100 resize-none'

const GENDER_OPTIONS: Array<{ value: Gender; label: string; icon: LucideIcon }> = [
  { value: 'MALE', label: '男', icon: Mars },
  { value: 'FEMALE', label: '女', icon: Venus },
]
const PERSONAL_RELATION_OPTIONS: Array<{ value: PersonalRelation; label: string; icon: LucideIcon }> = [
  { value: 'INTIMATE', label: '亲密', icon: Heart },
  { value: 'FAMILIAR', label: '熟悉', icon: Users },
  { value: 'NORMAL', label: '普通', icon: CircleDot },
  { value: 'ACQUAINTANCE', label: '点头之交', icon: Handshake },
]
const NETWORKING_OPTIONS: Array<{ value: NetworkingNeed; label: string; icon: LucideIcon; matches?: NetworkingNeed[] }> = [
  { value: 'BUSINESS_EXPANSION', label: '业务合作', icon: Briefcase },
  { value: 'INTRODUCTIONS', label: '朋友引荐', icon: Handshake, matches: ['INTRODUCTIONS', 'FRIENDSHIP'] },
  { value: 'SOCIAL', label: '偶然拓展', icon: Compass },
  { value: 'CASUAL_CHAT', label: '轻松闲聊', icon: MessageCircle },
]
const VALUE_OPTIONS: Array<{ value: ValueLevel; label: string }> = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'EXTREME', label: '极高' },
]
const RECIPROCITY_OPTIONS = [
  { value: '2', label: '+2', tip: '他更需要我' },
  { value: '1', label: '+1', tip: '我略占优势' },
  { value: '0', label: '0', tip: '互相平衡' },
  { value: '-1', label: '-1', tip: '我略欠对方' },
  { value: '-2', label: '-2', tip: '我更需要他' },
]
const COMPANY_SCALE_OPTIONS: Array<{ value: CompanyScaleNew; label: string }> = [
  { value: 'MILLION', label: '百万级' },
  { value: 'TEN_MILLION', label: '千万级' },
  { value: 'HUNDRED_MILLION', label: '亿级' },
  { value: 'BILLION', label: '十亿级' },
  { value: 'TEN_BILLION', label: '百亿级' },
]
const JOB_POSITION_OPTIONS: Array<{ value: JobPosition; label: string }> = [
  { value: 'FOUNDER', label: '创始人' },
  { value: 'PARTNER', label: '合伙人' },
  { value: 'GENERAL_MANAGER', label: '总经理' },
  { value: 'VP', label: 'VP / 副总' },
  { value: 'DIRECTOR', label: '总监' },
  { value: 'MANAGER', label: '经理' },
  { value: 'OTHER', label: '其他' },
]
const JOB_FUNCTION_OPTIONS: Array<{ value: JobFunction; label: string }> = [
  { value: 'MANAGEMENT', label: '管理' },
  { value: 'INVESTMENT', label: '投资' },
  { value: 'SALES', label: '销售' },
  { value: 'ENGINEER', label: '工程 / 技术' },
  { value: 'MARKETING', label: '市场' },
  { value: 'BUSINESS_DEV', label: '商务拓展' },
  { value: 'ADMIN', label: '行政' },
  { value: 'OTHER', label: '其他' },
]
const INFLUENCE_OPTIONS: Array<{ value: InfluenceLevel; label: string }> = [
  { value: 'LOW', label: '低影响力' },
  { value: 'MEDIUM', label: '中影响力' },
  { value: 'HIGH', label: '高影响力' },
]
const ROLE_OPTIONS: Array<{ value: RoleArchetype; label: string; desc: string }> = [
  { value: 'BREAKER', label: '破局者', desc: '能打开局面，适合带来关键突破。' },
  { value: 'EVANGELIST', label: '布道者', desc: '擅长连接和引荐，适合做中转桥梁。' },
  { value: 'ANALYST', label: '分析师', desc: '偏理性判断，适合提供洞察和决策支持。' },
  { value: 'BINDER', label: '粘合剂', desc: '稳定可靠，适合长期协作和关系维护。' },
]
const ANIMAL_OPTIONS: Array<{ value: SpiritAnimalNew; label: string; emoji: string; desc: string }> = [
  { value: 'TIGER', label: '老虎', emoji: '虎', desc: '强势果断，推进快。' },
  { value: 'PEACOCK', label: '孔雀', emoji: '雀', desc: '表达强，感染力高。' },
  { value: 'OWL', label: '猫头鹰', emoji: '鹰', desc: '理性冷静，擅长洞察。' },
  { value: 'KOALA', label: '考拉', emoji: '熊', desc: '稳定可靠，信任感强。' },
]
const INDUSTRY_CATALOG: Record<string, string[]> = {
  科技互联网: ['人工智能', 'SaaS', '数据平台', '电商', '内容社区'],
  金融投资: ['一级市场', '二级市场', '财富管理', '支付科技'],
  医疗健康: ['医院体系', '医疗器械', '生物科技', '互联网医疗'],
  消费品牌: ['零售渠道', '消费品', '餐饮品牌', '生活方式'],
  制造能源: ['先进制造', '汽车产业', '新能源', '供应链'],
  教育服务: ['职业教育', '留学服务', '企业培训', '知识服务'],
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 block text-[12px] font-medium text-[#5F5952]">
      <span>{children}</span>
      {hint ? <span className="ml-2 text-[#9A9289]">{hint}</span> : null}
    </label>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`.trim()} />
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${textareaClass} ${props.className ?? ''}`.trim()} />
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ''}`.trim()} />
}

function ChipGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 'grid-cols-2',
}: {
  value: T | ''
  options: Array<{ value: T; label: string; tip?: string }>
  onChange: (value: T) => void
  columns?: string
}) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[18px] border px-3 py-3 text-left transition ${
              active
                ? 'border-gray-900 bg-gray-900 text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]'
                : 'border-black/10 bg-white/88 text-[#1D1A17] hover:border-black/20 hover:bg-white'
            }`}
          >
            <div className="text-sm font-medium">{option.label}</div>
            {option.tip ? (
              <div className={`mt-1 text-[11px] leading-5 ${active ? 'text-white/78' : 'text-[#7F786F]'}`}>
                {option.tip}
              </div>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function IconChoiceGrid<T extends string>({
  value,
  options,
  onChange,
  columns = 'grid-cols-2',
}: {
  value: T | ''
  options: Array<{ value: T; label: string; icon: LucideIcon; matches?: T[] }>
  onChange: (value: T) => void
  columns?: string
}) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map((option) => {
        const Icon = option.icon
        const active = value === option.value || option.matches?.includes(value as T)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] border px-2.5 py-2 text-center transition ${
              active
                ? 'border-gray-900 bg-gray-900 text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]'
                : 'border-black/10 bg-white/92 text-[#1D1A17] hover:border-black/20 hover:bg-white'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${
                active
                  ? 'border-white/15 bg-white/10 text-white'
                  : 'border-black/8 bg-gray-50 text-[#4E4740]'
              }`}
            >
              <Icon className="h-[14px] w-[14px]" />
            </span>
            <span className="text-xs font-medium leading-4">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function MiniPills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | ''
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-black/10 bg-white/90 text-[#4F4841] hover:border-black/20'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function GenderIconPills({
  value,
  options,
  onChange,
}: {
  value: Gender | ''
  options: Array<{ value: Gender; label: string; icon: LucideIcon }>
  onChange: (value: Gender) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const Icon = option.icon
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
              active
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-black/10 bg-white/92 text-[#4F4841] hover:border-black/20 hover:bg-white'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function DetailDisclosure({
  title,
  summary,
  children,
}: {
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <details className="rounded-[22px] border border-black/8 bg-white/70 p-4 open:bg-white/92">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#1B1714]">{title}</p>
            {summary ? <p className="mt-1 text-xs leading-5 text-[#80786F]">{summary}</p> : null}
          </div>
          <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
            补充
          </span>
        </div>
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  )
}

function FriendPicker({
  allContacts,
  selectedFriends,
  setSelectedFriends,
}: {
  allContacts: Array<{ id: string; name: string }>
  selectedFriends: Array<{ id: string; name: string }>
  setSelectedFriends: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string }>>>
}) {
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const deferredKeyword = useDeferredValue(keyword)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current && !panelRef.current.contains(target) && inputRef.current && !inputRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const filteredContacts = useMemo(
    () =>
      allContacts.filter(
        (contact) =>
          !selectedFriends.some((item) => item.id === contact.id) &&
          contact.name.toLowerCase().includes(deferredKeyword.toLowerCase())
      ),
    [allContacts, deferredKeyword, selectedFriends]
  )

  return (
    <div>
      <FieldLabel hint="可选">朋友链接</FieldLabel>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onFocus={() => setOpen(true)}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索已存在联系人，建立人脉关联"
          className={fieldClass}
        />
        {open && filteredContacts.length > 0 ? (
          <div
            ref={panelRef}
            className="absolute left-0 top-full z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-[20px] border border-black/10 bg-white p-2 shadow-[0_20px_40px_rgba(24,20,16,0.12)]"
          >
            {filteredContacts.slice(0, 8).map((contact) => (
              <button
                key={contact.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  setSelectedFriends((current) => [...current, contact])
                  setKeyword('')
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm text-[#413B34] transition hover:bg-gray-50"
              >
                <span>{contact.name}</span>
                <span className="text-[11px] text-[#9A9289]">加入</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {selectedFriends.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedFriends.map((friend) => (
            <span
              key={friend.id}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-[#5E5750]"
            >
              {friend.name}
              <button
                type="button"
                onClick={() => setSelectedFriends((current) => current.filter((item) => item.id !== friend.id))}
                className="text-[#9A9289] transition hover:text-[#4B453E]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function IndustrySelect({
  industryL1,
  setIndustryL1,
  industryL2,
  setIndustryL2,
}: {
  industryL1: string
  setIndustryL1: (value: string) => void
  industryL2: string
  setIndustryL2: (value: string) => void
}) {
  const secondLevelOptions = INDUSTRY_CATALOG[industryL1] ?? []

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <FieldLabel>一级行业</FieldLabel>
        <SelectInput
          value={industryL1}
          onChange={(event) => {
            setIndustryL1(event.target.value)
            setIndustryL2('')
          }}
        >
          <option value="">请选择</option>
          {Object.keys(INDUSTRY_CATALOG).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectInput>
      </div>
      <div>
        <FieldLabel hint="可选">二级方向</FieldLabel>
        <SelectInput value={industryL2} onChange={(event) => setIndustryL2(event.target.value)}>
          <option value="">请选择</option>
          {secondLevelOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectInput>
      </div>
    </div>
  )
}

function StageCard({
  stage,
  index,
  active,
  unlocked,
  completed,
  onActivate,
  children,
}: {
  stage: (typeof STAGES)[number]
  index: number
  active: boolean
  unlocked: boolean
  completed: boolean
  onActivate: () => void
  children?: React.ReactNode
}) {
  const compactLocked = index > 0 && !unlocked
  return (
    <motion.section
      layout
      initial={false}
      animate={{
        opacity: unlocked ? 1 : 0.7,
        y: compactLocked ? 0 : unlocked ? 0 : 18,
        rotateY: unlocked ? (active ? 0 : index === 0 ? -4 : index === 1 ? -1.5 : 3) : -12 + index * 3,
        scale: compactLocked ? 0.965 : unlocked ? (active ? 1 : 0.985) : 0.95,
      }}
      transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
      className={`group relative overflow-hidden rounded-[30px] border backdrop-blur-md ${
        unlocked
          ? active
            ? 'border-2 border-black bg-[#f3f3f1] shadow-[0_28px_70px_rgba(15,23,42,0.10)]'
            : 'border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(246,246,244,0.86))] shadow-[0_18px_42px_rgba(15,23,42,0.06)]'
          : 'border-dashed border-black/10 bg-[linear-gradient(180deg,rgba(243,243,241,0.72),rgba(236,236,233,0.48))] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'
      } ${unlocked ? 'cursor-pointer' : ''} ${compactLocked ? 'self-end min-h-[50vh]' : 'min-h-[220px]'}`}
      style={{ transformStyle: 'preserve-3d' }}
      onClick={() => {
        if (unlocked) onActivate()
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          compactLocked
            ? 'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.78),transparent_40%)]'
            : 'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(20,20,20,0.05),transparent_32%)]'
        }`}
      />
      {compactLocked ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(180deg,rgba(246,246,244,0),rgba(246,246,244,0.92)_58%,rgba(246,246,244,1)_100%)]" />
      ) : null}
      <div className="relative flex h-full min-h-0 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-[19px] font-semibold tracking-[0.02em] ${
              active ? 'border border-black bg-black text-white' : 'border border-black/8 bg-white/80 text-[#6B645D]'
            }`}
          >
            <span>{`${stage.kicker}卡 · ${stage.label}`}</span>
          </div>
          <div
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${
              completed
                ? 'border-gray-900 bg-gray-900 text-white'
                : active
                  ? 'border-gray-300 bg-gray-100 text-gray-700'
                  : 'border-black/8 bg-white/72 text-[#978E85]'
            }`}
          >
            {completed ? <Check className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
          </div>
        </div>
        {unlocked ? (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-ghost">{children}</div>
        ) : compactLocked ? (
          <div className="mt-6 flex-1" />
        ) : (
          <div className="mt-8 flex flex-1 items-center justify-center">
            <div className="rounded-[24px] border border-white/40 bg-white/45 px-5 py-4 text-center">
              <p className="text-sm font-medium text-[#544C44]">上一张完成后，这张卡会亮起来</p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  )
}

export default function NewContactForm({
  initialContact,
  mode = 'create',
  allContacts = [],
}: {
  initialContact?: InitialContact
  mode?: 'create' | 'edit'
  allContacts?: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const isEdit = mode === 'edit' && Boolean(initialContact?.id)
  const currentYear = new Date().getFullYear()

  const [activeStage, setActiveStage] = useState<StageId>('flash')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(initialContact?.fullName ?? initialContact?.name ?? '')
  const [gender, setGender] = useState<Gender | ''>(initialContact?.gender ?? '')
  const [city, setCity] = useState(initialContact?.city ?? '')
  const [age, setAge] = useState(initialContact?.age?.toString() ?? '')
  const [firstMetYear, setFirstMetYear] = useState(initialContact?.firstMetYear?.toString() ?? '')
  const [personalRelation, setPersonalRelation] = useState<PersonalRelation | ''>(initialContact?.personalRelation ?? '')
  const [reciprocityLevel, setReciprocityLevel] = useState(
    initialContact?.reciprocityLevel != null ? String(initialContact.reciprocityLevel) : ''
  )
  const [valueScore, setValueScore] = useState<ValueLevel | ''>(initialContact?.valueScore ?? '')
  const [networkingNeed, setNetworkingNeed] = useState<NetworkingNeed | ''>(
    initialContact?.networkingNeeds?.[0] ?? ''
  )
  const [selectedFriends, setSelectedFriends] = useState<Array<{ id: string; name: string }>>(
    allContacts.filter((contact) => (initialContact?.friendLinks ?? []).includes(contact.id))
  )

  const [companyName, setCompanyName] = useState(initialContact?.companyName ?? initialContact?.company ?? '')
  const [companyScale, setCompanyScale] = useState<CompanyScaleNew | ''>(initialContact?.companyScale ?? '')
  const [companyProfile, setCompanyProfile] = useState(initialContact?.companyProfile ?? '')
  const [industryL1, setIndustryL1] = useState(initialContact?.industryL1 ?? '')
  const [industryL2, setIndustryL2] = useState(initialContact?.industryL2 ?? '')
  const [jobPosition, setJobPosition] = useState<JobPosition | ''>(initialContact?.jobPosition ?? '')
  const [jobFunction, setJobFunction] = useState<JobFunction | ''>(initialContact?.jobFunction ?? '')
  const [influence, setInfluence] = useState<InfluenceLevel | ''>(initialContact?.influence ?? '')
  const [companyAddress, setCompanyAddress] = useState(initialContact?.companyAddress ?? '')

  const [roleArchetype, setRoleArchetype] = useState<RoleArchetype | ''>(initialContact?.roleArchetype ?? '')
  const [spiritAnimal, setSpiritAnimal] = useState<SpiritAnimalNew | ''>(initialContact?.spiritAnimal ?? '')
  const [chemistryScore, setChemistryScore] = useState(initialContact?.chemistryScore ?? 0)
  const [potentialProjects, setPotentialProjects] = useState(initialContact?.potentialProjects ?? '')
  const [socialPosition, setSocialPosition] = useState(initialContact?.socialPosition ?? '')
  const [hobbies, setHobbies] = useState(initialContact?.hobbies ?? '')
  const [personalNotes, setPersonalNotes] = useState(initialContact?.personalNotes ?? '')

  const [wechat, setWechat] = useState(initialContact?.wechat ?? '')
  const [phone, setPhone] = useState(initialContact?.phone ?? '')
  const [email, setEmail] = useState(initialContact?.email ?? '')
  const [personalAddress, setPersonalAddress] = useState(initialContact?.personalAddress ?? '')
  const [notes, setNotes] = useState(initialContact?.notes ?? '')

  const flashSignals = useMemo(
    () => [
      Boolean(fullName.trim()),
      Boolean(personalRelation),
      Boolean(networkingNeed),
      Boolean(city.trim() || firstMetYear),
      Boolean(valueScore || reciprocityLevel || selectedFriends.length > 0),
    ],
    [city, firstMetYear, fullName, networkingNeed, personalRelation, reciprocityLevel, selectedFriends.length, valueScore]
  )
  const depthSignals = useMemo(
    () => [
      Boolean(companyName.trim()),
      Boolean(industryL1),
      Boolean(jobPosition),
      Boolean(influence || companyScale),
      Boolean(jobFunction || companyProfile.trim() || companyAddress.trim()),
    ],
    [companyAddress, companyName, companyProfile, companyScale, industryL1, influence, jobFunction, jobPosition]
  )
  const portraitSignals = useMemo(
    () => [
      Boolean(roleArchetype),
      Boolean(spiritAnimal),
      Boolean(chemistryScore > 0),
      Boolean(wechat.trim() || phone.trim() || email.trim()),
      Boolean(
        potentialProjects.trim() ||
          socialPosition.trim() ||
          hobbies.trim() ||
          personalNotes.trim() ||
          personalAddress.trim() ||
          notes.trim()
      ),
    ],
    [chemistryScore, email, hobbies, notes, personalAddress, personalNotes, phone, potentialProjects, roleArchetype, socialPosition, spiritAnimal, wechat]
  )

  const flashScore = flashSignals.filter(Boolean).length
  const depthScore = depthSignals.filter(Boolean).length
  const portraitScore = portraitSignals.filter(Boolean).length

  const flashComplete = flashScore >= 3
  const depthComplete = Boolean(companyName.trim()) && depthScore >= 3
  const portraitComplete = portraitScore >= 3

  const unlocked = {
    flash: true,
    depth: flashComplete,
    portrait: depthComplete,
  }

  useEffect(() => {
    if (activeStage === 'depth' && !unlocked.depth) setActiveStage('flash')
    if (activeStage === 'portrait' && !unlocked.portrait) setActiveStage(unlocked.depth ? 'depth' : 'flash')
  }, [activeStage, unlocked.depth, unlocked.portrait])

  const overallProgress = useMemo(() => {
    const filled = flashScore + depthScore + portraitScore
    return Math.round((filled / 15) * 100)
  }, [depthScore, flashScore, portraitScore])

  const nextActionLabel = useMemo(() => {
    if (activeStage !== 'portrait') return '确认登录'
    return isEdit ? '保存修改' : '完成保存'
  }, [activeStage, isEdit])

  const progressRatio = overallProgress / 100
  const progressTone = useMemo(() => {
    const from = { r: 58, g: 58, b: 62 }
    const to = { r: 160, g: 79, b: 71 }
    const mix = (start: number, end: number) => Math.round(start + (end - start) * progressRatio)
    return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`
  }, [progressRatio])

  const nextActionEnabled = useMemo(() => {
    if (activeStage === 'flash') return flashComplete
    if (activeStage === 'depth') return depthComplete
    return !saving
  }, [activeStage, depthComplete, flashComplete, saving])

  const years = useMemo(() => Array.from({ length: 40 }, (_, index) => currentYear - index), [currentYear])
  const previewName = fullName.trim() || '联系人'
  const compactSummary = [companyName.trim(), (industryL2 || industryL1).trim()].filter(Boolean)

  async function handleSubmit() {
    setError(null)

    if (!fullName.trim()) {
      setError('至少先写下联系人姓名，再继续保存。')
      setActiveStage('flash')
      return
    }
    if (!companyName.trim()) {
      setError('为了便于后续查找和分析，请至少补上公司名称。')
      setActiveStage('depth')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: fullName.trim(),
        gender: gender || undefined,
        age: age ? Number(age) : undefined,
        city: city || undefined,
        firstMetYear: firstMetYear ? Number(firstMetYear) : undefined,
        personalRelation: personalRelation || undefined,
        reciprocityLevel: reciprocityLevel !== '' ? Number(reciprocityLevel) : undefined,
        friendLinks: selectedFriends.map((friend) => friend.id),
        companyName: companyName.trim(),
        companyProfile: companyProfile || undefined,
        companyScale: companyScale || undefined,
        industryL1: industryL1 || undefined,
        industryL2: industryL2 || undefined,
        jobPosition: jobPosition || undefined,
        jobFunction: jobFunction || undefined,
        influence: influence || undefined,
        networkingNeed: networkingNeed || undefined,
        spiritAnimal: spiritAnimal || undefined,
        roleArchetype: roleArchetype || undefined,
        chemistryScore: chemistryScore || undefined,
        valueScore: valueScore || undefined,
        potentialProjects: potentialProjects || undefined,
        socialPosition: socialPosition || undefined,
        hobbies: hobbies || undefined,
        personalNotes: personalNotes || undefined,
        notes: notes || undefined,
        phone: phone || undefined,
        wechat: wechat || undefined,
        email: email || undefined,
        companyAddress: companyAddress || undefined,
        personalAddress: personalAddress || undefined,
      }

      const response = await fetch(isEdit ? `/api/contacts/${initialContact?.id}` : '/api/contacts', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.error || '保存失败，请稍后再试。')
        return
      }

      setDone(true)
      window.setTimeout(() => router.push('/contacts'), 900)
    } catch (submitError) {
      setError(`保存失败：${String(submitError)}`)
    } finally {
      setSaving(false)
    }
  }

  function handleAdvance() {
    setError(null)
    if (activeStage === 'flash') {
      if (!flashComplete) {
        setError('先补足 7 秒卡片里的核心信息，第二张卡片就会亮起。')
        return
      }
      setActiveStage('depth')
      return
    }
    if (activeStage === 'depth') {
      if (!depthComplete) {
        setError('再补一点公司和职能信息，30 秒卡片就能解锁。')
        return
      }
      setActiveStage('portrait')
      return
    }
    void handleSubmit()
  }

  return (
    <div className="min-h-full bg-[#f6f6f4] lg:h-[100dvh] lg:overflow-hidden">
      <div className="flex min-h-screen w-full min-w-0 flex-col px-6 py-4 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden lg:px-8">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '人脉资产', href: '/contacts' },
            { label: isEdit ? '编辑联系人' : '+ 人脉' },
          ]}
          title={isEdit ? '编辑人脉卡片' : '+ 人脉'}
          titleNote={
            <span className="text-sm text-gray-500">
              快速登录人脉，作为XMiner AI分析数据
            </span>
          }
          hints={[
            '第一张卡只做识别，不求填满。',
            '第二张卡补足合作语境，便于后续筛选和路径分析。',
            '第三张卡收集画像和联系方式，未来可以继续追加细节。',
          ]}
        />

        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.78),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(160,79,71,0.07),transparent_28%)]" />
          <div className="relative flex h-full min-h-0 flex-col">
            {error ? (
              <div className="mb-3 rounded-[22px] border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {error}
              </div>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3 lg:gap-4" style={{ perspective: '2200px' }}>
              <StageCard
                stage={STAGES[0]}
                index={0}
                active={activeStage === 'flash'}
                unlocked={true}
                completed={flashComplete}
                onActivate={() => setActiveStage('flash')}
              >
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>姓名</FieldLabel>
                      <TextInput value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="你最想先记住他什么名字" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_auto_auto] sm:items-end">
                      <div>
                        <FieldLabel>城市</FieldLabel>
                        <TextInput value={city} onChange={(event) => setCity(event.target.value)} placeholder="例如：深圳" />
                      </div>
                      <div>
                        <FieldLabel>性别</FieldLabel>
                        <GenderIconPills value={gender} options={GENDER_OPTIONS} onChange={setGender} />
                      </div>
                      <div className="min-w-[92px]">
                        <FieldLabel>年龄</FieldLabel>
                        <TextInput type="number" min={1} max={120} value={age} onChange={(event) => setAge(event.target.value)} placeholder="岁" />
                      </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div>
                        <FieldLabel>互动目的</FieldLabel>
                        <IconChoiceGrid value={networkingNeed} options={NETWORKING_OPTIONS} onChange={setNetworkingNeed} />
                      </div>
                      <div>
                        <FieldLabel>关系感</FieldLabel>
                        <IconChoiceGrid value={personalRelation} options={PERSONAL_RELATION_OPTIONS} onChange={setPersonalRelation} />
                      </div>
                    </div>
                  </div>

                  <DetailDisclosure title="再补一点关系细节" summary="">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel hint="可选">初识年份</FieldLabel>
                        <SelectInput value={firstMetYear} onChange={(event) => setFirstMetYear(event.target.value)}>
                          <option value="">请选择</option>
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year} 年
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                      <div>
                        <FieldLabel hint="可选">综合价值</FieldLabel>
                        <div className="grid grid-cols-4 gap-2">
                          {VALUE_OPTIONS.map((option) => {
                            const active = valueScore === option.value
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setValueScore(option.value)}
                                className={`h-10 rounded-2xl border px-2 text-xs font-medium transition ${
                                  active
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-black/10 bg-white/90 text-[#4F4841] hover:border-black/20'
                                }`}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="可选">互惠势能</FieldLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {RECIPROCITY_OPTIONS.map((option) => {
                          const active = reciprocityLevel === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setReciprocityLevel(option.value)}
                              className={`rounded-[18px] border px-2 py-2.5 text-center transition ${
                                active ? 'border-gray-900 bg-gray-900 text-white' : 'border-black/10 bg-white text-[#4D463F] hover:border-black/20'
                              }`}
                            >
                              <div className="text-sm font-semibold">{option.label}</div>
                              <div className={`mt-1 text-[10px] leading-4 ${active ? 'text-white/75' : 'text-[#8E867D]'}`}>{option.tip}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <FriendPicker allContacts={allContacts} selectedFriends={selectedFriends} setSelectedFriends={setSelectedFriends} />
                  </DetailDisclosure>
                </div>
              </StageCard>

              <StageCard
                stage={STAGES[1]}
                index={1}
                active={activeStage === 'depth'}
                unlocked={unlocked.depth}
                completed={depthComplete}
                onActivate={() => setActiveStage('depth')}
              >
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>公司名称</FieldLabel>
                      <TextInput value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="例如：某某教育科技" />
                    </div>
                    <IndustrySelect industryL1={industryL1} setIndustryL1={setIndustryL1} industryL2={industryL2} setIndustryL2={setIndustryL2} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel hint="推荐">职级</FieldLabel>
                        <SelectInput value={jobPosition} onChange={(event) => setJobPosition(event.target.value as JobPosition | '')}>
                          <option value="">请选择</option>
                          {JOB_POSITION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                      <div>
                        <FieldLabel hint="推荐">影响力</FieldLabel>
                        <MiniPills value={influence} options={INFLUENCE_OPTIONS} onChange={setInfluence} />
                      </div>
                    </div>
                  </div>

                  <DetailDisclosure title="补足公司与职能背景" summary="">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel hint="可选">公司体量</FieldLabel>
                        <SelectInput value={companyScale} onChange={(event) => setCompanyScale(event.target.value as CompanyScaleNew | '')}>
                          <option value="">请选择</option>
                          {COMPANY_SCALE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                      <div>
                        <FieldLabel hint="可选">职能方向</FieldLabel>
                        <SelectInput value={jobFunction} onChange={(event) => setJobFunction(event.target.value as JobFunction | '')}>
                          <option value="">请选择</option>
                          {JOB_FUNCTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="可选">公司地址</FieldLabel>
                      <TextInput value={companyAddress} onChange={(event) => setCompanyAddress(event.target.value)} placeholder="例如：深圳南山区" />
                    </div>
                    <div>
                      <FieldLabel hint="可选">公司简介</FieldLabel>
                      <TextArea rows={4} value={companyProfile} onChange={(event) => setCompanyProfile(event.target.value)} placeholder="主业、阶段、合作氛围、你对这家公司的直观印象都可以写。" />
                    </div>
                  </DetailDisclosure>
                </div>
              </StageCard>

              <StageCard
                stage={STAGES[2]}
                index={2}
                active={activeStage === 'portrait'}
                unlocked={unlocked.portrait}
                completed={portraitComplete}
                onActivate={() => setActiveStage('portrait')}
              >
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <FieldLabel hint="推荐">关系角色</FieldLabel>
                      <ChipGroup value={roleArchetype} options={ROLE_OPTIONS} onChange={setRoleArchetype} />
                    </div>
                    <div>
                      <FieldLabel hint="推荐">气场动物</FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {ANIMAL_OPTIONS.map((option) => {
                          const active = spiritAnimal === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSpiritAnimal(option.value)}
                              className={`rounded-[18px] border px-3 py-3 text-left transition ${
                                active ? 'border-gray-900 bg-gray-900 text-white' : 'border-black/10 bg-white text-[#1B1714] hover:border-black/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-xs text-[#5C554D]">{option.emoji}</span>
                                <div>
                                  <div className="text-sm font-medium">{option.label}</div>
                                  <div className={`mt-0.5 text-[11px] leading-5 ${active ? 'text-white/75' : 'text-[#7F786F]'}`}>{option.desc}</div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="推荐">气场契合度</FieldLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((item) => {
                          const active = chemistryScore === item
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setChemistryScore(item)}
                              className={`rounded-[18px] border py-2.5 text-sm font-medium transition ${
                                active ? 'border-gray-900 bg-gray-900 text-white' : 'border-black/10 bg-white text-[#4C453E] hover:border-black/20'
                              }`}
                            >
                              {item} / 5
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <FieldLabel hint="可选">微信</FieldLabel>
                        <TextInput value={wechat} onChange={(event) => setWechat(event.target.value)} placeholder="优先联系方式" />
                      </div>
                      <div>
                        <FieldLabel hint="可选">电话</FieldLabel>
                        <TextInput value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="手机号" />
                      </div>
                      <div>
                        <FieldLabel hint="可选">邮箱</FieldLabel>
                        <TextInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱地址" />
                      </div>
                    </div>
                  </div>

                  <DetailDisclosure title="沉淀完整画像与备注" summary="">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel hint="可选">潜在合作方向</FieldLabel>
                        <TextArea rows={3} value={potentialProjects} onChange={(event) => setPotentialProjects(event.target.value)} placeholder="你们未来可能在哪件事上发生合作" />
                      </div>
                      <div>
                        <FieldLabel hint="可选">社会位置 / 标签</FieldLabel>
                        <TextArea rows={3} value={socialPosition} onChange={(event) => setSocialPosition(event.target.value)} placeholder="例如：地方协会关键节点、校长圈桥梁" />
                      </div>
                      <div>
                        <FieldLabel hint="可选">兴趣爱好</FieldLabel>
                        <TextArea rows={3} value={hobbies} onChange={(event) => setHobbies(event.target.value)} placeholder="便于未来自然切入聊天" />
                      </div>
                      <div>
                        <FieldLabel hint="可选">个人观察</FieldLabel>
                        <TextArea rows={3} value={personalNotes} onChange={(event) => setPersonalNotes(event.target.value)} placeholder="你对这个人的判断、节奏感、边界感" />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel hint="可选">个人地址</FieldLabel>
                        <TextInput value={personalAddress} onChange={(event) => setPersonalAddress(event.target.value)} placeholder="例如：常驻城市 / 区域" />
                      </div>
                      <div className="rounded-[22px] border border-black/8 bg-[#fafaf9] p-4">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">Live Preview</p>
                        <div className="mt-3 flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-900 text-sm font-semibold text-white">
                            {(fullName || '?').slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#191613]">{previewName}</p>
                            {compactSummary.length > 0 ? (
                              <p className="mt-1 text-xs leading-5 text-[#7B736A]">{compactSummary.join(' / ')}</p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {roleArchetype ? (
                                <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] text-[#5A534C]">
                                  {ROLE_OPTIONS.find((item) => item.value === roleArchetype)?.label}
                                </span>
                              ) : null}
                              {spiritAnimal ? (
                                <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] text-[#5A534C]">
                                  {ANIMAL_OPTIONS.find((item) => item.value === spiritAnimal)?.label}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="可选">综合备注</FieldLabel>
                      <TextArea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="写下下一次跟进前，自己最需要被提醒的内容。" />
                    </div>
                  </DetailDisclosure>
                </div>
              </StageCard>
            </div>

            <div className="mt-3 rounded-[28px] border border-black/8 bg-white/78 px-4 py-4 shadow-[0_12px_34px_rgba(24,20,16,0.06)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="ml-1 min-w-[104px] text-[46px] font-bold leading-none tracking-[0.01em] md:text-[54px]"
                        style={{ color: progressTone, fontFamily: 'Rajdhani, "Orbitron", "DIN Alternate", "SF Pro Display", sans-serif' }}
                      >
                        {overallProgress}%
                      </div>
                      <div className="relative h-9 flex-1">
                        <div className="pointer-events-none absolute -top-4 left-0 right-0">
                          {[30, 50, 80, 100].map((mark) => (
                            <span
                              key={mark}
                              className={`absolute text-[11px] italic text-gray-500 ${mark === 100 ? '-translate-x-full' : '-translate-x-1/2'}`}
                              style={{ left: `${mark}%` }}
                            >
                              {mark}%
                            </span>
                          ))}
                        </div>
                        <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-full border border-black/10 bg-white">
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,#3A3A3E_0%,#A04F47_100%)]" />
                        <motion.div
                          initial={false}
                          animate={{ width: `${100 - overallProgress}%` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="absolute inset-y-0 right-0 bg-white/75"
                        />
                        <motion.div
                          initial={false}
                          animate={{ left: `clamp(9px, ${overallProgress}%, calc(100% - 9px))` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-black shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                        />
                      </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {done ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">
                      <Check className="h-4 w-4" />
                      已保存，正在返回
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAdvance}
                      disabled={!nextActionEnabled}
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: progressTone }}
                    >
                      {saving ? <Sparkles className="h-4 w-4 animate-pulse" /> : null}
                      {nextActionLabel}
                      {activeStage !== 'portrait' ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
