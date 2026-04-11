-- CreateEnum
CREATE TYPE "NetworkingNeed" AS ENUM ('BUSINESS_EXPANSION', 'INTRODUCTIONS', 'FRIENDSHIP', 'SOCIAL', 'CASUAL_CHAT');

-- CreateEnum
CREATE TYPE "PersonalityType" AS ENUM ('INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', 'OTHER');

-- CreateEnum
CREATE TYPE "Tier1CompanySize" AS ENUM ('SOLO', 'MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Tier1CompanyStage" AS ENUM ('IDEA', 'EARLY', 'GROWTH', 'MATURE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Contact"
ADD COLUMN "fullName" TEXT,
ADD COLUMN "companyName" TEXT,
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "tier1CompanySize" "Tier1CompanySize",
ADD COLUMN "tier1CompanyStage" "Tier1CompanyStage",
ADD COLUMN "tier1CompanyWebsite" TEXT,
ADD COLUMN "tier1CompanyAiConfidence" DOUBLE PRECISION,
ADD COLUMN "tier1CompanyAiSource" TEXT,
ADD COLUMN "networkingNeeds" "NetworkingNeed"[] DEFAULT ARRAY[]::"NetworkingNeed"[],
ADD COLUMN "personalityType" "PersonalityType",
ADD COLUMN "personalityLabel" TEXT,
ADD COLUMN "chemistryScore" INTEGER,
ADD COLUMN "valueScore" INTEGER,
ADD COLUMN "valueReason" TEXT,
ADD COLUMN "noteSummary" TEXT,
ADD COLUMN "circles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "careTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "potentialProjects" TEXT[] DEFAULT ARRAY[]::TEXT[];
