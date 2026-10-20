import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'navy' | 'neutral' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'blue',
  size = 'md',
  icon,
  className,
  children,
  ...props
}) => {
  const baseStyles = 'badge-saas select-none'
  const variantStyles = {
    blue: 'badge-blue',
    navy: 'badge-navy',
    neutral: 'badge-neutral',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger'
  }[variant]

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5'
  }[size]

  return (
    <span
      className={twMerge(clsx(baseStyles, variantStyles, sizeStyles, className))}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
