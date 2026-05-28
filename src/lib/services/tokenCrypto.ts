import crypto from "crypto";

const algorithm = "aes-256-gcm";

function getKey(): Buffer | null {
  const secret = process.env.TOKEN_ENCRYPTION_SECRET;
  if (!secret) return null;
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string): string {
  const key = getKey();
  if (!key) {
    // TODO: Require TOKEN_ENCRYPTION_SECRET before production deployments.
    return `plain:${token}`;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptToken(value: string): string {
  if (value.startsWith("plain:")) return value.slice(6);
  if (!value.startsWith("enc:")) return value;
  const key = getKey();
  if (!key) throw new Error("TOKEN_ENCRYPTION_SECRET is required to decrypt tokens.");
  const [, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final()
  ]).toString("utf8");
}
