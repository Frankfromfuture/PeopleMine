'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
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

const STEPS = [
  { key: 'intro', label: '认识', title: '基础关系信息', summary: '先建立这个人的基本轮廓和你们的关系位置。' },
  { key: 'company', label: '企业', title: '企业与职位', summary: '补充公司、行业和职位信息，为后续路径分析提供上下文。' },
  { key: 'profile', label: '画像', title: '人物画像', summary: '记录角色特征、气场和潜在合作方向。' },
  { key: 'other', label: '其他', title: '联系方式与备注', summary: '最后补齐联络方式和后续维护所需的关键备注。' },
] as const

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -36 : 36, opacity: 0 }),
}

const fieldCls =
  'h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
const textAreaCls =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 resize-none'

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
]
const PERSONAL_RELATION_OPTIONS: Array<{ value: PersonalRelation; label: string }> = [
  { value: 'INTIMATE', label: '亲密' },
  { value: 'FAMILIAR', label: '熟悉' },
  { value: 'NORMAL', label: '普通' },
  { value: 'ACQUAINTANCE', label: '一面之缘' },
]
const RECIPROCITY_OPTIONS = [
  { value: '2', label: '+2', tip: '他欠你' },
  { value: '1', label: '+1', tip: '你略占优' },
  { value: '0', label: '0', tip: '平衡' },
  { value: '-1', label: '-1', tip: '你略欠他' },
  { value: '-2', label: '-2', tip: '你欠他' },
]
const VALUE_OPTIONS: Array<{ value: ValueLevel; label: string }> = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'EXTREME', label: '极高' },
]
const NETWORKING_OPTIONS: Array<{ value: NetworkingNeed; label: string }> = [
  { value: 'BUSINESS_EXPANSION', label: '拓展业务' },
  { value: 'INTRODUCTIONS', label: '引荐连接' },
  { value: 'FRIENDSHIP', label: '朋友关系' },
  { value: 'SOCIAL', label: '社交拓圈' },
  { value: 'CASUAL_CHAT', label: '轻松聊天' },
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
  { value: 'VP', label: '副总裁' },
  { value: 'DIRECTOR', label: '总监' },
  { value: 'MANAGER', label: '经理' },
  { value: 'OTHER', label: '其他' },
]
const JOB_FUNCTION_OPTIONS: Array<{ value: JobFunction; label: string }> = [
  { value: 'MANAGEMENT', label: '管理' },
  { value: 'INVESTMENT', label: '投资' },
  { value: 'SALES', label: '销售' },
  { value: 'ENGINEER', label: '工程' },
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
  { value: 'BREAKER', label: '破局者', desc: '能带来关键资源或打开局面。' },
  { value: 'EVANGELIST', label: '布道者', desc: '连接广、引荐强，适合做中转。' },
  { value: 'ANALYST', label: '分析师', desc: '给出专业判断和行业洞察。' },
  { value: 'BINDER', label: '粘合剂', desc: '稳定协作关系，帮助长期推进。' },
]
const ANIMAL_OPTIONS: Array<{ value: SpiritAnimalNew; label: string; emoji: string; desc: string }> = [
  { value: 'TIGER', label: '老虎', emoji: '虎', desc: '强势果断，推进速度快。' },
  { value: 'PEACOCK', label: '孔雀', emoji: '雀', desc: '表达强、感染力高。' },
  { value: 'OWL', label: '猫头鹰', emoji: '鹰', desc: '理性冷静，擅长洞察。' },
  { value: 'KOALA', label: '考拉', emoji: '熊', desc: '稳定可靠，值得长期合作。' },
]
const INDUSTRY_CATALOG: Record<string, string[]> = {
  科技互联网: ['人工智能', 'SaaS', '数据平台', '电商', '内容社区'],
  金融投资: ['一级市场', '二级市场', '财富管理', '支付科技'],
  医疗健康: ['医院体系', '医疗器械', '生物科技', '互联网医疗'],
  消费品牌: ['零售渠道', '消费品', '餐饮品牌', '生活方式'],
  制造能源: ['先进制造', '汽车产业', '新能源', '供应链'],
  教育服务: ['职业教育', '留学服务', '企业培训', '知识服务'],
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-gray-900">{children}</label>
}

function StepButton({ active, completed, index, label, title, onClick }: { active: boolean; completed: boolean; index: number; label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
        active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active ? 'bg-white/15 text-white' : completed ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {completed && !active ? <Check className="h-4 w-4" /> : index + 1}
        </div>
        <div>
          <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-900'}`}>{label}</p>
          <p className={`mt-1 text-xs leading-5 ${active ? 'text-gray-300' : 'text-gray-500'}`}>{title}</p>
        </div>
      </div>
    </button>
  )
}

