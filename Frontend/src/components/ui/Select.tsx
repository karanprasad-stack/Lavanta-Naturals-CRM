import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options = [],
  children,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[#172235]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full py-2 pl-3 pr-8 text-sm bg-white border rounded-lg appearance-none transition-all
            ${error
              ? 'border-[#D65B5B] focus:border-[#D65B5B] focus:ring-2 focus:ring-[#D65B5B]/20'
              : 'border-[#E5E8E3] text-[#172235] focus:border-[#69C43F] focus:ring-2 focus:ring-[#69C43F]/20'
            }
            outline-none cursor-pointer ${className}`}
          {...props}
        >
          {children || options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 text-[#98A2B3] pointer-events-none flex items-center">
          <ChevronDown size={14} />
        </span>
      </div>
      {error && <span className="text-xs text-[#D65B5B]">{error}</span>}
      {helperText && !error && <span className="text-xs text-[#667085]">{helperText}</span>}
    </div>
  );
});

Select.displayName = 'Select';
