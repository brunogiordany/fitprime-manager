import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  initOfflineDB,
  getPendingWorkoutLogs,
  removePendingWorkoutLog,
  getPendingCardioLogs,
  removePendingCardioLog,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueError,
  getPendingCount,
  saveWorkoutLogOffline,
  saveCardioLogOffline,
} from '@/lib/offlineStorage';
import { trpc } from '@/lib/trpc';

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncError: string | null;
}

export function useOfflineSync() {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    syncError: null,
  });
  
  const syncInProgress = useRef(false);
  const utils = trpc.useUtils();
  
  // Mutations para sincronização
  const createWorkoutLogMutation = trpc.trainingDiary.create.useMutation();
  const createCardioMutation = trpc.cardio.create.useMutation();
  
  // Atualizar contagem de pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Erro ao contar pendentes:', error);
    }
  }, []);
  
  // Sincronizar registros de treino pendentes
  const syncWorkoutLogs = useCallback(async (): Promise<number> => {
    const pendingLogs = await getPendingWorkoutLogs();
    let syncedCount = 0;
    
    for (const log of pendingLogs) {
      try {
        // Tentar enviar para o servidor
        await createWorkoutLogMutation.mutateAsync(log.data);
        
        // Remover do armazenamento local após sucesso
        await removePendingWorkoutLog(log.id);
        syncedCount++;
      } catch (error: any) {
        console.error('Erro ao sincronizar workout log:', error);
        // Se for erro de rede, parar a sincronização
        if (!navigator.onLine) break;
        // Se for erro de validação ou outro, marcar como erro
        if (log.retryCount >= 3) {
          // Após 3 tentativas, remover e notificar
          await removePendingWorkoutLog(log.id);
          toast.error(`Registro de treino não pôde ser sincronizado: ${error.message}`);
        }
      }
    }
    
    return syncedCount;
  }, [createWorkoutLogMutation]);
  
  // Sincronizar registros de cardio pendentes
  const syncCardioLogs = useCallback(async (): Promise<number> => {
    const pendingLogs = await getPendingCardioLogs();
    let syncedCount = 0;
    
    for (const log of pendingLogs) {
      try {
        await createCardioMutation.mutateAsync(log.data);
        await removePendingCardioLog(log.id);
        syncedCount++;
      } catch (error: any) {
        console.error('Erro ao sincronizar cardio log:', error);
        if (!navigator.onLine) break;
        if (log.retryCount >= 3) {
          await removePendingCardioLog(log.id);
          toast.error(`Registro de cardio não pôde ser sincronizado: ${error.message}`);
        }
      }
    }
    
    return syncedCount;
  }, [createCardioMutation]);
  
  // Função principal de sincronização
  const sync = useCallback(async () => {
    if (syncInProgress.current || !navigator.onLine) return;
    
    syncInProgress.current = true;
    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));
    
    try {
      await initOfflineDB();
      
      const workoutSynced = await syncWorkoutLogs();
      const cardioSynced = await syncCardioLogs();
      
      const totalSynced = workoutSynced + cardioSynced;
      
      if (totalSynced > 0) {
        toast.success(`${totalSynced} registro(s) sincronizado(s) com sucesso!`);
        // Invalidar queries para atualizar dados
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
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error.message,
      }));
    } finally {
      syncInProgress.current = false;
    }
  }, [syncWorkoutLogs, syncCardioLogs, updatePendingCount, utils]);
  
  // Salvar registro de treino (offline-first)
  const saveWorkoutLog = useCallback(async (data: any): Promise<{ success: boolean; offlineId?: string }> => {
    if (navigator.onLine) {
      try {
        await createWorkoutLogMutation.mutateAsync(data);
        return { success: true };
      } catch (error: any) {
        // Se falhar online, salvar offline
        console.error('Erro ao salvar online, salvando offline:', error);
        const offlineId = await saveWorkoutLogOffline(data);
        await updatePendingCount();
        toast.info('Sem conexão. Treino salvo localmente e será sincronizado automaticamente.');
        return { success: true, offlineId };
      }
    } else {
      // Offline: salvar localmente
      const offlineId = await saveWorkoutLogOffline(data);
      await updatePendingCount();
      toast.info('Sem conexão. Treino salvo localmente e será sincronizado automaticamente.');
      return { success: true, offlineId };
    }
  }, [createWorkoutLogMutation, updatePendingCount]);
  
  // Salvar registro de cardio (offline-first)
  const saveCardioLog = useCallback(async (data: any): Promise<{ success: boolean; offlineId?: string }> => {
    if (navigator.onLine) {
      try {
        await createCardioMutation.mutateAsync(data);
        return { success: true };
      } catch (error: any) {
        console.error('Erro ao salvar online, salvando offline:', error);
        const offlineId = await saveCardioLogOffline(data);
        await updatePendingCount();
        toast.info('Sem conexão. Cardio salvo localmente e será sincronizado automaticamente.');
        return { success: true, offlineId };
      }
    } else {
      const offlineId = await saveCardioLogOffline(data);
      await updatePendingCount();
      toast.info('Sem conexão. Cardio salvo localmente e será sincronizado automaticamente.');
      return { success: true, offlineId };
    }
  }, [createCardioMutation, updatePendingCount]);
  
  // Listeners de online/offline
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      toast.success('Conexão restaurada! Sincronizando dados...');
      // Sincronizar automaticamente ao voltar online
      sync();
    };
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      toast.warning('Você está offline. Os dados serão salvos localmente.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Inicializar DB e contar pendentes
    initOfflineDB().then(() => {
      updatePendingCount();
      // Se estiver online e tiver pendentes, sincronizar
      if (navigator.onLine) {
        sync();
      }
    });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync, updatePendingCount]);
  
  // Sincronização periódica (a cada 5 minutos se online)
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && state.pendingCount > 0) {
        sync();
      }
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [sync, state.pendingCount]);
  
  return {
    ...state,
    sync,
    saveWorkoutLog,
    saveCardioLog,
    updatePendingCount,
  };
}
