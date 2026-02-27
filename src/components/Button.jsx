// src/components/Button.jsx
import { forwardRef } from 'react'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
  ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-soft hover:shadow-hover hover:-translate-y-0.5 active:translate-y-0 focus:ring-sky-400',
    secondary: 'bg-white hover:bg-sky-50 text-sky-600 border border-sky-200 hover:border-sky-400 hover:-translate-y-0.5 focus:ring-sky-400',
    ghost: 'text-sky-600 hover:bg-sky-50 focus:ring-sky-400',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-soft hover:-translate-y-0.5 focus:ring-rose-400',
    success: 'bg-sage-500 hover:bg-sage-600 text-white shadow-soft hover:-translate-y-0.5 focus:ring-sage-400',
  }

  const sizes = {
    sm: 'text-sm py-2 px-4',
    md: 'text-sm py-3 px-6',
    lg: 'text-base py-3.5 px-8',
    xl: 'text-lg py-4 px-10',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
