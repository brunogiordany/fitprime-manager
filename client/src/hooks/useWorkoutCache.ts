import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  initOfflineDB,
  cacheWorkoutsComplete,
  getCachedWorkoutsComplete,
  getCachedWorkoutById,
  hasWorkoutsInCache,
  getWorkoutsCacheDate,
  clearWorkoutsCache,
  isCacheExpired,
  getCachedWorkoutsCount,
  CachedWorkout,
} from '@/lib/offlineStorage';
import { trpc } from '@/lib/trpc';

export interface WorkoutCacheState {
  isLoading: boolean;
  isCaching: boolean;
  hasCachedWorkouts: boolean;
  cachedWorkoutsCount: number;
  lastCacheDate: Date | null;
  isOffline: boolean;
}

export function useWorkoutCache(studentId?: number) {
  const [state, setState] = useState<WorkoutCacheState>({
    isLoading: true,
    isCaching: false,
    hasCachedWorkouts: false,
    cachedWorkoutsCount: 0,
    lastCacheDate: null,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  });
  
  const [cachedWorkouts, setCachedWorkouts] = useState<CachedWorkout[]>([]);
  
  // Query para buscar treinos do servidor (Portal do Aluno)
  const { data: serverWorkouts, isLoading: isLoadingServer, refetch: refetchServer } = 
    trpc.studentPortal.workouts.useQuery(undefined, {
      enabled: state.isOffline === false && !!studentId,
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  
  // Inicializar cache
  const initCache = useCallback(async () => {
    try {
      await initOfflineDB();
      
      const hasCached = await hasWorkoutsInCache(studentId);
      const count = await getCachedWorkoutsCount();
      const cacheDate = await getWorkoutsCacheDate(studentId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasCachedWorkouts: hasCached,
        cachedWorkoutsCount: count,
        lastCacheDate: cacheDate ? new Date(cacheDate) : null,
      }));
      
      // Se tiver cache, carregar
      if (hasCached) {
        const cached = await getCachedWorkoutsComplete(studentId);
        setCachedWorkouts(cached);
      }
    } catch (error) {
      console.error('Erro ao inicializar cache:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [studentId]);
  
  // Cachear treinos do servidor
  const cacheWorkouts = useCallback(async (workouts: any[]) => {
    if (!workouts || workouts.length === 0) return;
    
    setState(prev => ({ ...prev, isCaching: true }));
    
    try {
      // Transformar dados do servidor para formato de cache
      const workoutsToCache: CachedWorkout[] = workouts.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        objective: w.objective,
        type: w.type,
        difficulty: w.difficulty,
        status: w.status,
        studentId: studentId,
        cachedAt: Date.now(),
        days: w.days?.map((d: any) => ({
          id: d.id,
          workoutId: w.id,
          dayName: d.dayName,
          dayOrder: d.dayOrder,
          exercises: d.exercises?.map((e: any) => ({
            id: e.id,
            workoutDayId: d.id,
            name: e.name,
            muscleGroup: e.muscleGroup,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            restTime: e.restTime,
            tempo: e.tempo,
            videoUrl: e.videoUrl,
            notes: e.notes,
            orderIndex: e.orderIndex || 0,
          })) || [],
        })) || [],
      }));
      
      await cacheWorkoutsComplete(workoutsToCache, studentId);
      
      const count = await getCachedWorkoutsCount();
      const cacheDate = await getWorkoutsCacheDate(studentId);
      
      setState(prev => ({
        ...prev,
        isCaching: false,
        hasCachedWorkouts: true,
        cachedWorkoutsCount: count,
        lastCacheDate: cacheDate ? new Date(cacheDate) : null,
      }));
      
      setCachedWorkouts(workoutsToCache);
      
      console.log(`[WorkoutCache] ${workoutsToCache.length} treinos salvos em cache`);
    } catch (error) {
      console.error('Erro ao cachear treinos:', error);
      setState(prev => ({ ...prev, isCaching: false }));
    }
  }, [studentId]);
  
  // Obter treinos (do cache se offline, do servidor se online)
  const getWorkouts = useCallback(async (): Promise<CachedWorkout[]> => {
    // Se offline, retornar do cache
    if (!navigator.onLine) {
      console.log('[WorkoutCache] Offline - retornando do cache');
      return cachedWorkouts;
    }
    
    // Se online e tiver dados do servidor, retornar do servidor
    if (serverWorkouts && serverWorkouts.length > 0) {
      return serverWorkouts as any;
    }
    
    // Fallback para cache
    return cachedWorkouts;
  }, [cachedWorkouts, serverWorkouts]);
  
  // Obter um treino específico
  const getWorkoutById = useCallback(async (workoutId: number): Promise<CachedWorkout | null> => {
    // Se offline, buscar do cache
    if (!navigator.onLine) {
      console.log('[WorkoutCache] Offline - buscando treino do cache:', workoutId);
      return getCachedWorkoutById(workoutId);
    }
    
    // Se online, buscar do servidor (via query)
    // Por enquanto, usar cache como fallback
    const cached = await getCachedWorkoutById(workoutId);
    return cached;
  }, []);
  
  // Forçar atualização do cache
  const refreshCache = useCallback(async () => {
    if (!navigator.onLine) {
      toast.warning('Sem conexão. Não é possível atualizar o cache.');
      return;
    }
    
    try {
      // Refetch do servidor
      const result = await refetchServer();
      if (result.data) {
        await cacheWorkouts(result.data);
        toast.success('Treinos atualizados e salvos em cache!');
      }
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
      toast.error('Erro ao atualizar treinos');
    }
  }, [refetchServer, cacheWorkouts]);
  
  // Limpar cache
  const clearCache = useCallback(async () => {
    try {
      await clearWorkoutsCache(studentId);
      setCachedWorkouts([]);
      setState(prev => ({
        ...prev,
        hasCachedWorkouts: false,
        cachedWorkoutsCount: 0,
        lastCacheDate: null,
      }));
      toast.success('Cache de treinos limpo');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache');
    }
  }, [studentId]);
  
  // Listeners de online/offline
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
    };
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Inicializar cache ao montar
  useEffect(() => {
    initCache();
  }, [initCache]);
  
  // Cachear automaticamente quando receber dados do servidor
  useEffect(() => {
    if (serverWorkouts && serverWorkouts.length > 0 && !state.isCaching) {
      // Verificar se cache está expirado ou vazio
      isCacheExpired(`workouts_${studentId || 'all'}`).then(expired => {
        if (expired || !state.hasCachedWorkouts) {
          cacheWorkouts(serverWorkouts);
        }
      });
    }
  }, [serverWorkouts, studentId, state.isCaching, state.hasCachedWorkouts, cacheWorkouts]);
  
  return {
    ...state,
    cachedWorkouts,
    serverWorkouts,
    isLoadingServer,
    getWorkouts,
    getWorkoutById,
    cacheWorkouts,
    refreshCache,
    clearCache,
  };
}
