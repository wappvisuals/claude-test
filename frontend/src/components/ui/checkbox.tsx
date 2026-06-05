import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  /** Renders a dash instead of a check — for "some but not all selected". */
  indeterminate?: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Lightweight tri-state checkbox — no external dependency.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, indeterminate, onCheckedChange, disabled, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-gray-300 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          (checked || indeterminate) && 'border-primary bg-primary',
          className
        )}
        {...props}
      >
        {indeterminate ? (
          <Minus size={12} strokeWidth={3} />
        ) : checked ? (
          <Check size={12} strokeWidth={3} />
        ) : null}
      </button>
    )
  }
)
Checkbox.displayName = 'Checkbox'
