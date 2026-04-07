'use client'

import { useState, useRef, useEffect } from 'react'
import {
  GENDER_LABELS,
  PERSONAL_RELATION_LABELS,
  COMPANY_SCALE_NEW_LABELS,
  INDUSTRY_L1_OPTIONS,
  INDUSTRY_L2_MAP,
  JOB_POSITION_LABELS,
  JOB_FUNCTION_LABELS,
  INFLUENCE_LEVEL_LABELS,
  SPIRIT_ANIMAL_NEW_LABELS,
  ROLE_ARCHETYPE_LABELS,
  VALUE_LEVEL_LABELS,
  NETWORKING_NEED_LABELS,
} from '@/types'
import type {
  Gender,
  PersonalRelation,
  CompanyScaleNew,
  JobPosition,
  JobFunction,
  InfluenceLevel,
  SpiritAnimalNew,
  RoleArchetype,
  ValueLevel,
  NetworkingNeed,
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

export default function NewContactForm({
  initialContact,
  mode = 'create',
  allContacts = [],
}: {
  initialContact?: InitialContact
  mode?: 'create' | 'edit'
  allContacts?: Array<{ id: string; name: string }>
}) {
  const isEdit = mode === 'edit' && Boolean(initialContact?.id)
  const actionUrl = isEdit ? `/api/contacts/${initialContact?.id}` : '/api/contacts'

  const [industryL1, setIndustryL1] = useState(initialContact?.industryL1 ?? '')
  const [industryL2Options, setIndustryL2Options] = useState<string[]>(
    industryL1 ? INDUSTRY_L2_MAP[industryL1] ?? [] : []
  )

  // Friend links search+select state
  const initFriendLinks = initialContact?.friendLinks ?? []
  const [selectedFriends, setSelectedFriends] = useState<Array<{ id: string; name: string }>>(
    allContacts.filter((c) => initFriendLinks.includes(c.id))
  )
  const [friendSearch, setFriendSearch] = useState('')
  const [friendDropdownOpen, setFriendDropdownOpen] = useState(false)
  const friendSearchRef = useRef<HTMLInputElement>(null)
  const friendDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        friendDropdownRef.current &&
        !friendDropdownRef.current.contains(e.target as Node) &&
        friendSearchRef.current &&
        !friendSearchRef.current.contains(e.target as Node)
      ) {
        setFriendDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredFriendOptions = allContacts.filter(
    (c) =>
      !selectedFriends.some((s) => s.id === c.id) &&
      c.name.toLowerCase().includes(friendSearch.toLowerCase())
  )

  function addFriend(contact: { id: string; name: string }) {
    setSelectedFriends((prev) => [...prev, contact])
    setFriendSearch('')
  }

  function removeFriend(id: string) {
    setSelectedFriends((prev) => prev.filter((f) => f.id !== id))
  }

  const handleIndustryL1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setIndustryL1(value)
    setIndustryL2Options(value ? INDUSTRY_L2_MAP[value] ?? [] : [])
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i)

  return (
    <div className="px-8 py-7">
      <div className="mb-5 text-sm text-gray-500">
        首页 <span className="mx-1">›</span> 人脉数据库 <span className="mx-1">›</span> {isEdit ? '编辑' : '新增'}
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{isEdit ? '编辑人物标签' : '人物标签页'}</h1>

      <form action={actionUrl} method="post">
        {isEdit && <input type="hidden" name="_action" value="update" />}

        <div className="grid grid-cols-3 gap-6">
          {/* 人脉信息 */}
          <div className="col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-600">👤 人脉信息</p>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-sm text-gray-700">姓名 *</span>
                <input
                  name="fullName"
                  required
                  defaultValue={initialContact?.fullName ?? initialContact?.name ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-sm text-gray-700">性别</span>
                  <select
                    name="gender"
                    defaultValue={initialContact?.gender ?? ''}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                  >
                    <option value="">不填</option>
                    {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
                      <option key={g} value={g}>{GENDER_LABELS[g]}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-gray-700">年龄</span>
                  <input
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    defaultValue={initialContact?.age ?? ''}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-gray-700">所在城市</span>
                  <input
                    name="city"
                    defaultValue={initialContact?.city ?? ''}
                    placeholder="如：上海"
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-700">初识时间</span>
                <select
                  name="firstMetYear"
                  defaultValue={initialContact?.firstMetYear ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">个人关系</span>
                <select
                  name="personalRelation"
                  defaultValue={initialContact?.personalRelation ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(PERSONAL_RELATION_LABELS) as PersonalRelation[]).map((pr) => (
                    <option key={pr} value={pr}>{PERSONAL_RELATION_LABELS[pr]}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">互惠势能</span>
                <select
                  name="reciprocityLevel"
                  defaultValue={String(initialContact?.reciprocityLevel ?? '')}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  <option value="2">+2（他欠你）</option>
                  <option value="1">+1</option>
                  <option value="0">0</option>
                  <option value="-1">-1</option>
                  <option value="-2">-2（你欠他）</option>
                </select>
              </label>

              <div className="block">
                <span className="text-sm text-gray-700">朋友链接</span>
                {/* Hidden inputs for form submission */}
                {selectedFriends.map((f) => (
                  <input key={f.id} type="hidden" name="friendLinks" value={f.id} />
                ))}
                {/* Search box */}
                <div className="relative mt-1">
                  <input
                    ref={friendSearchRef}
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    onFocus={() => setFriendDropdownOpen(true)}
                    placeholder="搜索联系人..."
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm"
                  />
                  {/* Dropdown */}
                  {friendDropdownOpen && filteredFriendOptions.length > 0 && (
                    <div
                      ref={friendDropdownRef}
                      className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto"
                    >
                      {filteredFriendOptions.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); addFriend(contact); setFriendDropdownOpen(false) }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          {contact.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {friendDropdownOpen && filteredFriendOptions.length === 0 && friendSearch && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
                      无匹配联系人
                    </div>
                  )}
                </div>
                {/* Selected tags */}
                {selectedFriends.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedFriends.map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                      >
                        {f.name}
                        <button
                          type="button"
                          onClick={() => removeFriend(f.id)}
                          className="text-gray-400 hover:text-gray-600 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 企业信息 */}
          <div className="col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-600">🏢 企业信息</p>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-sm text-gray-700">所在公司 *</span>
                <input
                  name="companyName"
                  required
                  defaultValue={initialContact?.companyName ?? initialContact?.company ?? ''}
                  placeholder="填入后用 XMINER 自动查询"
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">公司简介</span>
                <textarea
                  name="companyProfile"
                  defaultValue={initialContact?.companyProfile ?? ''}
                  placeholder="XMINER 自动填充"
                  className="mt-1 w-full min-h-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm resize-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">公司规模</span>
                <select
                  name="companyScale"
                  defaultValue={initialContact?.companyScale ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(COMPANY_SCALE_NEW_LABELS) as CompanyScaleNew[]).map((cs) => (
                    <option key={cs} value={cs}>{COMPANY_SCALE_NEW_LABELS[cs]}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-700">一级行业</span>
                  <select
                    name="industryL1"
                    value={industryL1}
                    onChange={handleIndustryL1Change}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                  >
                    <option value="">不填</option>
                    {INDUSTRY_L1_OPTIONS.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-gray-700">二级行业</span>
                  <select
                    name="industryL2"
                    defaultValue={initialContact?.industryL2 ?? ''}
                    disabled={!industryL1}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm disabled:bg-gray-50"
                  >
                    <option value="">不填</option>
                    {industryL2Options.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-700">职位</span>
                <select
                  name="jobPosition"
                  defaultValue={initialContact?.jobPosition ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(JOB_POSITION_LABELS) as JobPosition[]).map((jp) => (
                    <option key={jp} value={jp}>{JOB_POSITION_LABELS[jp]}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">职能</span>
                <select
                  name="jobFunction"
                  defaultValue={initialContact?.jobFunction ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(JOB_FUNCTION_LABELS) as JobFunction[]).map((jf) => (
                    <option key={jf} value={jf}>{JOB_FUNCTION_LABELS[jf]}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">影响力</span>
                <select
                  name="influence"
                  defaultValue={initialContact?.influence ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">XMINER 自动分析</option>
                  {(Object.keys(INFLUENCE_LEVEL_LABELS) as InfluenceLevel[]).map((il) => (
                    <option key={il} value={il}>{INFLUENCE_LEVEL_LABELS[il]}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* XMINER 分析 */}
          <div className="col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-600">🤖 XMINER 分析</p>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-sm text-gray-700">人脉需求</span>
                <select
                  name="networkingNeed"
                  defaultValue={initialContact?.networkingNeeds?.[0] ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(NETWORKING_NEED_LABELS) as NetworkingNeed[]).map((nn) => (
                    <option key={nn} value={nn}>{NETWORKING_NEED_LABELS[nn]}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">气场动物</span>
                <select
                  name="spiritAnimal"
                  defaultValue={initialContact?.spiritAnimal ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(SPIRIT_ANIMAL_NEW_LABELS) as SpiritAnimalNew[]).map((sa) => (
                    <option key={sa} value={sa}>
                      {SPIRIT_ANIMAL_NEW_LABELS[sa].emoji} {SPIRIT_ANIMAL_NEW_LABELS[sa].name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">角色体系</span>
                <select
                  name="roleArchetype"
                  defaultValue={initialContact?.roleArchetype ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(ROLE_ARCHETYPE_LABELS) as RoleArchetype[]).map((ra) => (
                    <option key={ra} value={ra}>{ROLE_ARCHETYPE_LABELS[ra].name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">气场契合（1-5星）</span>
                <input
                  name="chemistryScore"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  defaultValue={initialContact?.chemistryScore ?? 3}
                  className="mt-1 w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1星</span>
                  <span>2星</span>
                  <span>3星</span>
                  <span>4星</span>
                  <span>5星</span>
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">综合价值</span>
                <select
                  name="valueScore"
                  defaultValue={initialContact?.valueScore ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 bg-white text-sm"
                >
                  <option value="">不填</option>
                  {(Object.keys(VALUE_LEVEL_LABELS) as ValueLevel[]).map((vl) => (
                    <option key={vl} value={vl}>{VALUE_LEVEL_LABELS[vl]}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* 备注 */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">📝 备注</p>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-gray-700">潜在合作项目</span>
              <textarea
                name="potentialProjects"
                defaultValue={initialContact?.potentialProjects ?? ''}
                className="mt-1 w-full min-h-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm resize-none"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">社会职位</span>
              <textarea
                name="socialPosition"
                defaultValue={initialContact?.socialPosition ?? ''}
                className="mt-1 w-full min-h-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm resize-none"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">爱好</span>
              <textarea
                name="hobbies"
                defaultValue={initialContact?.hobbies ?? ''}
                className="mt-1 w-full min-h-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm resize-none"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">个人情况（毕业学校、家庭情况等）</span>
              <textarea
                name="personalNotes"
                defaultValue={initialContact?.personalNotes ?? ''}
                className="mt-1 w-full min-h-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm resize-none"
              />
            </label>

            <label className="block col-span-2">
              <span className="text-sm text-gray-700">其他</span>
              <textarea
                name="notes"
                defaultValue={initialContact?.notes ?? ''}
                className="mt-1 w-full min-h-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 text-sm resize-none"
              />
            </label>
          </div>
        </div>

        {/* 其他信息 */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">📞 其他信息</p>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm text-gray-700">电话</span>
              <input
                name="phone"
                defaultValue={initialContact?.phone ?? ''}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">微信</span>
              <input
                name="wechat"
                defaultValue={initialContact?.wechat ?? ''}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">邮箱</span>
              <input
                name="email"
                type="email"
                defaultValue={initialContact?.email ?? ''}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400"
              />
            </label>

            <label className="block col-span-2">
              <span className="text-sm text-gray-700">公司地址</span>
              <input
                name="companyAddress"
                defaultValue={initialContact?.companyAddress ?? ''}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">个人地址</span>
              <input
                name="personalAddress"
                defaultValue={initialContact?.personalAddress ?? ''}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6">
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700">
            {isEdit ? '保存修改' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
