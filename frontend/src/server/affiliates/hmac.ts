import crypto from "node:crypto";

export function verifyHmacBase64(raw: string, sigB64: string, secret: string): boolean {
  if (!secret || !sigB64) return false;
  
  try {
    const mac = crypto.createHmac("sha256", secret).update(raw).digest("base64");
    return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sigB64));
  } catch {
    return false;
  }
}

export function createHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}