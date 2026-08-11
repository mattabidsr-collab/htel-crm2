import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { env } from "@/lib/env";

// Application-level encryption for sensitive fields that must live in the
// database but are not ordinary content (e.g. MFA secrets). Not a
// replacement for a secrets manager (nonfunctional requirements, security).
const key = scryptSync(env.APP_ENCRYPTION_KEY, "htel-crm-mfa", 32);

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((buf) => buf.toString("base64")).join(".");
}

export function decryptSecret(encoded: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(".");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
