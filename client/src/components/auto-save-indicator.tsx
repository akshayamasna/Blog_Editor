import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'idle';
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
      
      if (status === 'saved') {
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (!visible || status === 'idle') {
    return null;
  }

  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <Cloud className="w-4 h-4" />;
      case 'error':
        return <CloudOff className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Auto-saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  };

  const getColorClass = () => {
    switch (status) {
      case 'saving':
        return 'text-yellow-500';
      case 'saved':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={`auto-save-indicator flex items-center space-x-2 ${getColorClass()}`}>
      {getIcon()}
      <span className="text-sm">{getText()}</span>
    </div>
  );
}
