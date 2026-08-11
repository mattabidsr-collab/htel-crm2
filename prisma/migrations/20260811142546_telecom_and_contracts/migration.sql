-- CreateEnum
CREATE TYPE "PlatformProvider" AS ENUM ('SKYSWITCH', 'NETSAPIENS', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('HOSTED_SEAT', 'CONVENIENCE_SEAT', 'FAX', 'CONTACT_CENTER', 'SMS', 'RABBITRUN', 'DIA', 'NUMBER_DID', 'HARDWARE', 'OTHER_RECURRING');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DidStatus" AS ENUM ('ACTIVE', 'PORT_PENDING', 'RESERVED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('NOT_ENABLED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "E911Status" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "PortStatus" AS ENUM ('NONE', 'REQUESTED', 'FOC_RECEIVED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TenDlcStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PortProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('MSA', 'SOW', 'AMENDMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED');

-- CreateEnum
CREATE TYPE "RenewalDisposition" AS ENUM ('PENDING', 'RENEWED', 'EXPANDED', 'DOWNSIZED', 'CHURNED', 'MONTH_TO_MONTH');

-- CreateTable
CREATE TABLE "platform_accounts" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "provider" "PlatformProvider" NOT NULL,
    "providerAccountId" TEXT,
    "subAccountId" TEXT,
    "resellerId" TEXT,
    "netsapiensDomain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "siteId" UUID,
    "platformAccountId" UUID,
    "type" "ServiceType" NOT NULL,
    "tier" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'PENDING',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "unitCost" DECIMAL(12,2),
    "vendor" TEXT,
    "vendorSku" TEXT,
    "activationDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dids" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "serviceId" UUID,
    "tenDlcCampaignId" UUID,
    "provider" TEXT,
    "status" "DidStatus" NOT NULL DEFAULT 'ACTIVE',
    "smsStatus" "SmsStatus" NOT NULL DEFAULT 'NOT_ENABLED',
    "e911Status" "E911Status" NOT NULL DEFAULT 'NOT_REQUIRED',
    "portStatus" "PortStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e911_registrations" (
    "id" UUID NOT NULL,
    "didId" UUID NOT NULL,
    "dispatchableAddressLine1" TEXT,
    "dispatchableAddressLine2" TEXT,
    "dispatchableCity" TEXT,
    "dispatchableState" TEXT,
    "dispatchablePostalCode" TEXT,
    "providerReference" TEXT,
    "status" "E911Status" NOT NULL DEFAULT 'PENDING',
    "lastVerifiedDate" TIMESTAMP(3),
    "exceptionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "e911_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ten_dlc_brands" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "providerBrandId" TEXT,
    "legalName" TEXT,
    "status" "TenDlcStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ten_dlc_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ten_dlc_campaigns" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "providerCampaignId" TEXT,
    "useCase" TEXT,
    "status" "TenDlcStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "reviewDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ten_dlc_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_projects" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "losingCarrier" TEXT,
    "status" "PortProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedDate" TIMESTAMP(3),
    "focDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "documentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "port_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_items" (
    "id" UUID NOT NULL,
    "portProjectId" UUID NOT NULL,
    "didNumber" TEXT NOT NULL,
    "didId" UUID,
    "status" "PortProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "port_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" "ContractType" NOT NULL DEFAULT 'MSA',
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signedDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "termMonths" INTEGER,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "noticeDays" INTEGER NOT NULL DEFAULT 60,
    "documentKey" TEXT,
    "ownerId" UUID,
    "renewalDisposition" "RenewalDisposition" NOT NULL DEFAULT 'PENDING',
    "renewalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrr_snapshots" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "mrr" DECIMAL(12,2) NOT NULL,
    "activeServices" INTEGER NOT NULL,
    "activeSeats" INTEGER NOT NULL,
    "activeDids" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mrr_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_accounts_organizationId_idx" ON "platform_accounts"("organizationId");

-- CreateIndex
CREATE INDEX "services_organizationId_idx" ON "services"("organizationId");

-- CreateIndex
CREATE INDEX "services_siteId_idx" ON "services"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "dids_number_key" ON "dids"("number");

-- CreateIndex
CREATE INDEX "dids_organizationId_idx" ON "dids"("organizationId");

-- CreateIndex
CREATE INDEX "e911_registrations_didId_idx" ON "e911_registrations"("didId");

-- CreateIndex
CREATE INDEX "ten_dlc_brands_organizationId_idx" ON "ten_dlc_brands"("organizationId");

-- CreateIndex
CREATE INDEX "ten_dlc_campaigns_brandId_idx" ON "ten_dlc_campaigns"("brandId");

-- CreateIndex
CREATE INDEX "port_projects_organizationId_idx" ON "port_projects"("organizationId");

-- CreateIndex
CREATE INDEX "port_items_portProjectId_idx" ON "port_items"("portProjectId");

-- CreateIndex
CREATE INDEX "contracts_organizationId_idx" ON "contracts"("organizationId");

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- CreateIndex
CREATE INDEX "mrr_snapshots_organizationId_periodEnd_idx" ON "mrr_snapshots"("organizationId", "periodEnd");

-- AddForeignKey
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "platform_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dids" ADD CONSTRAINT "dids_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dids" ADD CONSTRAINT "dids_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dids" ADD CONSTRAINT "dids_tenDlcCampaignId_fkey" FOREIGN KEY ("tenDlcCampaignId") REFERENCES "ten_dlc_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "e911_registrations" ADD CONSTRAINT "e911_registrations_didId_fkey" FOREIGN KEY ("didId") REFERENCES "dids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ten_dlc_brands" ADD CONSTRAINT "ten_dlc_brands_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ten_dlc_campaigns" ADD CONSTRAINT "ten_dlc_campaigns_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ten_dlc_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_projects" ADD CONSTRAINT "port_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_items" ADD CONSTRAINT "port_items_portProjectId_fkey" FOREIGN KEY ("portProjectId") REFERENCES "port_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_items" ADD CONSTRAINT "port_items_didId_fkey" FOREIGN KEY ("didId") REFERENCES "dids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrr_snapshots" ADD CONSTRAINT "mrr_snapshots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
