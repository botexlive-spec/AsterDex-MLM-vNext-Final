// Image Optimization Utilities

/**
 * Generates a blur placeholder data URL for an image
 * This creates a tiny blurred version for initial load
 */
export const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  // Create a simple SVG blur placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <filter id="blur">
        <feGaussianBlur stdDeviation="2"/>
      </filter>
      <rect width="100%" height="100%" fill="#334155" filter="url(#blur)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Generates srcset string for responsive images
 * @param basePath - Base path of the image (without size suffix)
 * @param sizes - Array of image widths available
 * @param extension - Image file extension
 */
export const generateSrcSet = (
  basePath: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1536],
  extension: string = 'jpg'
): string => {
  return sizes
    .map((size) => `${basePath}-${size}w.${extension} ${size}w`)
    .join(', ');
};

/**
 * Generates sizes attribute for responsive images
 * @param breakpoints - Object mapping breakpoints to sizes
 */
export const generateSizes = (
  breakpoints: Record<string, string> = {
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
  }
): string => {
  const entries = Object.entries(breakpoints);
  const sizesArray = entries.map(([breakpoint, size], index) => {
    if (index === entries.length - 1) {
      return size; // Last one is the default
    }
    const breakpointPx = breakpoint === 'sm' ? 640 : breakpoint === 'md' ? 768 : 1024;
    return `(max-width: ${breakpointPx}px) ${size}`;
  });
  return sizesArray.join(', ');
};

/**
 * Calculates the aspect ratio of an image
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return (height / width) * 100;
};

/**
 * Image loading priorities
 */
export type ImagePriority = 'high' | 'low' | 'auto';

/**
 * Image format options
 */
export type ImageFormat = 'webp' | 'avif' | 'jpg' | 'png';

/**
 * Checks if browser supports a specific image format
 */
export const supportsImageFormat = (format: ImageFormat): boolean => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  // Check format support
  switch (format) {
    case 'webp':
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    case 'avif':
      // AVIF support detection is more complex, simplified here
      return false; // Conservative approach
    default:
      return true;
  }
};

/**
 * Gets the optimal image format based on browser support
 */
export const getOptimalFormat = (formats: ImageFormat[] = ['webp', 'jpg']): ImageFormat => {
  for (const format of formats) {
    if (supportsImageFormat(format)) {
      return format;
    }
  }
  return 'jpg'; // Fallback
};

/**
 * Preloads an image
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Lazy load observer options
 */
export const lazyLoadOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '50px', // Start loading 50px before image enters viewport
  threshold: 0.01,
};

/**
 * Compresses image quality based on network speed
 */
export const getImageQuality = (): number => {
  if (typeof navigator === 'undefined') return 80;

  // @ts-ignore - effectiveType may not be available in all browsers
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return 80;

  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 50; // Lower quality for slow connections
    case '3g':
      return 70;
    case '4g':
    default:
      return 85; // High quality for fast connections
  }
};

/**
 * Creates a thumbnail version of an image path
 */
export const getThumbnailPath = (imagePath: string, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  const sizeMap = {
    small: 150,
    medium: 300,
    large: 600,
  };

  const lastDot = imagePath.lastIndexOf('.');
  if (lastDot === -1) return imagePath;

  const pathWithoutExt = imagePath.substring(0, lastDot);
  const extension = imagePath.substring(lastDot);

  return `${pathWithoutExt}-thumb-${sizeMap[size]}${extension}`;
};

/**
 * Image loading state types
 */
export type ImageLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Hook return type for image loading
 */
export interface UseImageLoadingReturn {
  loadingState: ImageLoadingState;
  error: Error | null;
}
