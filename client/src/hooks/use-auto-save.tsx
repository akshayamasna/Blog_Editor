import { useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
  debounceMs?: number;
  intervalMs?: number;
}

export function useAutoSave(
  data: { title: string; content: string; tags: string[] },
  blogId: string | null,
  options: AutoSaveOptions = {}
) {
  const {
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    debounceMs = 5000,
    intervalMs = 30000
  } = options;

  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');

  const saveData = useCallback(async () => {
    const currentData = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentData === lastSavedDataRef.current) {
      return;
    }

    // Don't auto-save if title or content is empty
    if (!data.title.trim() || !data.content.trim()) {
      return;
    }

    try {
      onSaveStart?.();
      
      if (blogId) {
        await api.updateBlog(blogId, data);
      } else {
        await api.saveDraft(data.title, data.content, data.tags);
      }
      
      lastSavedDataRef.current = currentData;
      onSaveSuccess?.();
      
      toast({
        title: "Auto-saved",
        description: "Your changes have been saved automatically",
        duration: 2000,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      onSaveError?.(message);
      
      toast({
        title: "Auto-save failed",
        description: message,
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [data, blogId, onSaveStart, onSaveSuccess, onSaveError, toast]);

  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      saveData();
    }, debounceMs);
  }, [saveData, debounceMs]);

  // Trigger debounced save when data changes
  useEffect(() => {
    debouncedSave();
  }, [data.title, data.content, data.tags, debouncedSave]);

  // Set up interval for periodic saves
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      saveData();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [saveData, intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    saveNow: saveData,
    cancelAutoSave: () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }
  };
}
