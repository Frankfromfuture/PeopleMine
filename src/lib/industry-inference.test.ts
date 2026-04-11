import { describe, expect, it } from '@jest/globals'
import { inferFromTags } from './industry-inference'

describe('inferFromTags', () => {
  it('空数组返回其他', () => {
    expect(inferFromTags([])).toBe('其他')
  })

  it('纯噪声词返回其他', () => {
    expect(inferFromTags(['开心', '聊天', '朋友局'])).toBe('其他')
  })

  it('识别人工智能', () => {
    expect(inferFromTags(['AIGC', '大模型训练', 'NLP'])).toBe('人工智能')
  })

  it('识别企业服务（ToB/SaaS）', () => {
    expect(inferFromTags(['SaaS', 'CRM', '企业数字化'])).toBe('企业服务（ToB/SaaS）')
  })

  it('识别互联网科技', () => {
    expect(inferFromTags(['互联网', '前端开发', '产品经理'])).toBe('互联网科技')
  })

  it('识别金融', () => {
    expect(inferFromTags(['基金', '证券', '量化'])).toBe('金融')
  })

  it('识别医疗健康', () => {
    expect(inferFromTags(['生物医药', '医院', '临床'])).toBe('医疗健康')
  })

  it('识别教育', () => {
    expect(inferFromTags(['在线教育', '职业教育', '课程设计'])).toBe('教育')
  })

  it('识别消费零售', () => {
    expect(inferFromTags(['快消品牌', '连锁门店', '私域运营'])).toBe('消费零售')
  })

  it('识别电商与跨境', () => {
    expect(inferFromTags(['抖音电商', '选品', '跨境电商'])).toBe('电商与跨境')
  })

  it('识别物流与供应链', () => {
    expect(inferFromTags(['仓储', '冷链物流', '履约'])).toBe('物流与供应链')
  })

  it('识别制造业', () => {
    expect(inferFromTags(['智能制造', '工厂自动化', '产线质检'])).toBe('制造业')
  })

  it('识别汽车与出行', () => {
    expect(inferFromTags(['新能源汽车', '车联网', '出行平台'])).toBe('汽车与出行')
  })

  it('识别房地产与建筑', () => {
    expect(inferFromTags(['房地产', '施工工程', '物业管理'])).toBe('房地产与建筑')
  })

  it('识别能源与环保', () => {
    expect(inferFromTags(['光伏', '储能', '碳中和'])).toBe('能源与环保')
  })

  it('识别文化传媒', () => {
    expect(inferFromTags(['短视频内容', '品牌营销', 'MCN'])).toBe('文化传媒')
  })

  it('识别游戏', () => {
    expect(inferFromTags(['手游发行', '电竞', 'Unity'])).toBe('游戏')
  })

  it('识别法律与咨询', () => {
    expect(inferFromTags(['律所', '法务合规', '管理咨询'])).toBe('法律与咨询')
  })

  it('识别政府与公共服务', () => {
    expect(inferFromTags(['政务服务', '事业单位', '公共治理'])).toBe('政府与公共服务')
  })

  it('识别农业与食品', () => {
    expect(inferFromTags(['农产品', '食品加工', '生鲜供应链'])).toBe('农业与食品')
  })

  it('识别旅游与酒店', () => {
    expect(inferFromTags(['文旅项目', '酒店运营', '景区管理'])).toBe('旅游与酒店')
  })

  it('多行业并列且强命中相同时返回其他', () => {
    expect(inferFromTags(['医疗', '金融'])).toBe('其他')
  })

  it('中英混合标签也能识别', () => {
    expect(inferFromTags(['AI', 'SaaS', '大模型'])).toBe('人工智能')
  })
})
