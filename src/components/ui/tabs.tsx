'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'

const Tabs = TabsPrimitive.Root

function TabsList({ className = '', ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={`inline-flex h-10 items-center justify-center rounded-lg p-1 ${className}`}
      style={{ backgroundColor: 'var(--brand-muted-bg)', color: 'var(--brand-text-muted)' }}
      {...props}
    />
  )
}

function TabsTrigger({ className = '', ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all shadow-sm data-[state=active]:bg-brand-gold data-[state=active]:text-white data-[state=active]:border-brand-gold data-[state=active]:shadow-none ${className}`}
      style={{
        backgroundColor: 'var(--brand-bg-card)',
        color: 'var(--brand-text-muted)',
        borderColor: 'var(--brand-border)',
        borderWidth: '1px',
      }}
      {...props}
    />
  )
}

function TabsContent({ className = '', ...props }: TabsPrimitive.TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={`mt-4 outline-none ${className}`}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
