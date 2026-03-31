import { describe, it, expect } from '@jest/globals'
import {
  computeRelevanceScore,
  computeAccessibilityScore,
  computeNetworkCentrality,
  computeJourneyScore,
  scoreAllContacts,
} from './scoring'
import { Contact, ContactRelation } from '@prisma/client'

describe('航程评分引擎', () => {
  // 模拟联系人
  const mockContact: Contact = {
    id: 'contact-1',
    userId: 'user-1',
    name: '张三',
    wechat: null,
    phone: null,
    email: null,
    spiritAnimal: null,
    relationRole: 'GATEWAY',
    tags: ['互联网', '产品', '投资'],
    industry: 'tech',
    company: 'Bytedance',
    title: 'PM',
    trustLevel: 4,
    temperature: 'WARM',
    energyScore: 85,
    notes: '产品很厉害的人',
    lastContactedAt: new Date('2026-03-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('computeRelevanceScore', () => {
    it('应该匹配相关关键词', () => {
      const goal = '我想认识互联网产品经理'
      const score = computeRelevanceScore(goal, mockContact)
      expect(score).toBeGreaterThan(0.5) // 应该有较高的相关性
    })

    it('不相关的目标应该得分较低', () => {
      const goal = '我想学医学知识'
      const score = computeRelevanceScore(goal, mockContact)
      expect(score).toBeLessThan(0.5)
    })

    it('GATEWAY 角色在认识/引荐目标中亲和度高', () => {
      const goal = '我想认识更多人脉'
      const score = computeRelevanceScore(goal, mockContact)
      expect(score).toBeGreaterThan(0.4)
    })
  })

  describe('computeAccessibilityScore', () => {
    it('高能量值应该提高可达性', () => {
      const contact = { ...mockContact, energyScore: 90 }
      const score = computeAccessibilityScore(contact)
      expect(score).toBeGreaterThan(0.7)
    })

    it('HOT 温度应该增加可达性乘数', () => {
      const hotContact = { ...mockContact, temperature: 'HOT' as const }
      const warmContact = { ...mockContact, temperature: 'WARM' as const }
      const hotScore = computeAccessibilityScore(hotContact)
      const warmScore = computeAccessibilityScore(warmContact)
      expect(hotScore).toBeGreaterThan(warmScore)
    })

    it('衰减：长期未联系应该降低可达性', () => {
      const recentContact = {
        ...mockContact,
        lastContactedAt: new Date(), // 刚刚
      }
      const oldContact = {
        ...mockContact,
        lastContactedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6个月前
      }
      const recentScore = computeAccessibilityScore(recentContact)
      const oldScore = computeAccessibilityScore(oldContact)
      expect(recentScore).toBeGreaterThan(oldScore)
    })

    it('应该限制在 0-1 之间', () => {
      const score = computeAccessibilityScore(mockContact)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  describe('computeNetworkCentrality', () => {
    it('更多连接应该更高的中心度', () => {
      const relations: ContactRelation[] = [
        {
          id: '1',
          contactIdA: 'contact-1',
          contactIdB: 'contact-2',
          relationDesc: '前同事',
          createdAt: new Date(),
        },
        {
          id: '2',
          contactIdA: 'contact-1',
          contactIdB: 'contact-3',
          relationDesc: '朋友',
          createdAt: new Date(),
        },
        {
          id: '3',
          contactIdA: 'contact-2',
          contactIdB: 'contact-3',
          relationDesc: '陌生',
          createdAt: new Date(),
        },
      ]

      const centralScore = computeNetworkCentrality('contact-1', relations)
      const edgeScore = computeNetworkCentrality('contact-2', relations)

      expect(centralScore).toBeGreaterThan(edgeScore)
    })

    it('孤立节点应该得分为 0', () => {
      const relations: ContactRelation[] = []
      const score = computeNetworkCentrality('contact-1', relations)
      expect(score).toBe(0)
    })
  })

  describe('computeJourneyScore', () => {
    it('应该是加权组合', () => {
      const relevance = 0.8
      const accessibility = 0.9
      const centrality = 0.7

      const score = computeJourneyScore(relevance, accessibility, centrality)

      // 0.45*0.8 + 0.35*0.9 + 0.2*0.7 = 0.36 + 0.315 + 0.14 = 0.815
      expect(score).toBeCloseTo(0.815, 2)
    })

    it('应该在 0-1 之间', () => {
      const score = computeJourneyScore(0.5, 0.5, 0.5)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  describe('scoreAllContacts', () => {
    it('应该返回所有联系人的评分', () => {
      const contacts = [mockContact]
      const relations: ContactRelation[] = []
      const goal = '我想认识产品经理'

      const scored = scoreAllContacts(contacts, relations, goal)

      expect(scored).toHaveLength(1)
      expect(scored[0].id).toBe('contact-1')
      expect(scored[0].journeyScore).toBeGreaterThan(0)
      expect(scored[0].relevanceScore).toBeGreaterThan(0)
      expect(scored[0].accessibilityScore).toBeGreaterThan(0)
    })

    it('应该按 journeyScore 降序排列', () => {
      const contact1 = { ...mockContact, id: 'c1', relationRole: 'BIG_INVESTOR' as const }
      const contact2 = { ...mockContact, id: 'c2', relationRole: 'THERMOMETER' as const, energyScore: 30 }
      const contacts = [contact2, contact1]
      const relations: ContactRelation[] = []
      const goal = '我想融资'

      const scored = scoreAllContacts(contacts, relations, goal)
      const sorted = [...scored].sort((a, b) => b.journeyScore - a.journeyScore)

      expect(scored[0].id).toBe(sorted[0].id)
    })
  })
})
