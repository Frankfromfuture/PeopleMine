import { RELATION_ROLE_LABELS, SPIRIT_ANIMAL_LABELS, COMPANY_SCALE_LABELS } from '@/types'
import type { RelationRole, SpiritAnimal, Temperature } from '@/types'
import type { TagConfig } from '@/lib/dev/tag-store'

const ROLE_STYLE: Record<RelationRole, string> = {
  BIG_INVESTOR: 'bg-amber-100 text-amber-700 border-amber-200',
  GATEWAY: 'bg-blue-100 text-blue-700 border-blue-200',
  ADVISOR: 'bg-violet-100 text-violet-700 border-violet-200',
  THERMOMETER: 'bg-rose-100 text-rose-700 border-rose-200',
  LIGHTHOUSE: 'bg-orange-100 text-orange-700 border-orange-200',
  COMRADE: 'bg-green-100 text-green-700 border-green-200',
}

const ANIMAL_EMOJI: Record<SpiritAnimal, string> = {
  LION: '🦁',
  FOX: '🦊',
  BEAR: '🐻',
  CHAMELEON: '🦎',
  EAGLE: '🦅',
  DOLPHIN: '🐬',
  OWL: '🦉',
  SKUNK: '🦨',
}

const JOB_POSITION_OPTIONS = [
  '总经理', '董事长', '副总裁', '总监', '经理',
  '销售', '市场', '产品经理', '工程师', '设计师',
  '财务', '行政', '人力资源', '运营', '法务', '其他',
]

