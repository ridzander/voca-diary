import { cn } from '@/lib/utils'
import { HTMLAttributes, ButtonHTMLAttributes } from 'react'

/** Material You card — white surface, outline-variant border, xl radius */
export function VocaCard({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface-container-lowest border border-outline-variant rounded-xl p-4',
        'tap-response',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface VocaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error'
}

export function VocaButton({ variant = 'primary', className, children, ...props }: VocaButtonProps) {
  return (
    <button
      className={cn(
        'w-full h-12 rounded-xl font-headline font-semibold text-body-md transition-all duration-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-primary text-on-primary hover:opacity-90',
        variant === 'error'   && 'bg-error text-on-error hover:opacity-90',
        variant === 'secondary' && 'bg-surface-container text-on-surface hover:bg-surface-container-high',
        variant === 'ghost'   && 'bg-transparent text-on-surface-variant hover:bg-surface-container',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SeverityChip({ severity }: { severity: number | null }) {
  if (severity === null) return (
    <span className="px-2.5 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-label-sm">—</span>
  )
  const { bg, text } =
    severity <= 3 ? { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]' } :
    severity <= 6 ? { bg: 'bg-[#fef9c3]', text: 'text-[#713f12]' } :
    severity <= 8 ? { bg: 'bg-[#ffedd5]', text: 'text-[#7c2d12]' } :
                    { bg: 'bg-error-container', text: 'text-on-error-container' }
  return (
    <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold tabular-nums ${bg} ${text}`}>
      {severity}/10
    </span>
  )
}
