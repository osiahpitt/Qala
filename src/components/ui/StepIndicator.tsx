interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function StepIndicator({ currentStep, totalSteps, className }: StepIndicatorProps) {
  return (
    <div className={`flex justify-center mb-8 ${className || ''}`}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`flex items-center ${step < totalSteps ? 'mr-4' : ''}`}
        >
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
              step <= currentStep
                ? 'bg-[var(--qala-gold)] border-[var(--qala-gold)] text-black'
                : 'border-gray-300 text-gray-400'
            }`}
          >
            {step}
          </div>
          {step < totalSteps && (
            <div
              className={`w-12 h-0.5 ml-4 transition-colors ${
                step < currentStep ? 'bg-[var(--qala-gold)]' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}