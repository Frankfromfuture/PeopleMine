-- CreateEnum
CREATE TYPE "CompanyScale" AS ENUM ('STARTUP', 'SME', 'MID', 'LARGE', 'LISTED');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "mainBusiness" TEXT,
    "website" TEXT,
    "scale" "CompanyScale",
    "industry" TEXT,
    "tags" TEXT,
    "founderName" TEXT,
    "founderContactId" TEXT,
    "investors" TEXT,
    "upstreams" TEXT,
    "downstreams" TEXT,
    "familiarityLevel" INTEGER,
    "temperature" "Temperature",
    "energyScore" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRelation" (
    "id" TEXT NOT NULL,
    "companyIdA" TEXT NOT NULL,
    "companyIdB" TEXT NOT NULL,
    "relationDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- CreateIndex
CREATE INDEX "Company_userId_scale_idx" ON "Company"("userId", "scale");

-- CreateIndex
CREATE INDEX "CompanyRelation_companyIdA_idx" ON "CompanyRelation"("companyIdA");

-- CreateIndex
CREATE INDEX "CompanyRelation_companyIdB_idx" ON "CompanyRelation"("companyIdB");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRelation_companyIdA_companyIdB_key" ON "CompanyRelation"("companyIdA", "companyIdB");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelation" ADD CONSTRAINT "CompanyRelation_companyIdA_fkey" FOREIGN KEY ("companyIdA") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRelation" ADD CONSTRAINT "CompanyRelation_companyIdB_fkey" FOREIGN KEY ("companyIdB") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
