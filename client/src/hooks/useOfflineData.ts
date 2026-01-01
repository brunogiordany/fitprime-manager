import { useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { setCache, getCache, CACHE_KEYS } from '@/lib/offlineCache';

type CacheKey = keyof typeof CACHE_KEYS;

interface UseOfflineDataOptions<T> {
  cacheKey: CacheKey;
  data: T | undefined;
  isLoading: boolean;
  enabled?: boolean;
}

interface UseOfflineDataResult<T> {
  data: T | undefined;
  isFromCache: boolean;
  isStale: boolean;
}

/**
 * Hook para gerenciar dados com suporte offline
 * Automaticamente salva dados no cache quando online
 * e retorna dados do cache quando offline
 */
export function useOfflineData<T>({
  cacheKey,
  data,
  isLoading,
  enabled = true,
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const { isOnline } = useOnlineStatus();

  // Salvar dados no cache quando receber novos dados
  useEffect(() => {
    if (enabled && data && isOnline && !isLoading) {
      setCache(CACHE_KEYS[cacheKey], data);
    }
  }, [data, isOnline, isLoading, cacheKey, enabled]);

  // Se está online e tem dados, retornar dados frescos
  if (isOnline && data) {
    return {
      data,
      isFromCache: false,
      isStale: false,
    };
  }

  // Se está offline ou carregando, tentar cache
  if (!isOnline || isLoading) {
    const cachedData = getCache<T>(CACHE_KEYS[cacheKey]);
    
    if (cachedData) {
      return {
        data: cachedData,
        isFromCache: true,
        isStale: !isOnline, // Dados são stale se estiver offline
      };
    }
  }

  // Retornar dados normais (pode ser undefined)
  return {
    data,
    isFromCache: false,
    isStale: false,
  };
}

/**
 * Hook para salvar dados específicos no cache
 */
export function useCacheData() {
  const saveToCache = useCallback(<T>(key: CacheKey, data: T) => {
    setCache(CACHE_KEYS[key], data);
  }, []);

  const getFromCache = useCallback(<T>(key: CacheKey): T | null => {
    return getCache<T>(CACHE_KEYS[key]);
  }, []);

  return {
    saveToCache,
    getFromCache,
  };
}

export default useOfflineData;
