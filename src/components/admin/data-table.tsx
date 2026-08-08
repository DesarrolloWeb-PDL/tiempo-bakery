'use client'

import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  className?: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
}

function SkeletonRows({ count, colSpan }: { count: number; colSpan: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td colSpan={colSpan} className="px-5 py-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-700 rounded w-48" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay resultados',
  emptyIcon,
  rowKey,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-5 py-3 font-medium',
                    col.className,
                    col.sortable && 'cursor-pointer hover:text-white select-none'
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortBy === col.key && (
                      <span className="text-brand-gold">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <SkeletonRows count={5} colSpan={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    {emptyIcon}
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-700/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-3', col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
