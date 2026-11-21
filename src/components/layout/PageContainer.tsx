import React from 'react';
import { cn } from '@/utils/cn';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'full',
  ...props
}) => {
  const maxW = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl mx-auto',
    '6xl': 'max-w-6xl mx-auto',
    '5xl': 'max-w-5xl mx-auto',
  };

  return (
    <div className={cn('space-y-2 sm:space-y-0 w-full', maxW[maxWidth], className)} {...props}>
      {children}
    </div>
  );
};
