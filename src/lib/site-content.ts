import { prisma as db } from '@/lib/db'
import { DEFAULT_SITE_CONTENT, SITE_CONTENT_KEYS, type SiteContent } from '@/lib/site-content.shared'

export { DEFAULT_SITE_CONTENT, SITE_CONTENT_KEYS }
export type { SiteContent }

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const rows = await db.siteConfig.findMany({
      where: {
        key: {
          in: SITE_CONTENT_KEYS.map((key) => `content_${key}`),
        },
      },
    })

    const content: Partial<SiteContent> = {}

    rows.forEach((row) => {
      const key = row.key.replace('content_', '') as keyof SiteContent
      content[key] = row.value
    })

    return {
      ...DEFAULT_SITE_CONTENT,
      ...content,
    }
  } catch (error) {
    console.error('Error fetching site content:', error)
    return DEFAULT_SITE_CONTENT
  }
}

export function getSiteContentKeys(): Array<keyof SiteContent> {
  return SITE_CONTENT_KEYS
}