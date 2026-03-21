'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  color?: string | null
  className?: string
  size?: 'sm' | 'md'
}

export function Badge({ label, color, className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block font-semibold uppercase tracking-wider rounded',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1',
        className
      )}
      style={{
        backgroundColor: color ? `${color}20` : '#C0392B20',
        color: color ?? '#C0392B',
        border: `1px solid ${color ?? '#C0392B'}40`,
      }}
    >
      {label}
    </span>
  )
}
