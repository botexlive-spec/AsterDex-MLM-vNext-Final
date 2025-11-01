import React, { useState, useRef, useEffect } from 'react';
import { useImageLoading } from '../../hooks/useImageLoading';
import {
  generateBlurDataURL,
  generateSrcSet,
  generateSizes,
  calculateAspectRatio,
  lazyLoadOptions,
  type ImagePriority,
} from '../../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: ImagePriority;
  lazy?: boolean;
  showPlaceholder?: boolean;
  placeholderColor?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  // Responsive image options
  srcSet?: string;
  sizes?: string;
  // Additional HTML attributes
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder
 * - Responsive images support
 * - Loading and error states
 * - Accessibility
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  objectFit = 'cover',
  priority = 'auto',
  lazy = true,
  showPlaceholder = true,
  placeholderColor = '#334155',
  onLoad,
  onError,
  srcSet,
  sizes,
  loading = lazy ? 'lazy' : 'eager',
  decoding = 'async',
}) => {
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority === 'high');
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const { loadingState, error } = useImageLoading({
    src,
    enabled: shouldLoad,
  });

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority === 'high' || shouldLoad) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      });
    }, lazyLoadOptions);

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, priority, shouldLoad]);

  // Handle load event
  useEffect(() => {
    if (loadingState === 'loaded') {
      setImageLoaded(true);
      onLoad?.();
    }
  }, [loadingState, onLoad]);

  // Handle error event
  useEffect(() => {
    if (loadingState === 'error' && error) {
      onError?.(error);
    }
  }, [loadingState, error, onError]);

  // Calculate aspect ratio for maintaining layout
  const aspectRatio = width && height ? calculateAspectRatio(width, height) : undefined;

  // Generate blur placeholder
  const blurDataURL = showPlaceholder ? generateBlurDataURL(20, 20) : undefined;

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined,
        backgroundColor: placeholderColor,
      }}
    >
      {/* Blur Placeholder */}
      {showPlaceholder && !imageLoaded && shouldLoad && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Loading State */}
      {loadingState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#334155]/50">
          <svg
            className="animate-spin h-8 w-8 text-[#00C7D1]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Error State */}
      {loadingState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#334155]/80 text-[#ef4444] p-4">
          <svg
            className="w-12 h-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-center">Failed to load image</p>
        </div>
      )}

      {/* Actual Image */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          srcSet={srcSet}
          sizes={sizes}
          loading={loading}
          decoding={decoding}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit,
          }}
          onLoad={() => setImageLoaded(true)}
        />
      )}
    </div>
  );
};

/**
 * Avatar component using OptimizedImage
 */
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  };

  const [hasError, setHasError] = useState(false);

  // Show fallback if no src or error occurred
  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-[#334155] flex items-center justify-center text-[#f8fafc] font-medium ${className}`}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        objectFit="cover"
        priority="high"
        lazy={false}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

/**
 * Thumbnail component for image galleries
 */
interface ThumbnailProps {
  src: string;
  alt: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  src,
  alt,
  onClick,
  selected = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all hover:scale-105 ${
        selected ? 'ring-2 ring-[#00C7D1]' : 'ring-1 ring-[#475569]'
      } ${className}`}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        objectFit="cover"
        lazy={true}
        priority="low"
      />
    </button>
  );
};

/**
 * Hero Image component for banners and headers
 */
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
  children?: React.ReactNode;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  src,
  alt,
  className = '',
  overlay = true,
  children,
}) => {
  return (
    <div className={`relative w-full h-64 sm:h-80 md:h-96 overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        objectFit="cover"
        priority="high"
        lazy={false}
        className="w-full h-full"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20" />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
