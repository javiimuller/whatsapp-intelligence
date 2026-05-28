import crypto from "crypto";

export function hashCustomerIdentifier(identifier: string): string {
  return crypto
    .createHash("sha256")
    .update(`${identifier}:${process.env.NEXTAUTH_SECRET ?? "dev-secret"}`)
    .digest("hex")
    .slice(0, 12);
}

export function customerLabel(identifier: string): string {
  const hash = hashCustomerIdentifier(identifier);
  const number = parseInt(hash.slice(0, 6), 16) % 999;
  return `Cliente #${String(number + 1).padStart(3, "0")}`;
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export function removeSensitiveText(text: string): string {
  return text
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[telefono_anonimizado]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email_anonimizado]");
}