function ChoicePills<T extends string>({ value, onChange, options }: { value: T | ''; onChange: (value: T) => void; options: Array<{ value: T; label: string }> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
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
          contact.name.toLowerCase().includes(keyword.toLowerCase())
      ),
    [allContacts, keyword, selectedFriends]
  )

  return (
    <div>
      <FieldLabel>朋友链接</FieldLabel>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onFocus={() => setOpen(true)}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索已存在联系人，建立朋友链接"
          className={fieldCls}
        />
        {open && filteredContacts.length > 0 ? (
          <div ref={panelRef} className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-200/70">
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
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <span>{contact.name}</span>
                <span className="text-xs text-gray-400">加入</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {selectedFriends.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedFriends.map((friend) => (
            <span key={friend.id} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600">
              {friend.name}
              <button
                type="button"
                onClick={() => setSelectedFriends((current) => current.filter((item) => item.id !== friend.id))}
                className="text-gray-400 transition hover:text-gray-700"
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
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <FieldLabel>一级行业</FieldLabel>
        <select
          value={industryL1}
          onChange={(event) => {
            setIndustryL1(event.target.value)
            setIndustryL2('')
          }}
          className={fieldCls}
        >
          <option value="">请选择</option>
          {Object.keys(INDUSTRY_CATALOG).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>二级行业</FieldLabel>
        <select value={industryL2} onChange={(event) => setIndustryL2(event.target.value)} className={fieldCls}>
          <option value="">请选择</option>
          {secondLevelOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>
    </div>
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

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(initialContact?.fullName ?? initialContact?.name ?? '')
  const [gender, setGender] = useState<Gender | ''>(initialContact?.gender ?? '')
  const [city, setCity] = useState(initialContact?.city ?? '')
  const [age, setAge] = useState(initialContact?.age?.toString() ?? '')
  const [firstMetYear, setFirstMetYear] = useState(initialContact?.firstMetYear?.toString() ?? '')
  const [personalRelation, setPersonalRelation] = useState<PersonalRelation | ''>(initialContact?.personalRelation ?? '')
  const [reciprocityLevel, setReciprocityLevel] = useState(initialContact?.reciprocityLevel != null ? String(initialContact.reciprocityLevel) : '')
  const [valueScore, setValueScore] = useState<ValueLevel | ''>(initialContact?.valueScore ?? '')
  const [networkingNeed, setNetworkingNeed] = useState<NetworkingNeed | ''>(initialContact?.networkingNeeds?.[0] ?? '')
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

  const progress = Math.round(((step + 1) / STEPS.length) * 100)
  const canGoNext = step === 0 ? fullName.trim().length > 0 : true

  function goNext() {
    if (step >= STEPS.length - 1) return
    setDirection(1)
    setStep((current) => current + 1)
  }

  function goBack() {
    if (step <= 0) return
    setDirection(-1)
    setStep((current) => current - 1)
  }

  async function handleSubmit() {
    setError(null)

    if (!fullName.trim()) {
      setError('请先填写联系人姓名。')
      setStep(0)
      return
    }

    if (!companyName.trim()) {
      setError('请至少填写公司名称后再保存。')
      setStep(1)
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

      const res = await fetch(isEdit ? `/api/contacts/${initialContact?.id}` : '/api/contacts', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || '保存失败，请稍后再试。')
        return
      }

      setDone(true)
      window.setTimeout(() => router.push('/contacts'), 800)
    } catch (submitError) {
      setError(`保存失败：${String(submitError)}`)
    } finally {
      setSaving(false)
    }
  }

  const stepContent = [
    <div key="intro" className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2 rounded-[24px] border border-gray-200 bg-[#fafaf9] p-5">
        <p className="text-sm leading-6 text-gray-500">先确定这个人的名字、关系位置和你们之间的互惠状态，后面的信息都可以继续补录。</p>
      </div>
      <div>
        <FieldLabel>姓名</FieldLabel>
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={fieldCls} />
      </div>
      <div>
        <FieldLabel>城市</FieldLabel>
        <input value={city} onChange={(event) => setCity(event.target.value)} className={fieldCls} />
      </div>
      <div>
        <FieldLabel>年龄</FieldLabel>
        <input type="number" min={1} max={120} value={age} onChange={(event) => setAge(event.target.value)} className={fieldCls} />
      </div>
      <div>
        <FieldLabel>初识年份</FieldLabel>
        <select value={firstMetYear} onChange={(event) => setFirstMetYear(event.target.value)} className={fieldCls}>
          <option value="">请选择</option>
          {Array.from({ length: 40 }, (_, index) => currentYear - index).map((year) => (
            <option key={year} value={year}>{year} 年</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <FieldLabel>性别</FieldLabel>
        <ChoicePills value={gender} onChange={setGender} options={GENDER_OPTIONS} />
      </div>
      <div className="md:col-span-2">
        <FieldLabel>个人关系</FieldLabel>
        <ChoicePills value={personalRelation} onChange={setPersonalRelation} options={PERSONAL_RELATION_OPTIONS} />
      </div>
      <div className="md:col-span-2">
        <FieldLabel>互惠势能</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {RECIPROCITY_OPTIONS.map((option) => {
            const active = reciprocityLevel === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setReciprocityLevel(option.value)}
                className={`rounded-2xl border px-3 py-2 text-left transition ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                <p className={`mt-1 text-xs ${active ? 'text-gray-300' : 'text-gray-500'}`}>{option.tip}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div className="md:col-span-2">
        <FieldLabel>综合价值</FieldLabel>
        <ChoicePills value={valueScore} onChange={setValueScore} options={VALUE_OPTIONS} />
      </div>
      <div className="md:col-span-2">
        <FieldLabel>当前社交诉求</FieldLabel>
        <ChoicePills value={networkingNeed} onChange={setNetworkingNeed} options={NETWORKING_OPTIONS} />
      </div>
      <div className="md:col-span-2">
        <FriendPicker allContacts={allContacts} selectedFriends={selectedFriends} setSelectedFriends={setSelectedFriends} />
      </div>
    </div>,

    <div key="company" className="grid gap-5 md:grid-cols-2">
      <div>
        <FieldLabel>公司名称</FieldLabel>
        <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={fieldCls} />
      </div>
      <div>
        <FieldLabel>公司体量</FieldLabel>
        <select value={companyScale} onChange={(event) => setCompanyScale(event.target.value as CompanyScaleNew | '')} className={fieldCls}>
          <option value="">请选择</option>
          {COMPANY_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <FieldLabel>公司简介</FieldLabel>
        <textarea rows={4} value={companyProfile} onChange={(event) => setCompanyProfile(event.target.value)} placeholder="可写主营业务、竞争位置、合作可能性等。" className={textAreaCls} />
      </div>
      <div className="md:col-span-2">
        <IndustrySelect industryL1={industryL1} setIndustryL1={setIndustryL1} industryL2={industryL2} setIndustryL2={setIndustryL2} />
      </div>
      <div>
        <FieldLabel>职位层级</FieldLabel>
        <select value={jobPosition} onChange={(event) => setJobPosition(event.target.value as JobPosition | '')} className={fieldCls}>
          <option value="">请选择</option>
          {JOB_POSITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>职能方向</FieldLabel>
        <select value={jobFunction} onChange={(event) => setJobFunction(event.target.value as JobFunction | '')} className={fieldCls}>
          <option value="">请选择</option>
          {JOB_FUNCTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>影响力</FieldLabel>
        <select value={influence} onChange={(event) => setInfluence(event.target.value as InfluenceLevel | '')} className={fieldCls}>
          <option value="">请选择</option>
          {INFLUENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>公司地址</FieldLabel>
        <input value={companyAddress} onChange={(event) => setCompanyAddress(event.target.value)} className={fieldCls} />
      </div>
    </div>,
    <div key="profile" className="space-y-5">
      <div>
        <FieldLabel>关系角色</FieldLabel>
        <div className="grid gap-3 md:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const active = roleArchetype === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRoleArchetype(option.value)}
                className={`rounded-[24px] border p-4 text-left transition ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50'}`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                <p className={`mt-2 text-xs leading-5 ${active ? 'text-gray-300' : 'text-gray-500'}`}>{option.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <FieldLabel>气场动物</FieldLabel>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {ANIMAL_OPTIONS.map((option) => {
            const active = spiritAnimal === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSpiritAnimal(option.value)}
                className={`rounded-[24px] border p-4 text-center transition ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50'}`}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-base text-gray-700">{option.emoji}</div>
                <p className="mt-3 text-sm font-medium">{option.label}</p>
                <p className={`mt-2 text-xs leading-5 ${active ? 'text-gray-300' : 'text-gray-500'}`}>{option.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <FieldLabel>气场契合度</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((item) => {
            const active = chemistryScore === item
            return (
              <button
                key={item}
                type="button"
                onClick={() => setChemistryScore(item)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}
              >
                {item} / 5
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <FieldLabel>潜在合作方向</FieldLabel>
          <textarea rows={4} value={potentialProjects} onChange={(event) => setPotentialProjects(event.target.value)} className={textAreaCls} />
        </div>
        <div>
          <FieldLabel>社会位置 / 标签</FieldLabel>
          <textarea rows={4} value={socialPosition} onChange={(event) => setSocialPosition(event.target.value)} className={textAreaCls} />
        </div>
        <div>
          <FieldLabel>爱好与兴趣</FieldLabel>
          <textarea rows={4} value={hobbies} onChange={(event) => setHobbies(event.target.value)} className={textAreaCls} />
        </div>
        <div>
          <FieldLabel>个人观察</FieldLabel>
          <textarea rows={4} value={personalNotes} onChange={(event) => setPersonalNotes(event.target.value)} className={textAreaCls} />
        </div>
      </div>
    </div>,

    <div key="other" className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <FieldLabel>微信</FieldLabel>
          <input value={wechat} onChange={(event) => setWechat(event.target.value)} className={fieldCls} />
        </div>
        <div>
          <FieldLabel>电话</FieldLabel>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldCls} />
        </div>
        <div>
          <FieldLabel>邮箱</FieldLabel>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className={fieldCls} />
        </div>
      </div>
      <div>
        <FieldLabel>个人地址</FieldLabel>
        <input value={personalAddress} onChange={(event) => setPersonalAddress(event.target.value)} className={fieldCls} />
      </div>
      <div>
        <FieldLabel>综合备注</FieldLabel>
        <textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="记录后续跟进线索、重要事件、近期状态等。" className={textAreaCls} />
      </div>
      <div className="rounded-[24px] border border-gray-200 bg-[#fafaf9] p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Preview</p>
        <div className="mt-3 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">{(fullName || '?').slice(0, 1)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-900">{fullName || '未填写姓名'}</p>
            <p className="mt-1 text-sm text-gray-500">{[companyName, industryL2 || industryL1, jobPosition].filter(Boolean).join(' / ') || '待补充企业与职位信息'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roleArchetype ? <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">{ROLE_OPTIONS.find((option) => option.value === roleArchetype)?.label}</span> : null}
              {spiritAnimal ? <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">{ANIMAL_OPTIONS.find((option) => option.value === spiritAnimal)?.label}</span> : null}
              {networkingNeed ? <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">{NETWORKING_OPTIONS.find((option) => option.value === networkingNeed)?.label}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-full bg-[#f6f6f4]">
      <div className="flex min-h-screen w-full min-w-0 flex-col px-6 py-4 lg:px-8">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '人脉资产', href: '/contacts' },
            { label: isEdit ? '编辑联系人' : '＋人脉' },
          ]}
          title={isEdit ? '编辑联系人' : '＋人脉'}
          className="pb-4 lg:pb-5"
          titleNote={
            <span className="text-sm italic text-gray-500">
              {isEdit ? '修正已有联系人的资料、关系与画像信息。' : '分步骤录入新的联系人资料，补齐关系、企业和画像信息。'}
            </span>
          }
          hints={[
            '表单按“认识 / 企业 / 画像 / 其他”四段逐步整理。',
            '只要先填最关键的姓名和公司信息，就可以继续往后补充。',
            '已存在联系人可以直接作为朋友链接加入，为后续关系分析提供上下文。',
          ]}
        />

        <div className="mt-1 grid flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Progress</p>
            <div className="mt-4 space-y-3">
              {STEPS.map((item, index) => (
                <StepButton
                  key={item.key}
                  active={step === index}
                  completed={step > index}
                  index={index}
                  label={item.label}
                  title={item.summary}
                  onClick={() => {
                    setDirection(index > step ? 1 : -1)
                    setStep(index)
                  }}
                />
              ))}
            </div>
            <div className="mt-5 rounded-[24px] border border-gray-200 bg-[#fafaf9] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">完成度</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{progress}%</p>
              <p className="mt-2 text-xs leading-5 text-gray-500">信息可以逐步补录，不必一次填满。</p>
            </div>
          </aside>
          <section className="flex min-h-[760px] flex-col rounded-[32px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Step {step + 1}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{STEPS[step].title}</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">{STEPS[step].summary}</p>
                </div>
                <div className="rounded-full border border-gray-200 bg-[#fafaf9] px-3 py-1 text-xs text-gray-500">{isEdit ? '编辑模式' : '新建模式'}</div>
              </div>
            </div>

            <div className="flex-1 px-6 py-6">
              {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22 }}
                  className="h-full"
                >
                  {stepContent[step]}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-5">
              <button
                type="button"
                onClick={goBack}
                className={`inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-800 ${step === 0 ? 'invisible' : ''}`}
              >
                <ArrowLeft className="h-4 w-4" />
                上一步
              </button>

              <div className="flex items-center gap-3">
                {step < STEPS.length - 1 ? (
                  <>
                    {step > 0 ? <button type="button" onClick={goNext} className="text-sm text-gray-400 transition hover:text-gray-600">跳过</button> : null}
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canGoNext}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#A04F47] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A04F47]/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      下一步
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : done ? (
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white"><Check className="h-3.5 w-3.5" /></span>
                    已保存，正在跳转
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={handleSubmit} className="text-sm text-gray-400 transition hover:text-gray-600">直接保存</button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#A04F47] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A04F47]/90 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Sparkles className="h-4 w-4 animate-pulse" />
                          保存中
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          {isEdit ? '保存修改' : '完成保存'}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
