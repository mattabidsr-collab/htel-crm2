import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  buildMfaEnrollmentQrCode,
  encryptMfaSecret,
  generateMfaSecret,
  verifyMfaToken,
} from "@/modules/auth/mfa";

export async function startMfaEnrollment(userId: string, email: string) {
  const secret = generateMfaSecret();
  await db.user.update({
    where: { id: userId },
    data: { mfaSecretEncrypted: encryptMfaSecret(secret), mfaEnabled: false },
  });
  return buildMfaEnrollmentQrCode(email, secret);
}

export class MfaVerificationError extends Error {}

export async function confirmMfaEnrollment(userId: string, code: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.mfaSecretEncrypted || !verifyMfaToken(user.mfaSecretEncrypted, code)) {
    throw new MfaVerificationError("Invalid authenticator code");
  }

  await db.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
  await recordAuditEvent({
    actorId: userId,
    action: "auth.mfa_enrolled",
    entityType: "User",
    entityId: userId,
  });
}

export async function resetMfaForUser(actorId: string, targetUserId: string) {
  await db.user.update({
    where: { id: targetUserId },
    data: { mfaEnabled: false, mfaSecretEncrypted: null },
  });
  await recordAuditEvent({
    actorId,
    action: "auth.mfa_reset",
    entityType: "User",
    entityId: targetUserId,
  });
}
