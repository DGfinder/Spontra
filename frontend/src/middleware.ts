import { NextRequest, NextResponse } from 'next/server'

// Protect /api/admin routes with JWT verification
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/api/admin')) return NextResponse.next()

  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = auth.substring(7)
  const secret = process.env.ADMIN_JWT_SECRET || ''

  if (!secret) {
    // If no secret configured, allow in development but block in production
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Admin auth not configured' }, { status: 503 })
    }
    return NextResponse.next()
  }

  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) throw new Error('Malformed token')
    const enc = new TextEncoder()

    const data = `${header}.${payload}`
    const sig = base64UrlToUint8Array(signature)
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const ok = await crypto.subtle.verify('HMAC', key, sig as unknown as ArrayBuffer, enc.encode(data))
    if (!ok) throw new Error('Invalid signature')

    // Claims validation
    const json = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payload)))
    const now = Math.floor(Date.now() / 1000)
    if (json.exp && now >= json.exp) throw new Error('Token expired')
    if (json.nbf && now < json.nbf) throw new Error('Token not yet valid')
    const iss = process.env.ADMIN_JWT_ISSUER
    const aud = process.env.ADMIN_JWT_AUDIENCE
    if (iss && json.iss && json.iss !== iss) throw new Error('Invalid issuer')
    if (aud && json.aud && json.aud !== aud) throw new Error('Invalid audience')

    // Simple RBAC: admin required for cache management
    const roles: string[] = Array.isArray(json.roles) ? json.roles : (typeof json.role === 'string' ? [json.role] : [])
    const requiresAdmin = pathname.startsWith('/api/admin/cache')
    if (requiresAdmin && !roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.next({
      request: {
        headers: req.headers
      }
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64Url.length % 4)) % 4)
  const str = atob(base64)
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes
}

export const config = {
  matcher: ['/api/admin/:path*']
}
