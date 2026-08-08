'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AdminPageShellProps {
  title: string
  description?: string
  backHref?: string
  loading?: boolean
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function AdminPageShell({
  title,
  description,
  backHref,
  loading = false,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {description && (
              <p className="text-sm text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 border border-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
