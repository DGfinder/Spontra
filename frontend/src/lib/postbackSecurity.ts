import crypto from 'node:crypto';

export const IMPACT_IPS = [
  '44.232.244.0/24',
  '52.25.130.0/24', 
  '54.203.0.0/16',
  '162.13.216.0/24'
];

export const CJ_IPS = [
  '205.201.131.0/24',
  '205.201.137.0/24',
  '66.211.169.0/24'
];

/**
 * Verify HMAC signature with constant-time comparison
 */
export function verifyHmac(payload: string, signatureB64: string, secret: string): boolean {
  if (!secret || !signatureB64) return false;
  
  try {
    const mac = crypto.createHmac('sha256', secret).update(payload).digest('base64');
    return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(signatureB64));
  } catch {
    return false;
  }
}

/**
 * Check if IP is in allowed CIDR ranges
 */
export function isIpInRanges(clientIp: string, allowedRanges: string[]): boolean {
  if (!clientIp) return false;
  
  // Simple CIDR check - in production use a proper IP library
  for (const range of allowedRanges) {
    if (range.includes('/')) {
      const [network, prefixLen] = range.split('/');
      const prefix = parseInt(prefixLen, 10);
      
      // Basic implementation - use 'ip' or 'cidr-matcher' library for production
      const networkParts = network.split('.').map(Number);
      const clientParts = clientIp.split('.').map(Number);
      
      if (networkParts.length === 4 && clientParts.length === 4) {
        // Simplified /24 check for most common ranges
        if (prefix >= 24) {
          const match = networkParts.slice(0, 3).every((part, i) => part === clientParts[i]);
          if (match) return true;
        }
      }
    } else if (clientIp === range) {
      return true;
    }
  }
  
  return false;
}

/**
 * Impact Radius signature verification
 * Header: X-Impact-Signature: sha256=base64_signature
 */
export function verifyImpactSignature(
  queryString: string, 
  signature: string | null, 
  secret: string
): boolean {
  if (!signature || !signature.startsWith('sha256=')) return false;
  
  const signatureB64 = signature.substring(7); // Remove 'sha256=' prefix
  return verifyHmac(queryString, signatureB64, secret);
}

/**
 * Commission Junction verification
 * Uses query parameter validation and optional signature
 */
export function verifyCjRequest(
  params: URLSearchParams,
  expectedAdvertisers: string[],
  signature?: string,
  secret?: string
): boolean {
  const cid = params.get('cid');
  const actionId = params.get('actionId');
  const sid = params.get('sid');
  
  // Basic validation
  if (!cid || !actionId || !sid) return false;
  if (!expectedAdvertisers.includes(cid)) return false;
  
  // Optional signature verification
  if (signature && secret) {
    const payload = params.toString();
    return verifyHmac(payload, signature, secret);
  }
  
  return true;
}

/**
 * Rate limiting for postback endpoints
 */
const postbackAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkPostbackRateLimit(
  identifier: string, 
  maxAttempts: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const key = `postback:${identifier}`;
  const current = postbackAttempts.get(key);
  
  if (!current || now > current.resetTime) {
    postbackAttempts.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (current.count >= maxAttempts) {
    return { 
      allowed: false, 
      remainingMs: current.resetTime - now 
    };
  }
  
  current.count++;
  return { allowed: true };
}