type InitialContact = {
  id?: string
  name?: string | null
  company?: string | null
  companyId?: string | null
  title?: string | null
  jobPosition?: string | null
  trustLevel?: number | null
  tags?: string[]
  spiritAnimal?: string | null
  relationRole?: string | null
  temperature?: string | null
  wechat?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export default function NewContactForm({
  initialTagOptions,
  initialCompanies,
  initialContact,
  mode = 'create',
  tagConfig = null,
}: {
  initialTagOptions: string[]
  initialCompanies: Array<{ id: string; name: string }>
  initialContact?: InitialContact
  mode?: 'create' | 'edit'
  tagConfig?: TagConfig | null
}) {
  const isEdit = mode === 'edit' && Boolean(initialContact?.id)
  const actionUrl = isEdit ? `/api/contacts/${initialContact?.id}` : '/api/contacts'

  return (
    <div className="px-8 py-7">
      <div className="mb-5 text-sm text-gray-500">
        首页 <span className="mx-1">›</span> 人脉数据库 <span className="mx-1">›</span> {isEdit ? '编辑' : '新增'}
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{isEdit ? '编辑人物标签' : '人物标签页'}</h1>

      <form action={actionUrl} method="post">
        {isEdit && <input type="hidden" name="_action" value="update" />}
        <input type="hidden" name="tagLibrary" value={JSON.stringify(initialTagOptions)} />

        <div className="grid grid-cols-5 gap-6 items-start">
          {/* LEFT: Person */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-violet-600">👤 人物信息</p>
            </div>
            <div className="p-6 space-y-6">

              <section>
                <p className="text-sm text-gray-500 uppercase mb-3">基础信息</p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-gray-700">姓名 *</span>
                    <input name="name" required defaultValue={initialContact?.name ?? ''} className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700">职位</span>
                    <input name="title" defaultValue={initialContact?.title ?? ''} className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" />
                  </label>
                </div>
                <div className="mt-3">
                  <label className="block">
                    <span className="text-sm text-gray-700">岗位</span>
                    <select name="jobPosition" defaultValue={initialContact?.jobPosition ?? ''} className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 bg-white text-sm">
                      <option value="">不填</option>
                      {JOB_POSITION_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section>
                <p className="text-sm text-gray-500 uppercase mb-3">1) 信任度</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <label key={score} className="cursor-pointer">
                      <input
                        type="radio"
                        name="trustLevel"
                        value={score}
                        defaultChecked={score === (initialContact?.trustLevel ?? 3)}
                        className="sr-only peer"
                      />
                      <span className="text-2xl text-gray-300 peer-checked:text-amber-400">★</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">最低 1 颗星，最高 5 颗星</p>
              </section>

              <section>
                <p className="text-sm text-gray-500 uppercase mb-3">2) 行业标签</p>
                {tagConfig ? (
                  /* Dev mode: grouped by category/subcategory */
                  <div className="space-y-3">
                    {tagConfig.categories.map((cat) => (
                      <div key={cat.id}>
                        <p className="text-xs font-semibold text-zinc-500 mb-1.5">{cat.name}</p>
                        {cat.subcategories.map((sub) => (
                          <div key={sub.id} className="mb-2">
                            <p className="text-xs text-zinc-400 mb-1">{sub.name}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {sub.tags.map((tag) => (
                                <label key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border bg-white text-gray-700 border-gray-200 cursor-pointer hover:border-violet-300">
                                  <input
                                    type="checkbox"
                                    name="tags"
                                    value={tag}
                                    defaultChecked={initialContact?.tags?.includes(tag)}
                                    className="align-middle accent-violet-600"
                                  />
                                  <span>{tag}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Production mode: flat list */
                  <div>
                    {initialTagOptions.map((tag) => (
                      <div key={tag} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border bg-white text-gray-700 border-gray-200 mr-2 mb-2">
                        <input
                          type="checkbox"
                          name="tags"
                          value={tag}
                          defaultChecked={initialContact?.tags?.includes(tag)}
                          className="align-middle"
                        />
                        <span>{tag}</span>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  name="manualTags"
                  placeholder="自定义行业标签（多个用逗号分隔，如：半导体, 新能源）"
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm w-full outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">输入后直接保存，会自动加入并在下次登录保留。</p>
              </section>

              <section>
                <p className="text-sm text-gray-500 uppercase mb-3">3) 动物标签</p>
                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(SPIRIT_ANIMAL_LABELS) as SpiritAnimal[]).map((animal) => (
                    <label key={animal} className="border rounded-lg p-3 text-left transition border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="spiritAnimal"
                        value={animal}
                        defaultChecked={initialContact?.spiritAnimal === animal}
                        className="mr-2 align-middle"
                      />
                      <p className="text-lg inline">{ANIMAL_EMOJI[animal]}</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{SPIRIT_ANIMAL_LABELS[animal].name}</p>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-sm text-gray-500 uppercase mb-3">4) 关系角色 *</p>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(RELATION_ROLE_LABELS) as RelationRole[]).map((role) => (
                    <label key={role} className="text-left border rounded-lg p-3 transition border-gray-200 hover:border-gray-300 text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="relationRole"
                        value={role}
                        required
                        defaultChecked={initialContact?.relationRole === role}
                        className="mr-2 align-middle"
                      />
                      <p className={`text-sm font-semibold inline-block px-2 py-0.5 rounded ${ROLE_STYLE[role]}`}>{RELATION_ROLE_LABELS[role].name}</p>
                      <p className="text-xs mt-1 opacity-80">{RELATION_ROLE_LABELS[role].desc}</p>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-sm text-gray-500 uppercase mb-3">5) 气场契合程度</p>
                <div className="flex gap-2">
                  {[
                    { value: 'COLD', label: '低' },
                    { value: 'WARM', label: '中' },
                    { value: 'HOT', label: '高' },
                  ].map((item) => (
                    <label key={item.value} className="px-4 py-2 rounded-lg text-sm border transition border-gray-200 text-gray-600 hover:border-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="temperature"
                        value={item.value as Temperature}
                        defaultChecked={initialContact?.temperature === item.value}
                        className="mr-1 align-middle"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </section>

              <details>
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">展开完整模式（其余信息）</summary>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <label><span className="text-sm text-gray-700">微信</span><input name="wechat" defaultValue={initialContact?.wechat ?? ''} className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" /></label>
                  <label><span className="text-sm text-gray-700">电话</span><input name="phone" defaultValue={initialContact?.phone ?? ''} className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" /></label>
                  <label><span className="text-sm text-gray-700">邮箱</span><input name="email" defaultValue={initialContact?.email ?? ''} className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" /></label>
                  <div />
                  <label className="col-span-2"><span className="text-sm text-gray-700">备注</span><textarea name="notes" defaultValue={initialContact?.notes ?? ''} className="mt-1 w-full min-h-24 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" /></label>
                </div>
              </details>

            </div>
          </div>

          {/* RIGHT: Company */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-blue-600">🏢 所在企业（可选）</p>
              <p className="text-xs text-gray-400 mt-0.5">可选 · 保存后自动关联企业数据库</p>
            </div>
            <div className="p-6 space-y-4">

              <label className="block">
                <span className="text-sm text-gray-700">从企业库选择公司</span>
                <select
                  name="companyId"
                  defaultValue={initialContact?.companyId ?? ''}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm bg-white"
                >
                  <option value="">不关联企业</option>
                  {initialCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">优先使用企业数据库中的公司进行关联。</p>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">公司名称（未在企业库时填写）</span>
                <input
                  name="company"
                  defaultValue={initialContact?.company ?? ''}
                  placeholder="如：字节跳动、阿里巴巴"
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">仅当上方未选择企业时生效，保存后会自动创建并关联企业。</p>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700">所在行业</span>
                <input
                  name="companyIndustry"
                  placeholder="如：科技、金融、教育"
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
                />
              </label>

              <div>
                <p className="text-sm text-gray-700 mb-1.5">企业规模</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(COMPANY_SCALE_LABELS) as [string, { name: string; desc: string; color: string }][]).map(([k, v]) => (
                    <label key={k} className="cursor-pointer">
                      <input type="radio" name="companyScale" value={k} className="sr-only peer" />
                      <span className={`px-2 py-1 text-xs rounded border cursor-pointer transition-all peer-checked:ring-2 peer-checked:ring-blue-400 ${v.color}`}>
                        {v.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm text-gray-700">主营业务</span>
                <textarea
                  name="companyMainBusiness"
                  placeholder="简述公司主营业务..."
                  className="mt-1 w-full min-h-20 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm resize-none"
                />
              </label>

            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6">
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
            {isEdit ? '保存修改' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
