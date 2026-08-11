-- AlterTable
ALTER TABLE "vision_ticket_projections" ADD COLUMN     "externalCustomerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "vision_ticket_projections_externalCustomerId_idx" ON "vision_ticket_projections"("externalCustomerId");

