import { describe, it, expect } from '@jest/globals'
import {
  computeRelevanceScore,
  computeAccessibilityScore,
  computeNetworkCentrality,
  computeJourneyScore,
  scoreAllContacts,
} from './scoring'
import { Contact, ContactRelation } from '@prisma/client'

describe('航程评分引擎（ARC）', () => {
  const mockContact: Contact = {
    id: 'contact-1',
    userId: 'user-1',
    name: '张三',
    fullName: null,
    gender: null,
    age: null,
    firstMetYear: null,
    personalRelation: null,
    reciprocityLevel: null,
    friendLinks: [],
    wechat: null,
    phone: null,
    email: null,
    companyAddress: null,
    personalAddress: null,
    spiritAnimal: null,
    roleArchetype: 'EVANGELIST',
    relationRole: null,
    tags: JSON.stringify(['互联网', '产品', '投资']),
    tagV2: null,
    industry: 'tech',
    industryL1: null,
    industryL2: null,
    company: 'Bytedance',
    companyId: null,
    companyName: null,
    companyProfile: null,
    companyScale: null,
    title: 'PM',
    jobTitle: null,
    jobPosition: null,
    jobFunction: null,
    influence: null,
    networkingNeeds: [],
    chemistryScore: null,
    valueScore: null,
    potentialProjects: null,
    socialPosition: null,
    hobbies: null,
    personalNotes: null,
    personalityType: null,
    personalityLabel: null,
    valueReason: null,
    noteSummary: null,
    circles: [],
    interests: [],
    careTopics: [],
    potentialProjectsArray: [],
    tier1CompanySize: null,
    tier1CompanyStage: null,
    tier1CompanyWebsite: null,
    tier1CompanyAiConfidence: null,
    tier1CompanyAiSource: null,
    trustLevel: 4,
    temperature: 'WARM',
    energyScore: 85,
    quickContext: null,
    relationVector: null,
    archetype: null,
    notes: '产品很厉害的人',
    lastContactedAt: new Date('2026-03-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('computeRelevanceScore', () => {
    it('应该匹配相关关键词', () => {
      const goal = '我想认识互联网产品经理'
      const score = computeRelevanceScore(goal, mockContact)
      expect(score).toBeGreaterThan(0.4)
    })

    it('不相关目标得分应更低', () => {
      const a = computeRelevanceScore('我想认识互联网产品经理', mockContact)
      const b = computeRelevanceScore('我想学医学知识', mockContact)
      expect(a).toBeGreaterThan(b)
    })
  })

  describe('computeAccessibilityScore', () => {
    it('高能量值应提高可达性', () => {
      const contact = { ...mockContact, energyScore: 90 }
      const score = computeAccessibilityScore(contact)
      expect(score).toBeGreaterThan(0.6)
    })

    it('HOT 温度可达性应高于 WARM', () => {
      const hotContact = { ...mockContact, temperature: 'HOT' as const }
      const warmContact = { ...mockContact, temperature: 'WARM' as const }
      const hotScore = computeAccessibilityScore(hotContact)
      const warmScore = computeAccessibilityScore(warmContact)
      expect(hotScore).toBeGreaterThan(warmScore)
    })
  })

  describe('computeNetworkCentrality', () => {
    it('应返回 0-1 范围', () => {
      const relations: ContactRelation[] = [
        { id: '1', contactIdA: 'contact-1', contactIdB: 'contact-2', relationDesc: null, createdAt: new Date() },
        { id: '2', contactIdA: 'contact-2', contactIdB: 'contact-3', relationDesc: null, createdAt: new Date() },
      ]
      const score = computeNetworkCentrality('contact-1', relations)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  describe('computeJourneyScore', () => {
    it('应综合 ARC + 其他分数', () => {
      const score = computeJourneyScore(0.8, 0.7, 0.9, 0.6)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  describe('scoreAllContacts', () => {
    it('应返回包含 arcScore 的评分结果', () => {
      const contacts = [
        {
          ...mockContact,
          relationVector: {
            trust: 78,
            powerDelta: 15,
            goalAlignment: 81,
            emotionalVolatility: 26,
            reciprocity: 73,
            boundaryStability: 69,
            confidence: 0.8,
            updatedAt: new Date().toISOString(),
          },
        },
      ]
      const relations: ContactRelation[] = []
      const goal = '我想推进合作'

      const scored = scoreAllContacts(contacts, relations, goal)
      expect(scored).toHaveLength(1)
      expect(scored[0].arcScore).toBeGreaterThan(0)
      expect(scored[0].journeyScore).toBeGreaterThan(0)
    })
  })
})
