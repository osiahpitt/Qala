/**
 * MultiSelect Component - Multiple selection component for QALA
 * Used for selecting multiple target languages
 */

import * as React from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  maxSelections?: number
  disabled?: boolean
  className?: string
  error?: string
  label?: string
  required?: boolean
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({
    options,
    value,
    onChange,
    placeholder = 'Select options...',
    maxSelections,
    disabled = false,
    className,
    error,
    label,
    required,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleOptionToggle = (optionValue: string) => {
      if (disabled) return

      const isSelected = value.includes(optionValue)

      if (isSelected) {
        // Remove option
        onChange(value.filter(v => v !== optionValue))
      } else {
        // Add option if under max limit
        if (!maxSelections || value.length < maxSelections) {
          onChange([...value, optionValue])
        }
      }
    }

    const handleRemoveOption = (optionValue: string, event: React.MouseEvent) => {
      event.stopPropagation()
      onChange(value.filter(v => v !== optionValue))
    }

    const selectedOptions = options.filter(option => value.includes(option.value))
    const isMaxReached = maxSelections && value.length >= maxSelections

    return (
      <div className={cn('w-full', className)} ref={ref} {...props}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full justify-between text-left font-normal h-auto min-h-[2.5rem] p-3',
              error && 'border-destructive',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div className="flex flex-wrap gap-1">
              {selectedOptions.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedOptions.map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-md text-xs"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveOption(option.value, e)}
                      className="hover:bg-primary/80 rounded-sm p-0.5"
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </Button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {options.map(option => {
                const isSelected = value.includes(option.value)
                const isDisabled = option.disabled || disabled || (!isSelected && isMaxReached)

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionToggle(option.value)}
                    disabled={isDisabled}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors',
                      isSelected && 'bg-accent text-accent-foreground',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {maxSelections && (
          <p className="text-xs text-muted-foreground mt-1">
            {value.length}/{maxSelections} selected
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

MultiSelect.displayName = 'MultiSelect'

export { MultiSelect }