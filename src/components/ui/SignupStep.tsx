import { ReactNode } from 'react'

interface SignupStepProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function SignupStep({ title, description, children, className }: SignupStepProps) {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-foreground-muted">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}