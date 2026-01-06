import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Schema do IndexedDB
interface FitPrimeDB extends DBSchema {
  pendingWorkoutLogs: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update';
      data: any;
      createdAt: number;
      retryCount: number;
    };
    indexes: { 'by-createdAt': number };
  };
  pendingCardioLogs: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update';
      data: any;
      createdAt: number;
      retryCount: number;
    };
    indexes: { 'by-createdAt': number };
  };
  cachedSessions: {
    key: number;
    value: {
      id: number;
      data: any;
      cachedAt: number;
    };
  };
  cachedWorkouts: {
    key: number;
    value: {
      id: number;
      data: any;
      cachedAt: number;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      endpoint: string;
      method: string;
      body: any;
      createdAt: number;
      retryCount: number;
      lastError?: string;
    };
    indexes: { 'by-createdAt': number };
  };
}

let db: IDBPDatabase<FitPrimeDB> | null = null;

// Inicializar o banco de dados
export async function initOfflineDB(): Promise<IDBPDatabase<FitPrimeDB>> {
  if (db) return db;
  
  db = await openDB<FitPrimeDB>('fitprime-offline', 1, {
    upgrade(db) {
      // Store para registros de treino pendentes
      const workoutStore = db.createObjectStore('pendingWorkoutLogs', {
        keyPath: 'id'
      });
      workoutStore.createIndex('by-createdAt', 'createdAt');
      
      // Store para registros de cardio pendentes
      const cardioStore = db.createObjectStore('pendingCardioLogs', {
        keyPath: 'id'
      });
      cardioStore.createIndex('by-createdAt', 'createdAt');
      
      // Store para sessões em cache
      db.createObjectStore('cachedSessions', {
        keyPath: 'id'
      });
      
      // Store para treinos em cache
      db.createObjectStore('cachedWorkouts', {
        keyPath: 'id'
      });
      
      // Store para fila de sincronização genérica
      const syncStore = db.createObjectStore('syncQueue', {
        keyPath: 'id'
      });
      syncStore.createIndex('by-createdAt', 'createdAt');
    }
  });
  
  return db;
}

// Gerar ID único para registros offline
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== WORKOUT LOGS ====================

// Salvar registro de treino offline
export async function saveWorkoutLogOffline(data: any): Promise<string> {
  const database = await initOfflineDB();
  const id = generateOfflineId();
  
  await database.put('pendingWorkoutLogs', {
    id,
    type: 'create',
    data,
    createdAt: Date.now(),
    retryCount: 0
  });
  
  return id;
}

// Obter todos os registros de treino pendentes
export async function getPendingWorkoutLogs(): Promise<any[]> {
  const database = await initOfflineDB();
  return database.getAllFromIndex('pendingWorkoutLogs', 'by-createdAt');
}

// Remover registro de treino pendente após sincronização
export async function removePendingWorkoutLog(id: string): Promise<void> {
  const database = await initOfflineDB();
  await database.delete('pendingWorkoutLogs', id);
}

// Atualizar contador de retry
export async function incrementWorkoutLogRetry(id: string): Promise<void> {
  const database = await initOfflineDB();
  const log = await database.get('pendingWorkoutLogs', id);
  if (log) {
    log.retryCount++;
    await database.put('pendingWorkoutLogs', log);
  }
}

// ==================== CARDIO LOGS ====================

// Salvar registro de cardio offline
export async function saveCardioLogOffline(data: any): Promise<string> {
  const database = await initOfflineDB();
  const id = generateOfflineId();
  
  await database.put('pendingCardioLogs', {
    id,
    type: 'create',
    data,
    createdAt: Date.now(),
    retryCount: 0
  });
  
  return id;
}

// Obter todos os registros de cardio pendentes
export async function getPendingCardioLogs(): Promise<any[]> {
  const database = await initOfflineDB();
  return database.getAllFromIndex('pendingCardioLogs', 'by-createdAt');
}

// Remover registro de cardio pendente após sincronização
export async function removePendingCardioLog(id: string): Promise<void> {
  const database = await initOfflineDB();
  await database.delete('pendingCardioLogs', id);
}

// ==================== SYNC QUEUE ====================

// Adicionar item à fila de sincronização
export async function addToSyncQueue(
  endpoint: string,
  method: string,
  body: any
): Promise<string> {
  const database = await initOfflineDB();
  const id = generateOfflineId();
  
  await database.put('syncQueue', {
    id,
    endpoint,
    method,
    body,
    createdAt: Date.now(),
    retryCount: 0
  });
  
  return id;
}

// Obter todos os itens da fila de sincronização
export async function getSyncQueue(): Promise<any[]> {
  const database = await initOfflineDB();
  return database.getAllFromIndex('syncQueue', 'by-createdAt');
}

// Remover item da fila após sincronização
export async function removeFromSyncQueue(id: string): Promise<void> {
  const database = await initOfflineDB();
  await database.delete('syncQueue', id);
}

// Atualizar erro do item na fila
export async function updateSyncQueueError(id: string, error: string): Promise<void> {
  const database = await initOfflineDB();
  const item = await database.get('syncQueue', id);
  if (item) {
    item.retryCount++;
    item.lastError = error;
    await database.put('syncQueue', item);
  }
}

// ==================== CACHE ====================

// Cachear sessões para acesso offline
export async function cacheSessions(sessions: any[]): Promise<void> {
  const database = await initOfflineDB();
  const tx = database.transaction('cachedSessions', 'readwrite');
  
  for (const session of sessions) {
    await tx.store.put({
      id: session.id,
      data: session,
      cachedAt: Date.now()
    });
  }
  
  await tx.done;
}

// Obter sessões do cache
export async function getCachedSessions(): Promise<any[]> {
  const database = await initOfflineDB();
  const cached = await database.getAll('cachedSessions');
  return cached.map(c => c.data);
}

// Cachear treinos para acesso offline
export async function cacheWorkouts(workouts: any[]): Promise<void> {
  const database = await initOfflineDB();
  const tx = database.transaction('cachedWorkouts', 'readwrite');
  
  for (const workout of workouts) {
    await tx.store.put({
      id: workout.id,
      data: workout,
      cachedAt: Date.now()
    });
  }
  
  await tx.done;
}

// Obter treinos do cache
export async function getCachedWorkouts(): Promise<any[]> {
  const database = await initOfflineDB();
  const cached = await database.getAll('cachedWorkouts');
  return cached.map(c => c.data);
}

// ==================== CONTADORES ====================

// Obter contagem total de itens pendentes
export async function getPendingCount(): Promise<number> {
  const database = await initOfflineDB();
  const workoutLogs = await database.count('pendingWorkoutLogs');
  const cardioLogs = await database.count('pendingCardioLogs');
  const syncQueue = await database.count('syncQueue');
  return workoutLogs + cardioLogs + syncQueue;
}

// Limpar todos os dados offline (para debug/reset)
export async function clearOfflineData(): Promise<void> {
  const database = await initOfflineDB();
  await database.clear('pendingWorkoutLogs');
  await database.clear('pendingCardioLogs');
  await database.clear('cachedSessions');
  await database.clear('cachedWorkouts');
  await database.clear('syncQueue');
}
