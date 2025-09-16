/**
 * Form Components - Form handling components built with React Hook Form
 * Provides form context and field components for QALA forms
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  // This interface extends FormHTMLAttributes to provide type safety
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return (
      <form
        className={cn('space-y-6', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Form.displayName = 'Form'

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div
        className={cn('space-y-2', className)}
        ref={ref}
        {...props}
      >
        {children}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        className={cn(
          'block text-sm font-medium text-foreground',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    )
  }
)

FormLabel.displayName = 'FormLabel'

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  // This interface extends HTMLAttributes to provide type safety for form descriptions
}

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        className={cn('text-sm text-muted-foreground', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

FormDescription.displayName = 'FormDescription'

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  type?: 'error' | 'success' | 'info'
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, type = 'error', ...props }, ref) => {
    const typeStyles = {
      error: 'text-destructive',
      success: 'text-green-600',
      info: 'text-blue-600',
    }

    return (
      <p
        className={cn('text-sm', typeStyles[type], className)}
        ref={ref}
        role={type === 'error' ? 'alert' : undefined}
        {...props}
      />
    )
  }
)

FormMessage.displayName = 'FormMessage'

export { Form, FormField, FormLabel, FormDescription, FormMessage }