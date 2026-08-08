export {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  isAdminAuthConfigured,
  getAdminAuthConfigError,
  type CookieReader,
  type AdminSessionPayload,
} from '@/lib/admin-auth-core'

import { validateAdminSession } from '@/lib/admin-auth-core'

export async function hasAdminSessionEdge(cookies: import('@/lib/admin-auth-core').CookieReader): Promise<boolean> {
  return validateAdminSession(cookies)
}
