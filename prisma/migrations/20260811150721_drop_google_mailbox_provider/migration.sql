-- AlterEnum
BEGIN;
CREATE TYPE "MailboxProvider_new" AS ENUM ('MICROSOFT', 'MOCK');
ALTER TABLE "mailboxes" ALTER COLUMN "provider" TYPE "MailboxProvider_new" USING ("provider"::text::"MailboxProvider_new");
ALTER TYPE "MailboxProvider" RENAME TO "MailboxProvider_old";
ALTER TYPE "MailboxProvider_new" RENAME TO "MailboxProvider";
DROP TYPE "public"."MailboxProvider_old";
COMMIT;

