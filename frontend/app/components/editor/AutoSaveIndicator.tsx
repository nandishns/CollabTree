import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'saved' | 'saving' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  className?: string;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center text-sm gap-1.5',
        {
          'text-gray-500': status === 'saving',
          'text-green-600': status === 'saved',
          'text-red-600': status === 'error',
        },
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <span>Error saving changes</span>
      )}
    </div>
  );
};

export default AutoSaveIndicator; 