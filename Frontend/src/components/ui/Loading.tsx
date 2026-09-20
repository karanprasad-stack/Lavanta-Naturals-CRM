import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`inline-block rounded-full border-[#69C43F] border-r-transparent animate-spin ${sizeMap[size]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const LoadingPage: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string }> = ({
  size = 'lg',
  message = 'Loading workspace...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 gap-3">
      <Spinner size={size} />
      <span className="text-sm font-medium text-[#667085]">{message}</span>
    </div>
  );
};

export const Loading: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string }> = LoadingPage;
export default Loading;
