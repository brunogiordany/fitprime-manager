// Serviço de sincronização offline
// Gerencia a sincronização de operações pendentes quando a conexão é restaurada

import {
  getOfflineQueue,
  updateOperationStatus,
  removeFromQueue,
  clearCompletedOperations,
  OfflineOperation,
} from './offlineQueue';

// Tipos de entidades suportadas para sincronização
export type SyncableEntity =
  | 'workout_log'
  | 'exercise_log'
  | 'measurement'
  | 'session'
  | 'anamnesis'
  | 'feedback'
  | 'message';

// Interface para handlers de sincronização
export interface SyncHandler {
  entity: SyncableEntity;
  create?: (data: Record<string, unknown>) => Promise<void>;
  update?: (data: Record<string, unknown>) => Promise<void>;
  delete?: (data: Record<string, unknown>) => Promise<void>;
}

// Registro de handlers
const syncHandlers: Map<SyncableEntity, SyncHandler> = new Map();

// Registrar um handler de sincronização
export function registerSyncHandler(handler: SyncHandler): void {
  syncHandlers.set(handler.entity, handler);
}

// Remover um handler
export function unregisterSyncHandler(entity: SyncableEntity): void {
  syncHandlers.delete(entity);
}

// Sincronizar uma operação individual
async function syncOperation(operation: OfflineOperation): Promise<boolean> {
  const handler = syncHandlers.get(operation.entity as SyncableEntity);

  if (!handler) {
    console.warn(`[OfflineSync] No handler for entity: ${operation.entity}`);
    return false;
  }

  try {
    updateOperationStatus(operation.id, 'syncing');

    switch (operation.type) {
      case 'create':
        if (handler.create) {
          await handler.create(operation.data);
        }
        break;
      case 'update':
        if (handler.update) {
          await handler.update(operation.data);
        }
        break;
      case 'delete':
        if (handler.delete) {
          await handler.delete(operation.data);
        }
        break;
    }

    updateOperationStatus(operation.id, 'completed');
    return true;
  } catch (error) {
    console.error(`[OfflineSync] Failed to sync operation:`, operation, error);
    updateOperationStatus(operation.id, 'failed');
    return false;
  }
}

// Sincronizar todas as operações pendentes
export async function syncAllPending(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const queue = getOfflineQueue().filter((op) => op.status === 'pending');
  const results = { success: 0, failed: 0, total: queue.length };

  if (queue.length === 0) {
    return results;
  }

  console.log(`[OfflineSync] Starting sync of ${queue.length} operations`);

  // Ordenar por timestamp para manter ordem cronológica
  const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

  for (const operation of sortedQueue) {
    const success = await syncOperation(operation);
    if (success) {
      results.success++;
    } else {
      results.failed++;
    }
  }

  // Limpar operações completadas
  clearCompletedOperations();

  console.log(
    `[OfflineSync] Sync complete: ${results.success} success, ${results.failed} failed`
  );

  return results;
}

// Verificar se há operações pendentes para uma entidade
export function hasPendingSync(entity?: SyncableEntity): boolean {
  const queue = getOfflineQueue().filter((op) => op.status === 'pending');

  if (entity) {
    return queue.some((op) => op.entity === entity);
  }

  return queue.length > 0;
}

// Obter contagem de operações pendentes
export function getPendingSyncCount(entity?: SyncableEntity): number {
  const queue = getOfflineQueue().filter((op) => op.status === 'pending');

  if (entity) {
    return queue.filter((op) => op.entity === entity).length;
  }

  return queue.length;
}

// Cancelar operações pendentes para uma entidade
export function cancelPendingSync(entity: SyncableEntity): void {
  const queue = getOfflineQueue();
  const toRemove = queue.filter(
    (op) => op.entity === entity && op.status === 'pending'
  );

  toRemove.forEach((op) => removeFromQueue(op.id));
}

// Registrar para Background Sync (se suportado)
export async function registerBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('[OfflineSync] Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - sync não está no tipo padrão
    await registration.sync.register('sync-offline-data');
    console.log('[OfflineSync] Background Sync registered');
    return true;
  } catch (error) {
    console.error('[OfflineSync] Failed to register Background Sync:', error);
    return false;
  }
}

// Listener para mensagens do Service Worker
export function setupSyncListener(onSyncComplete?: () => void): () => void {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC_COMPLETED') {
      console.log('[OfflineSync] Received sync complete from SW');
      onSyncComplete?.();
    }
  };

  navigator.serviceWorker?.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker?.removeEventListener('message', handleMessage);
  };
}

// Exportar para uso global
export default {
  registerSyncHandler,
  unregisterSyncHandler,
  syncAllPending,
  hasPendingSync,
  getPendingSyncCount,
  cancelPendingSync,
  registerBackgroundSync,
  setupSyncListener,
};
