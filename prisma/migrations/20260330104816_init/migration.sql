-- CreateEnum
CREATE TYPE "SpiritAnimal" AS ENUM ('LION', 'FOX', 'BEAR', 'CHAMELEON', 'EAGLE', 'DOLPHIN', 'OWL', 'SKUNK');

-- CreateEnum
CREATE TYPE "RelationRole" AS ENUM ('BIG_INVESTOR', 'GATEWAY', 'ADVISOR', 'THERMOMETER', 'LIGHTHOUSE', 'COMRADE');

-- CreateEnum
CREATE TYPE "Temperature" AS ENUM ('COLD', 'WARM', 'HOT');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('MEETING', 'CALL', 'EMAIL', 'MESSAGE', 'EVENT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "industry" TEXT,
    "role" TEXT,
    "goal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "wechat" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "spiritAnimal" "SpiritAnimal",
    "relationRole" "RelationRole" NOT NULL,
    "tags" TEXT[],
    "industry" TEXT,
    "company" TEXT,
    "title" TEXT,
    "trustLevel" INTEGER,
    "temperature" "Temperature",
    "energyScore" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "lastContactedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRelation" (
    "id" TEXT NOT NULL,
    "contactIdA" TEXT NOT NULL,
    "contactIdB" TEXT NOT NULL,
    "relationDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "aiAnalysis" TEXT,
    "pathData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_idx" ON "PhoneOtp"("phone");

-- CreateIndex
CREATE INDEX "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE INDEX "Contact_userId_relationRole_idx" ON "Contact"("userId", "relationRole");

-- CreateIndex
CREATE INDEX "Contact_userId_spiritAnimal_idx" ON "Contact"("userId", "spiritAnimal");

-- CreateIndex
CREATE INDEX "ContactRelation_contactIdA_idx" ON "ContactRelation"("contactIdA");

-- CreateIndex
CREATE INDEX "ContactRelation_contactIdB_idx" ON "ContactRelation"("contactIdB");

-- CreateIndex
CREATE UNIQUE INDEX "ContactRelation_contactIdA_contactIdB_key" ON "ContactRelation"("contactIdA", "contactIdB");

-- CreateIndex
CREATE INDEX "Interaction_contactId_idx" ON "Interaction"("contactId");

-- CreateIndex
CREATE INDEX "Interaction_date_idx" ON "Interaction"("date");

-- CreateIndex
CREATE INDEX "Journey_userId_idx" ON "Journey"("userId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelation" ADD CONSTRAINT "ContactRelation_contactIdA_fkey" FOREIGN KEY ("contactIdA") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRelation" ADD CONSTRAINT "ContactRelation_contactIdB_fkey" FOREIGN KEY ("contactIdB") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
