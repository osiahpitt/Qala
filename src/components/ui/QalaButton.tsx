import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ButtonHTMLAttributes, forwardRef } from 'react'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface QalaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const QalaButton = forwardRef<HTMLButtonElement, QalaButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      primary: 'bg-[var(--qala-primary)] text-white hover:bg-[var(--qala-primary-dark)]',
      secondary: 'border border-[var(--qala-primary)] text-[var(--qala-primary)] hover:bg-[var(--qala-primary)] hover:text-white',
      gold: 'bg-[var(--qala-gold)] text-black hover:bg-[var(--qala-gold-dark)] border-none font-normal',
    }

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

QalaButton.displayName = 'QalaButton'

export { QalaButton }