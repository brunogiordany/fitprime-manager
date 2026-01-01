import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  getOfflineQueue,
  getPendingCount,
  addToOfflineQueue,
  removeFromQueue,
  updateOperationStatus,
  clearCompletedOperations,
  OfflineOperation,
} from '@/lib/offlineQueue';
import { clearExpiredCache, getCacheSize } from '@/lib/offlineCache';
import { toast } from 'sonner';

interface OfflineContextType {
  isOnline: boolean;
  wasOffline: boolean;
  pendingOperations: number;
  isSyncing: boolean;
  queueOperation: (type: OfflineOperation['type'], entity: string, data: Record<string, unknown>) => void;
  syncNow: () => Promise<void>;
  getQueue: () => OfflineOperation[];
  cacheSize: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
  onSync?: (operations: OfflineOperation[]) => Promise<void>;
}

export function OfflineProvider({ children, onSync }: OfflineProviderProps) {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [pendingOperations, setPendingOperations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  // Atualizar contagem de operações pendentes
  const updatePendingCount = useCallback(() => {
    setPendingOperations(getPendingCount());
    setCacheSize(getCacheSize());
  }, []);

  // Adicionar operação à fila
  const queueOperation = useCallback(
    (type: OfflineOperation['type'], entity: string, data: Record<string, unknown>) => {
      addToOfflineQueue(type, entity, data);
      updatePendingCount();
      
      if (!isOnline) {
        toast.info('Operação salva offline', {
          description: 'Será sincronizada quando você voltar online.',
        });
      }
    },
    [isOnline, updatePendingCount]
  );

  // Sincronizar operações pendentes
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const queue = getOfflineQueue().filter((op) => op.status === 'pending');
    if (queue.length === 0) return;

    setIsSyncing(true);
    toast.loading('Sincronizando dados...', { id: 'sync' });

    try {
      if (onSync) {
        await onSync(queue);
      } else {
        // Sincronização padrão - marcar como completado
        // Em produção, isso chamaria as APIs reais
        for (const op of queue) {
          updateOperationStatus(op.id, 'completed');
        }
      }

      clearCompletedOperations();
      updatePendingCount();
      
      toast.success('Dados sincronizados!', { id: 'sync' });
    } catch (error) {
      console.error('[OfflineSync] Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar', {
        id: 'sync',
        description: 'Tentaremos novamente em breve.',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, onSync, updatePendingCount]);

  // Obter fila atual
  const getQueue = useCallback(() => {
    return getOfflineQueue();
  }, []);

  // Efeitos
  useEffect(() => {
    updatePendingCount();
    clearExpiredCache();
  }, [updatePendingCount]);

  // Sincronizar automaticamente quando voltar online
  useEffect(() => {
    if (wasOffline && isOnline && pendingOperations > 0) {
      toast.success('Conexão restaurada!', {
        description: `${pendingOperations} operação(ões) pendente(s) para sincronizar.`,
      });
      
      // Aguardar um pouco antes de sincronizar
      const timer = setTimeout(() => {
        syncNow();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline, pendingOperations, syncNow]);

  // Mostrar notificação quando ficar offline
  useEffect(() => {
    if (!isOnline) {
      toast.warning('Você está offline', {
        description: 'Suas alterações serão salvas localmente.',
        duration: 5000,
      });
    }
  }, [isOnline]);

  const value: OfflineContextType = {
    isOnline,
    wasOffline,
    pendingOperations,
    isSyncing,
    queueOperation,
    syncNow,
    getQueue,
    cacheSize,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

export default OfflineContext;
