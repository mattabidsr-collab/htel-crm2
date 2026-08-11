import { authenticator } from "otplib";
import QRCode from "qrcode";

import { decryptSecret, encryptSecret } from "@/lib/crypto";

const ISSUER = "Heritage CRM";

export function generateMfaSecret() {
  return authenticator.generateSecret();
}

export function encryptMfaSecret(secret: string) {
  return encryptSecret(secret);
}

export async function buildMfaEnrollmentQrCode(email: string, secret: string) {
  const otpauthUri = authenticator.keyuri(email, ISSUER, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);
  return { otpauthUri, qrCodeDataUrl };
}

export function verifyMfaToken(encryptedSecret: string, token: string): boolean {
  const secret = decryptSecret(encryptedSecret);
  return authenticator.check(token, secret);
}
