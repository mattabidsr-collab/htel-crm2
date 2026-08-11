-- RenameEnumValue: SKYSWITCH_CDR -> CONNECTUC (preserves existing rows, unlike DROP+CREATE)
ALTER TYPE "CallNoteSource" RENAME VALUE 'SKYSWITCH_CDR' TO 'CONNECTUC';

-- AlterTable
ALTER TABLE "call_notes" ADD COLUMN     "terminatingCallId" TEXT,
ADD COLUMN     "transcriptSegments" JSONB,
ADD COLUMN     "transcriptSummary" TEXT,
ADD COLUMN     "transcriptText" TEXT;

-- CreateIndex
CREATE INDEX "call_notes_terminatingCallId_idx" ON "call_notes"("terminatingCallId");
