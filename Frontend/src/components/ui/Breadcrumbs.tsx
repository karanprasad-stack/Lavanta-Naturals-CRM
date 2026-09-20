import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs text-[#667085] ${className}`}>
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-[#667085] hover:text-[#4FAF32] transition-colors"
      >
        <Home size={13} />
        <span>HQ</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={12} className="text-[#98A2B3]" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-[#667085] hover:text-[#4FAF32] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-[#172235] capitalize">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
