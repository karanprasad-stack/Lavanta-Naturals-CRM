import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  rows = 3,
  id,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-[#172235]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full p-3 text-sm bg-white border rounded-lg transition-all
          ${error
            ? 'border-[#D65B5B] focus:border-[#D65B5B] focus:ring-2 focus:ring-[#D65B5B]/20'
            : 'border-[#E5E8E3] text-[#172235] focus:border-[#69C43F] focus:ring-2 focus:ring-[#69C43F]/20'
          }
          placeholder:text-[#98A2B3] outline-none ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#D65B5B]">{error}</span>}
      {helperText && !error && <span className="text-xs text-[#667085]">{helperText}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
