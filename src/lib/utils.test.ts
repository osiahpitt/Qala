import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
  })

  it('should handle Tailwind class conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('should handle empty strings', () => {
    expect(cn('base', '', 'end')).toBe('base end')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['base', 'flex'], 'end')).toBe('base flex end')
  })
})