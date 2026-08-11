-- CreateEnum
CREATE TYPE "CallNoteSource" AS ENUM ('MANUAL', 'SKYSWITCH_CDR');

-- CreateEnum
CREATE TYPE "MailboxProvider" AS ENUM ('GOOGLE', 'MICROSOFT', 'MOCK');

-- CreateEnum
CREATE TYPE "MailboxStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "EmailAssociationStatus" AS ENUM ('PENDING', 'ASSOCIATED', 'AMBIGUOUS', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- DropForeignKey
ALTER TABLE "call_notes" DROP CONSTRAINT "call_notes_authorId_fkey";

-- AlterTable
ALTER TABLE "call_notes" ADD COLUMN     "didId" UUID,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "externalCallId" TEXT,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "CallNoteSource" NOT NULL DEFAULT 'MANUAL',
ALTER COLUMN "authorId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "mailboxes" (
    "id" UUID NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "provider" "MailboxProvider" NOT NULL,
    "status" "MailboxStatus" NOT NULL DEFAULT 'CONNECTED',
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "connectedByUserId" UUID,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mailboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_threads" (
    "id" UUID NOT NULL,
    "mailboxId" UUID NOT NULL,
    "providerThreadId" TEXT NOT NULL,
    "subject" TEXT,
    "organizationId" UUID,
    "associationStatus" "EmailAssociationStatus" NOT NULL DEFAULT 'PENDING',
    "associationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" UUID NOT NULL,
    "mailboxId" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "direction" "EmailDirection" NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ccAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT,
    "bodyText" TEXT,
    "bodyHtmlSanitized" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "contactId" UUID,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mailboxes_emailAddress_key" ON "mailboxes"("emailAddress");

-- CreateIndex
CREATE INDEX "email_threads_organizationId_idx" ON "email_threads"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "email_threads_mailboxId_providerThreadId_key" ON "email_threads"("mailboxId", "providerThreadId");

-- CreateIndex
CREATE INDEX "email_messages_threadId_idx" ON "email_messages"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_mailboxId_providerMessageId_key" ON "email_messages"("mailboxId", "providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "call_notes_externalCallId_key" ON "call_notes"("externalCallId");

-- AddForeignKey
ALTER TABLE "call_notes" ADD CONSTRAINT "call_notes_didId_fkey" FOREIGN KEY ("didId") REFERENCES "dids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_notes" ADD CONSTRAINT "call_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_connectedByUserId_fkey" FOREIGN KEY ("connectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

