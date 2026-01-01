// Sistema de cache local para dados da API
// Permite acesso offline aos dados mais importantes

const CACHE_PREFIX = 'fitprime_cache_';
const CACHE_EXPIRY_KEY = 'fitprime_cache_expiry';

// Tempo de expiração padrão: 24 horas
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Salvar dados no cache
export function setCache<T>(key: string, data: T, expiryMs: number = DEFAULT_EXPIRY): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.error('[OfflineCache] Erro ao salvar cache:', error);
    // Se localStorage estiver cheio, limpar caches antigos
    clearExpiredCache();
  }
}

// Obter dados do cache
export function getCache<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

// Verificar se cache existe e é válido
export function hasValidCache(key: string): boolean {
  return getCache(key) !== null;
}

// Remover item do cache
export function removeCache(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key);
}

// Limpar caches expirados
export function clearExpiredCache(): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
  
  keys.forEach((key) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const entry = JSON.parse(stored);
        if (Date.now() - entry.timestamp > entry.expiry) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Se não conseguir parsear, remover
      localStorage.removeItem(key);
    }
  });
}

// Limpar todo o cache
export function clearAllCache(): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
  keys.forEach((key) => localStorage.removeItem(key));
}

// Obter tamanho do cache em bytes
export function getCacheSize(): number {
  let size = 0;
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
  
  keys.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      size += key.length + value.length;
    }
  });

  return size;
}

// Chaves de cache predefinidas para dados importantes
export const CACHE_KEYS = {
  // Personal
  PERSONAL_PROFILE: 'personal_profile',
  PERSONAL_STUDENTS: 'personal_students',
  PERSONAL_WORKOUTS: 'personal_workouts',
  PERSONAL_SESSIONS: 'personal_sessions',
  PERSONAL_PLANS: 'personal_plans',
  PERSONAL_CHARGES: 'personal_charges',
  PERSONAL_DASHBOARD: 'personal_dashboard',
  
  // Aluno
  STUDENT_PROFILE: 'student_profile',
  STUDENT_WORKOUTS: 'student_workouts',
  STUDENT_SESSIONS: 'student_sessions',
  STUDENT_MEASUREMENTS: 'student_measurements',
  STUDENT_CHARGES: 'student_charges',
  STUDENT_WORKOUT_LOGS: 'student_workout_logs',
} as const;

// Helper para cache de dados do personal
export function cachePersonalData(key: keyof typeof CACHE_KEYS, data: unknown): void {
  setCache(CACHE_KEYS[key], data);
}

// Helper para obter cache do personal
export function getPersonalCache<T>(key: keyof typeof CACHE_KEYS): T | null {
  return getCache<T>(CACHE_KEYS[key]);
}

// Helper para cache de dados do aluno
export function cacheStudentData(key: keyof typeof CACHE_KEYS, data: unknown): void {
  setCache(CACHE_KEYS[key], data);
}

// Helper para obter cache do aluno
export function getStudentCache<T>(key: keyof typeof CACHE_KEYS): T | null {
  return getCache<T>(CACHE_KEYS[key]);
}
