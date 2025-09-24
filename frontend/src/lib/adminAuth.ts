import { NextRequest } from 'next/server'

export const ADMIN_ROLES = ['owner', 'admin', 'curator', 'analyst', 'support'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export interface AdminRequestContext {
  role: AdminRole
  userId?: string
  email?: string
}

export class AdminAuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AdminAuthError'
    this.status = status
  }
}

const ROLE_HEADER_KEYS = ['x-spontra-admin-role', 'x-admin-role', 'x-role']
const USER_HEADER_KEYS = ['x-spontra-admin-user', 'x-admin-user', 'x-user-id']
const EMAIL_HEADER_KEYS = ['x-spontra-admin-email', 'x-admin-email']

function parseRole(value: string | null): AdminRole | null {
  if (!value) return null
  const normalised = value.trim().toLowerCase()
  return ADMIN_ROLES.find((role) => role === normalised) ?? null
}

export function requireAdminContext(request: NextRequest, allowedRoles: AdminRole[]): AdminRequestContext {
  let role: AdminRole | null = null

  for (const header of ROLE_HEADER_KEYS) {
    role = parseRole(request.headers.get(header))
    if (role) break
  }

  if (!role) {
    throw new AdminAuthError('Missing admin role header', 401)
  }

  if (!allowedRoles.includes(role)) {
    throw new AdminAuthError('Forbidden for this admin role', 403)
  }

  const userId = USER_HEADER_KEYS.map((header) => request.headers.get(header)).find(Boolean) ?? undefined
  const email = EMAIL_HEADER_KEYS.map((header) => request.headers.get(header)).find(Boolean) ?? undefined

  return { role, userId, email }
}
