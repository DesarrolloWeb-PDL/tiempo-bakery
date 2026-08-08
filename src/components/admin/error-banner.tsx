'use client'

import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export default function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  className,
}: ErrorBannerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm',
        className
      )}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      <div className="flex items-center gap-1 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 rounded hover:bg-red-900/50 transition-colors"
            title="Reintentar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-red-900/50 transition-colors"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
