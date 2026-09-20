import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  actions,
  maxWidth = '1560px',
  className = ''
}) => {
  return (
    <div
      className={`page-container flex flex-col gap-6 w-full mx-auto ${className}`}
      style={{ maxWidth }}
    >
      {(title || actions) && (
        <div className="flex justify-between items-start flex-wrap gap-4 pb-2 border-b border-[#E5E8E3]">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-[#172235] tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-[#667085] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2.5">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
