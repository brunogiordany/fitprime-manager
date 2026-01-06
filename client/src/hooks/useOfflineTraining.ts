import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  initOfflineDB,
  saveTrainingLogOffline,
  updateTrainingLogOffline,
  addSetToOfflineLog,
  updateSetInOfflineLog,
  removeSetFromOfflineLog,
  completeOfflineTrainingLog,
  getOfflineTrainingLog,
  getAllOfflineTrainingLogs,
  getInProgressOfflineLog,
  getPendingCountBySource,
  getPendingWorkoutLogs,
  removePendingWorkoutLog,
  OfflineTrainingLog,
  OfflineWorkoutSet,
} from '@/lib/offlineStorage';
import { trpc } from '@/lib/trpc';

export interface OfflineTrainingState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: { personal: number; student: number; total: number };
  currentOfflineLog: OfflineTrainingLog | null;
  lastSyncAt: Date | null;
  syncError: string | null;
}

interface UseOfflineTrainingOptions {
  source: 'personal' | 'student';
  studentId?: number;
  autoSync?: boolean;
}

export function useOfflineTraining(options: UseOfflineTrainingOptions) {
  const { source, studentId, autoSync = true } = options;
  
  const [state, setState] = useState<OfflineTrainingState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: { personal: 0, student: 0, total: 0 },
    currentOfflineLog: null,
    lastSyncAt: null,
    syncError: null,
  });
  
  const syncInProgress = useRef(false);
  const utils = trpc.useUtils();
  
  // Mutations para sincronização
  const createWorkoutLogMutation = trpc.trainingDiary.create.useMutation();
  const completeLogMutation = trpc.trainingDiary.complete.useMutation();
  
  // Atualizar contagem de pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const counts = await getPendingCountBySource();
      setState(prev => ({ ...prev, pendingCount: counts }));
    } catch (error) {
      console.error('Erro ao contar pendentes:', error);
    }
  }, []);
  
  // Verificar se há treino em andamento offline
  const checkInProgressLog = useCallback(async () => {
    try {
      const inProgress = await getInProgressOfflineLog(source, studentId);
      setState(prev => ({ ...prev, currentOfflineLog: inProgress }));
      return inProgress;
    } catch (error) {
      console.error('Erro ao verificar treino em andamento:', error);
      return null;
    }
  }, [source, studentId]);
  
  // Iniciar novo treino offline
  const startOfflineTraining = useCallback(async (data: {
    studentId: number;
    workoutId?: number;
    workoutDayId?: number;
    date?: string;
  }): Promise<string> => {
    try {
      const logId = await saveTrainingLogOffline({
        studentId: data.studentId,
        workoutId: data.workoutId,
        workoutDayId: data.workoutDayId,
        date: data.date || new Date().toISOString().split('T')[0],
        startTime: new Date().toISOString(),
        status: 'in_progress',
        sets: [],
        source,
      });
      
      const log = await getOfflineTrainingLog(logId);
      setState(prev => ({ ...prev, currentOfflineLog: log }));
      await updatePendingCount();
      
      toast.info('Treino iniciado em modo offline');
      return logId;
    } catch (error: any) {
      console.error('Erro ao iniciar treino offline:', error);
      toast.error('Erro ao iniciar treino offline');
      throw error;
    }
  }, [source, updatePendingCount]);
  
  // Adicionar série ao treino offline
  const addOfflineSet = useCallback(async (set: Omit<OfflineWorkoutSet, 'id'>): Promise<string | null> => {
    if (!state.currentOfflineLog) {
      toast.error('Nenhum treino em andamento');
      return null;
    }
    
    try {
      const setId = await addSetToOfflineLog(state.currentOfflineLog.id, set);
      const updatedLog = await getOfflineTrainingLog(state.currentOfflineLog.id);
      setState(prev => ({ ...prev, currentOfflineLog: updatedLog }));
      return setId;
    } catch (error: any) {
      console.error('Erro ao adicionar série:', error);
      toast.error('Erro ao adicionar série');
      return null;
    }
  }, [state.currentOfflineLog]);
  
  // Atualizar série no treino offline
  const updateOfflineSet = useCallback(async (setId: string, updates: Partial<OfflineWorkoutSet>): Promise<void> => {
    if (!state.currentOfflineLog) return;
    
    try {
      await updateSetInOfflineLog(state.currentOfflineLog.id, setId, updates);
      const updatedLog = await getOfflineTrainingLog(state.currentOfflineLog.id);
      setState(prev => ({ ...prev, currentOfflineLog: updatedLog }));
    } catch (error: any) {
      console.error('Erro ao atualizar série:', error);
    }
  }, [state.currentOfflineLog]);
  
  // Remover série do treino offline
  const removeOfflineSet = useCallback(async (setId: string): Promise<void> => {
    if (!state.currentOfflineLog) return;
    
    try {
      await removeSetFromOfflineLog(state.currentOfflineLog.id, setId);
      const updatedLog = await getOfflineTrainingLog(state.currentOfflineLog.id);
      setState(prev => ({ ...prev, currentOfflineLog: updatedLog }));
    } catch (error: any) {
      console.error('Erro ao remover série:', error);
    }
  }, [state.currentOfflineLog]);
  
  // Finalizar treino offline
  const completeOfflineTraining = useCallback(async (feeling?: string, notes?: string): Promise<void> => {
    if (!state.currentOfflineLog) {
      toast.error('Nenhum treino em andamento');
      return;
    }
    
    try {
      await completeOfflineTrainingLog(state.currentOfflineLog.id);
      
      if (feeling || notes) {
        await updateTrainingLogOffline(state.currentOfflineLog.id, { feeling, notes });
      }
      
      setState(prev => ({ ...prev, currentOfflineLog: null }));
      await updatePendingCount();
      
      toast.success('Treino finalizado! Será sincronizado quando houver conexão.');
    } catch (error: any) {
      console.error('Erro ao finalizar treino:', error);
      toast.error('Erro ao finalizar treino');
    }
  }, [state.currentOfflineLog, updatePendingCount]);
  
  // Sincronizar registros pendentes
  const syncPendingLogs = useCallback(async (): Promise<number> => {
    if (syncInProgress.current || !navigator.onLine) return 0;
    
    syncInProgress.current = true;
    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));
    
    let syncedCount = 0;
    
    try {
      const pendingLogs = await getPendingWorkoutLogs();
      
      for (const log of pendingLogs) {
        // Pular treinos em andamento
        if (log.data?.status === 'in_progress') continue;
        
        // Filtrar por fonte se especificado
        if (log.data?.source && log.data.source !== source) continue;
        
        try {
          // Se for um registro com estrutura OfflineTrainingLog
          if (log.data?.sets && Array.isArray(log.data.sets)) {
            // Agrupar séries por exercício
            const exerciseMap = new Map<string, typeof log.data.sets>();
            for (const set of log.data.sets) {
              const key = set.exerciseName;
              if (!exerciseMap.has(key)) {
                exerciseMap.set(key, []);
              }
              exerciseMap.get(key)!.push(set);
            }
            
            // Converter para formato da API
            const exercises = Array.from(exerciseMap.entries()).map(([exerciseName, sets]) => ({
              exerciseName,
              muscleGroup: sets[0]?.muscleGroup,
              sets: sets.map((s: OfflineWorkoutSet) => ({
                setNumber: s.setNumber,
                setType: s.setType as 'warmup' | 'feeler' | 'working' | 'drop' | 'rest_pause' | 'failure' | undefined,
                weight: s.weight,
                reps: s.reps,
                rpe: s.rpe,
                notes: s.notes,
              })),
            }));
            
            // Criar o log com exercícios e séries
            const createdLog = await createWorkoutLogMutation.mutateAsync({
              studentId: log.data.studentId,
              workoutId: log.data.workoutId,
              workoutDayId: log.data.workoutDayId,
              trainingDate: log.data.date,
              startTime: log.data.startTime,
              notes: log.data.notes,
              feeling: log.data.feeling as 'great' | 'good' | 'normal' | 'tired' | 'exhausted' | undefined,
              exercises,
            });
            
            // Finalizar o treino se estava completo
            if (log.data.status === 'completed') {
              await completeLogMutation.mutateAsync({
                id: createdLog.id,
                feeling: log.data.feeling as 'great' | 'good' | 'normal' | 'tired' | 'exhausted' | undefined,
                notes: log.data.notes,
              });
            }
          } else {
            // Formato antigo - criar diretamente
            await createWorkoutLogMutation.mutateAsync(log.data);
          }
          
          // Remover do armazenamento local após sucesso
          await removePendingWorkoutLog(log.id);
          syncedCount++;
        } catch (error: any) {
          console.error('Erro ao sincronizar log:', error);
          
          // Se for erro de rede, parar
          if (!navigator.onLine) break;
          
          // Se excedeu tentativas, remover e notificar
          if (log.retryCount >= 3) {
            await removePendingWorkoutLog(log.id);
            toast.error(`Registro não pôde ser sincronizado: ${error.message}`);
          }
        }
      }
      
      if (syncedCount > 0) {
        toast.success(`${syncedCount} registro(s) sincronizado(s)!`);
        utils.trainingDiary.invalidate();
        utils.studentPortal.invalidate();
      }
      
      await updatePendingCount();
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        syncError: null,
      }));
      
      return syncedCount;
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error.message,
      }));
      return 0;
    } finally {
      syncInProgress.current = false;
    }
  }, [source, createWorkoutLogMutation, completeLogMutation, updatePendingCount, utils]);
  
  // Obter todos os registros offline
  const getOfflineLogs = useCallback(async (): Promise<OfflineTrainingLog[]> => {
    return getAllOfflineTrainingLogs(source);
  }, [source]);
  
  // Listeners de online/offline
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      toast.success('Conexão restaurada!');
      
      if (autoSync) {
        syncPendingLogs();
      }
    };
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      toast.warning('Você está offline. Os treinos serão salvos localmente.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Inicializar
    initOfflineDB().then(() => {
      updatePendingCount();
      checkInProgressLog();
      
      if (navigator.onLine && autoSync) {
        syncPendingLogs();
      }
    });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncPendingLogs, updatePendingCount, checkInProgressLog]);
  
  // Sincronização periódica
  useEffect(() => {
    if (!autoSync) return;
    
    const interval = setInterval(() => {
      if (navigator.onLine && state.pendingCount.total > 0) {
        syncPendingLogs();
      }
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [autoSync, syncPendingLogs, state.pendingCount.total]);
  
  return {
    ...state,
    startOfflineTraining,
    addOfflineSet,
    updateOfflineSet,
    removeOfflineSet,
    completeOfflineTraining,
    syncPendingLogs,
    getOfflineLogs,
    updatePendingCount,
    checkInProgressLog,
  };
}
