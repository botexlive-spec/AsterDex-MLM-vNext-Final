import { useState, useEffect } from 'react';
import type { ImageLoadingState } from '../utils/imageOptimization';

interface UseImageLoadingProps {
  src: string;
  enabled?: boolean;
}

/**
 * Custom hook for managing image loading state
 */
export const useImageLoading = ({ src, enabled = true }: UseImageLoadingProps) => {
  const [loadingState, setLoadingState] = useState<ImageLoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !src) {
      setLoadingState('idle');
      return;
    }

    setLoadingState('loading');
    setError(null);

    const img = new Image();

    const handleLoad = () => {
      setLoadingState('loaded');
    };

    const handleError = () => {
      const err = new Error(`Failed to load image: ${src}`);
      setError(err);
      setLoadingState('error');
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = src;

    // Cleanup
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src, enabled]);

  return { loadingState, error };
};
