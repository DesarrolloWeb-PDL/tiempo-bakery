export const ADMIN_COOKIE = 'tbk_admin_auth'

const DEV_ADMIN_PASSWORD = 'admin123'

type CookieReader = {
  get(name: string): { value?: string } | undefined
}

export function getAdminPassword(): string | null {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim()

  if (configuredPassword) {
    return configuredPassword
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_ADMIN_PASSWORD
  }

  return null
}

export function isAdminAuthConfigured(): boolean {
  return getAdminPassword() !== null
}

export function hasAdminSession(cookies: CookieReader): boolean {
  const adminPassword = getAdminPassword()

  if (!adminPassword) {
    return false
  }

  return cookies.get(ADMIN_COOKIE)?.value === adminPassword
}

export function getAdminAuthConfigError(): string {
  return 'ADMIN_PASSWORD no está configurada en el entorno'
}