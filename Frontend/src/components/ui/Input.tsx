import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#172235]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[#98A2B3] pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full py-2 text-sm bg-white border rounded-lg transition-all
            ${leftIcon ? 'pl-9' : 'pl-3'}
            ${rightIcon ? 'pr-9' : 'pr-3'}
            ${error
              ? 'border-[#D65B5B] focus:border-[#D65B5B] focus:ring-2 focus:ring-[#D65B5B]/20'
              : 'border-[#E5E8E3] text-[#172235] focus:border-[#69C43F] focus:ring-2 focus:ring-[#69C43F]/20'
            }
            placeholder:text-[#98A2B3] outline-none ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-[#98A2B3] pointer-events-none flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-[#D65B5B]">{error}</span>}
      {helperText && !error && <span className="text-xs text-[#667085]">{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';
