'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useQueryCache - Cache Firestore queries in React state to avoid redundant calls
 * 
 * Benefits:
 * - Reduces redundant Firestore queries
 * - Faster component re-renders (state updates are instant)
 * - Better memory usage (store only what's needed)
 * - Works with optimistic updates
 */
export function useQueryCache<T>(
  queryKey: string[],
  fetchFn: () => Promise<T | null>,
  options?: {
    staleTime?: number; // ms before cache considered stale (default: 5 minutes)
    cacheTime?: number; // ms to keep cache after last use (default: 10 minutes)
    enabled?: boolean;
  }
) {
  const cacheRef = useRef<{
    data: T | null;
    timestamp: number;
    subscribers: Set<() => void>;
  } | null>(null);

  const staleTime = options?.staleTime ?? 5 * 60 * 1000; // 5 minutes
  const cacheTime = options?.cacheTime ?? 10 * 60 * 1000; // 10 minutes
  const enabled = options?.enabled !== false;

  // Generate cache key from array
  const cacheKey = queryKey.join(':');

  // Global cache storage (shared across component instances)
  const globalCache = useRef<Map<string, typeof cacheRef.current>>(new Map()).current;

  const isStale = useCallback(() => {
    const cached = globalCache.get(cacheKey);
    if (!cached) return true;
    return Date.now() - cached.timestamp > staleTime;
  }, [cacheKey, globalCache, staleTime]);

  const get = useCallback(async () => {
    const cached = globalCache.get(cacheKey);

    // Return fresh cache
    if (cached && !isStale()) {
      return cached.data;
    }

    // Fetch new data
    try {
      const data = await fetchFn();
      
      // Update global cache
      globalCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        subscribers: cached?.subscribers || new Set(),
      });

      // Notify all subscribers
      const current = globalCache.get(cacheKey);
      if (current) {
        current.subscribers.forEach(subscriber => subscriber());
      }

      return data;
    } catch (error) {
      console.error('Cache fetch error:', error);
      return cached?.data || null;
    }
  }, [cacheKey, globalCache, isStale, fetchFn]);

  const set = useCallback(
    (data: T) => {
      globalCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        subscribers: globalCache.get(cacheKey)?.subscribers || new Set(),
      });

      // Notify subscribers
      const cached = globalCache.get(cacheKey);
      if (cached) {
        cached.subscribers.forEach(subscriber => subscriber());
      }
    },
    [cacheKey, globalCache]
  );

  // Cleanup cache after cacheTime
  useEffect(() => {
    if (!enabled) return;

    const timeout = setTimeout(() => {
      const cached = globalCache.get(cacheKey);
      if (cached && cached.subscribers.size === 0) {
        globalCache.delete(cacheKey);
      }
    }, cacheTime);

    return () => clearTimeout(timeout);
  }, [cacheKey, cacheTime, enabled, globalCache]);

  return { get, set, isStale };
}

/**
 * useLazyImage - Lazy load images with intersection observer
 * 
 * Usage:
 * const { ref, src } = useLazyImage('https://example.com/image.jpg', 'placeholder.jpg')
 * <img ref={ref} src={src} />
 */
export function useLazyImage(imageSrc: string, placeholder?: string) {
  const ref = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState(placeholder || '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && ref.current) {
          ref.current.src = imageSrc;
          observer.unobserve(ref.current);
        }
      },
      { rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [imageSrc]);

  return { ref, src: src || imageSrc };
}

/**
 * useLazyVideo - Lazy load video player
 * 
 * Only initializes video player when visible to viewport
 */
export function useLazyVideo(videoSrc: string) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
}

/**
 * Preload resources for better performance
 */
export function usePreload(urls: string[]) {
  useEffect(() => {
    urls.forEach(url => {
      // Create link for preloading
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    });
  }, [urls]);
}
