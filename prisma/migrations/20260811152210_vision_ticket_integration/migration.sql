-- CreateEnum
CREATE TYPE "VisionMappingStatus" AS ENUM ('MAPPED', 'UNMAPPED', 'IGNORED');

-- CreateTable
CREATE TABLE "vision_ticket_projections" (
    "id" UUID NOT NULL,
    "externalTicketId" TEXT NOT NULL,
    "externalUrl" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT,
    "category" TEXT,
    "requesterEmail" TEXT,
    "requesterName" TEXT,
    "technician" TEXT,
    "organizationId" UUID,
    "siteId" UUID,
    "contactId" UUID,
    "visionCreatedAt" TIMESTAMP(3),
    "visionUpdatedAt" TIMESTAMP(3),
    "visionResolvedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vision_ticket_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vision_identity_mappings" (
    "id" UUID NOT NULL,
    "externalCustomerId" TEXT NOT NULL,
    "externalCustomerName" TEXT,
    "organizationId" UUID,
    "status" "VisionMappingStatus" NOT NULL DEFAULT 'UNMAPPED',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vision_identity_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vision_ticket_projections_externalTicketId_key" ON "vision_ticket_projections"("externalTicketId");

-- CreateIndex
CREATE INDEX "vision_ticket_projections_organizationId_idx" ON "vision_ticket_projections"("organizationId");

-- CreateIndex
CREATE INDEX "vision_ticket_projections_isOpen_idx" ON "vision_ticket_projections"("isOpen");

-- CreateIndex
CREATE UNIQUE INDEX "vision_identity_mappings_externalCustomerId_key" ON "vision_identity_mappings"("externalCustomerId");

-- CreateIndex
CREATE INDEX "vision_identity_mappings_status_idx" ON "vision_identity_mappings"("status");

-- AddForeignKey
ALTER TABLE "vision_ticket_projections" ADD CONSTRAINT "vision_ticket_projections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vision_ticket_projections" ADD CONSTRAINT "vision_ticket_projections_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vision_ticket_projections" ADD CONSTRAINT "vision_ticket_projections_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vision_identity_mappings" ADD CONSTRAINT "vision_identity_mappings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

