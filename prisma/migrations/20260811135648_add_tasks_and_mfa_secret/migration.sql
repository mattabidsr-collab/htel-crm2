/*
  Warnings:

  - You are about to drop the column `mfaSecretRef` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "mfaSecretRef",
ADD COLUMN     "mfaSecretEncrypted" TEXT;

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" UUID,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "ownerId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "dueDate" TIMESTAMP(3),
    "recurrenceRule" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_ownerId_status_dueDate_idx" ON "tasks"("ownerId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_organizationId_idx" ON "tasks"("organizationId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
