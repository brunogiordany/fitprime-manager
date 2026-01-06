import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Tipos para treinos em cache
export interface CachedWorkout {
  id: number;
  name: string;
  description?: string;
  objective?: string;
  type?: string;
  difficulty?: string;
  status?: string;
  days: CachedWorkoutDay[];
  cachedAt?: number;
  studentId?: number;
}

export interface CachedWorkoutDay {
  id: number;
  workoutId: number;
  dayName: string;
  dayOrder: number;
  exercises: CachedExercise[];
  cachedAt?: number;
}

export interface CachedExercise {
  id: number;
  workoutDayId: number;
  name: string;
  muscleGroup?: string;
  sets?: number;
  reps?: string;
  weight?: string;
  restTime?: number;
  tempo?: string;
  videoUrl?: string;
  notes?: string;
  orderIndex: number;
  cachedAt?: number;
}

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
      data: CachedWorkout;
      cachedAt: number;
      studentId?: number;
    };
    indexes: { 'by-studentId': number };
  };
  cachedWorkoutDays: {
    key: number;
    value: {
      id: number;
      workoutId: number;
      data: CachedWorkoutDay;
      cachedAt: number;
    };
    indexes: { 'by-workoutId': number };
  };
  cachedExercises: {
    key: number;
    value: {
      id: number;
      workoutDayId: number;
      data: CachedExercise;
      cachedAt: number;
    };
    indexes: { 'by-workoutDayId': number };
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
  cacheMetadata: {
    key: string;
    value: {
      key: string;
      lastSync: number;
      version: number;
    };
  };
}

let db: IDBPDatabase<FitPrimeDB> | null = null;
const DB_VERSION = 2; // Incrementar para nova versão com cache de treinos

// Inicializar o banco de dados
export async function initOfflineDB(): Promise<IDBPDatabase<FitPrimeDB>> {
  if (db) return db;
  
  db = await openDB<FitPrimeDB>('fitprime-offline', DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Criar stores se não existirem
      if (!db.objectStoreNames.contains('pendingWorkoutLogs')) {
        const workoutStore = db.createObjectStore('pendingWorkoutLogs', {
          keyPath: 'id'
        });
        workoutStore.createIndex('by-createdAt', 'createdAt');
      }
      
      if (!db.objectStoreNames.contains('pendingCardioLogs')) {
        const cardioStore = db.createObjectStore('pendingCardioLogs', {
          keyPath: 'id'
        });
        cardioStore.createIndex('by-createdAt', 'createdAt');
      }
      
      if (!db.objectStoreNames.contains('cachedSessions')) {
        db.createObjectStore('cachedSessions', {
          keyPath: 'id'
        });
      }
      
      // Atualizar cachedWorkouts com índice por studentId
      if (!db.objectStoreNames.contains('cachedWorkouts')) {
        const workoutsStore = db.createObjectStore('cachedWorkouts', {
          keyPath: 'id'
        });
        workoutsStore.createIndex('by-studentId', 'studentId');
      }
      
      // Novo store para dias de treino
      if (!db.objectStoreNames.contains('cachedWorkoutDays')) {
        const daysStore = db.createObjectStore('cachedWorkoutDays', {
          keyPath: 'id'
        });
        daysStore.createIndex('by-workoutId', 'workoutId');
      }
      
      // Novo store para exercícios
      if (!db.objectStoreNames.contains('cachedExercises')) {
        const exercisesStore = db.createObjectStore('cachedExercises', {
          keyPath: 'id'
        });
        exercisesStore.createIndex('by-workoutDayId', 'workoutDayId');
      }
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', {
          keyPath: 'id'
        });
        syncStore.createIndex('by-createdAt', 'createdAt');
      }
      
      // Novo store para metadados de cache
      if (!db.objectStoreNames.contains('cacheMetadata')) {
        db.createObjectStore('cacheMetadata', {
          keyPath: 'key'
        });
      }
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

// ==================== CACHE DE SESSÕES ====================

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

// ==================== CACHE DE TREINOS COMPLETO ====================

// Cachear treinos completos (com dias e exercícios)
export async function cacheWorkoutsComplete(workouts: CachedWorkout[], studentId?: number): Promise<void> {
  const database = await initOfflineDB();
  const now = Date.now();
  
  // Usar transações separadas para cada store
  const workoutsTx = database.transaction('cachedWorkouts', 'readwrite');
  for (const workout of workouts) {
    await workoutsTx.store.put({
      id: workout.id,
      data: { ...workout, cachedAt: now, studentId },
      cachedAt: now,
      studentId
    });
  }
  await workoutsTx.done;
  
  // Cachear dias de treino
  const daysTx = database.transaction('cachedWorkoutDays', 'readwrite');
  for (const workout of workouts) {
    if (workout.days) {
      for (const day of workout.days) {
        await daysTx.store.put({
          id: day.id,
          workoutId: workout.id,
          data: { ...day, cachedAt: now },
          cachedAt: now
        });
      }
    }
  }
  await daysTx.done;
  
  // Cachear exercícios
  const exercisesTx = database.transaction('cachedExercises', 'readwrite');
  for (const workout of workouts) {
    if (workout.days) {
      for (const day of workout.days) {
        if (day.exercises) {
          for (const exercise of day.exercises) {
            await exercisesTx.store.put({
              id: exercise.id,
              workoutDayId: day.id,
              data: { ...exercise, cachedAt: now },
              cachedAt: now
            });
          }
        }
      }
    }
  }
  await exercisesTx.done;
  
  // Atualizar metadados de cache
  await updateCacheMetadata(`workouts_${studentId || 'all'}`, now);
}

// Obter treinos do cache (versão simples)
export async function getCachedWorkouts(): Promise<any[]> {
  const database = await initOfflineDB();
  const cached = await database.getAll('cachedWorkouts');
  return cached.map(c => c.data);
}

// Obter treinos completos do cache (com dias e exercícios)
export async function getCachedWorkoutsComplete(studentId?: number): Promise<CachedWorkout[]> {
  const database = await initOfflineDB();
  
  // Buscar treinos
  let workouts: any[];
  if (studentId) {
    workouts = await database.getAllFromIndex('cachedWorkouts', 'by-studentId', studentId);
  } else {
    workouts = await database.getAll('cachedWorkouts');
  }
  
  // Buscar dias e exercícios para cada treino
  const result: CachedWorkout[] = [];
  
  for (const workoutCache of workouts) {
    const workout = workoutCache.data;
    
    // Buscar dias do treino
    const days = await database.getAllFromIndex('cachedWorkoutDays', 'by-workoutId', workout.id);
    const daysWithExercises: CachedWorkoutDay[] = [];
    
    for (const dayCache of days) {
      const day = dayCache.data;
      
      // Buscar exercícios do dia
      const exercises = await database.getAllFromIndex('cachedExercises', 'by-workoutDayId', day.id);
      
      daysWithExercises.push({
        ...day,
        exercises: exercises.map(e => e.data).sort((a, b) => a.orderIndex - b.orderIndex)
      });
    }
    
    result.push({
      ...workout,
      days: daysWithExercises.sort((a, b) => a.dayOrder - b.dayOrder)
    });
  }
  
  return result;
}

// Obter um treino específico do cache
export async function getCachedWorkoutById(workoutId: number): Promise<CachedWorkout | null> {
  const database = await initOfflineDB();
  
  const workoutCache = await database.get('cachedWorkouts', workoutId);
  if (!workoutCache) return null;
  
  const workout = workoutCache.data;
  
  // Buscar dias do treino
  const days = await database.getAllFromIndex('cachedWorkoutDays', 'by-workoutId', workoutId);
  const daysWithExercises: CachedWorkoutDay[] = [];
  
  for (const dayCache of days) {
    const day = dayCache.data;
    
    // Buscar exercícios do dia
    const exercises = await database.getAllFromIndex('cachedExercises', 'by-workoutDayId', day.id);
    
    daysWithExercises.push({
      ...day,
      exercises: exercises.map(e => e.data).sort((a, b) => a.orderIndex - b.orderIndex)
    });
  }
  
  return {
    ...workout,
    days: daysWithExercises.sort((a, b) => a.dayOrder - b.dayOrder)
  };
}

// Verificar se treinos estão em cache
export async function hasWorkoutsInCache(studentId?: number): Promise<boolean> {
  const database = await initOfflineDB();
  
  if (studentId) {
    const workouts = await database.getAllFromIndex('cachedWorkouts', 'by-studentId', studentId);
    return workouts.length > 0;
  }
  
  const count = await database.count('cachedWorkouts');
  return count > 0;
}

// Obter data da última sincronização de treinos
export async function getWorkoutsCacheDate(studentId?: number): Promise<number | null> {
  const database = await initOfflineDB();
  const metadata = await database.get('cacheMetadata', `workouts_${studentId || 'all'}`);
  return metadata?.lastSync || null;
}

// Limpar cache de treinos de um aluno específico
export async function clearWorkoutsCache(studentId?: number): Promise<void> {
  const database = await initOfflineDB();
  
  // Buscar treinos para deletar
  let workoutsToDelete: any[];
  if (studentId) {
    workoutsToDelete = await database.getAllFromIndex('cachedWorkouts', 'by-studentId', studentId);
  } else {
    workoutsToDelete = await database.getAll('cachedWorkouts');
  }
  
  // Deletar exercícios e dias relacionados
  for (const workoutCache of workoutsToDelete) {
    const days = await database.getAllFromIndex('cachedWorkoutDays', 'by-workoutId', workoutCache.id);
    
    for (const dayCache of days) {
      // Deletar exercícios do dia
      const exercises = await database.getAllFromIndex('cachedExercises', 'by-workoutDayId', dayCache.id);
      for (const exercise of exercises) {
        await database.delete('cachedExercises', exercise.id);
      }
      
      // Deletar dia
      await database.delete('cachedWorkoutDays', dayCache.id);
    }
    
    // Deletar treino
    await database.delete('cachedWorkouts', workoutCache.id);
  }
  
  // Limpar metadados
  await database.delete('cacheMetadata', `workouts_${studentId || 'all'}`);
}

// ==================== CACHE METADATA ====================

// Atualizar metadados de cache
async function updateCacheMetadata(key: string, timestamp: number): Promise<void> {
  const database = await initOfflineDB();
  const existing = await database.get('cacheMetadata', key);
  
  await database.put('cacheMetadata', {
    key,
    lastSync: timestamp,
    version: (existing?.version || 0) + 1
  });
}

// Verificar se cache está expirado (24 horas por padrão)
export async function isCacheExpired(key: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
  const database = await initOfflineDB();
  const metadata = await database.get('cacheMetadata', key);
  
  if (!metadata) return true;
  
  return Date.now() - metadata.lastSync > maxAgeMs;
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

// Obter contagem de treinos em cache
export async function getCachedWorkoutsCount(): Promise<number> {
  const database = await initOfflineDB();
  return database.count('cachedWorkouts');
}

// ==================== LIMPAR DADOS ====================

// Limpar todos os dados offline (para debug/reset)
export async function clearOfflineData(): Promise<void> {
  const database = await initOfflineDB();
  await database.clear('pendingWorkoutLogs');
  await database.clear('pendingCardioLogs');
  await database.clear('cachedSessions');
  await database.clear('cachedWorkouts');
  await database.clear('cachedWorkoutDays');
  await database.clear('cachedExercises');
  await database.clear('syncQueue');
  await database.clear('cacheMetadata');
}

// Cachear treinos (versão legada para compatibilidade)
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

// ==================== REGISTROS DE TREINO OFFLINE (PERSONAL + ALUNO) ====================

// Tipos para registros de treino offline
export interface OfflineWorkoutSet {
  id: string; // ID temporário offline
  exerciseName: string;
  muscleGroup?: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  setType: string;
  notes?: string;
  completed: boolean;
}

export interface OfflineTrainingLog {
  id: string; // ID temporário offline
  studentId: number;
  workoutId?: number;
  workoutDayId?: number;
  date: string; // ISO date string
  startTime?: string;
  endTime?: string;
  duration?: number;
  feeling?: string;
  notes?: string;
  status: 'in_progress' | 'completed';
  sets: OfflineWorkoutSet[];
  createdAt: number;
  source: 'personal' | 'student'; // Quem criou o registro
  synced: boolean;
}

// Salvar registro de treino completo offline (com séries)
export async function saveTrainingLogOffline(log: Omit<OfflineTrainingLog, 'id' | 'createdAt' | 'synced'>): Promise<string> {
  const database = await initOfflineDB();
  const id = generateOfflineId();
  
  const fullLog: OfflineTrainingLog = {
    ...log,
    id,
    createdAt: Date.now(),
    synced: false
  };
  
  await database.put('pendingWorkoutLogs', {
    id,
    type: 'create',
    data: fullLog,
    createdAt: Date.now(),
    retryCount: 0
  });
  
  return id;
}

// Atualizar registro de treino offline (adicionar série, etc)
export async function updateTrainingLogOffline(id: string, updates: Partial<OfflineTrainingLog>): Promise<void> {
  const database = await initOfflineDB();
  const existing = await database.get('pendingWorkoutLogs', id);
  
  if (existing) {
    existing.data = { ...existing.data, ...updates };
    await database.put('pendingWorkoutLogs', existing);
  }
}

// Adicionar série a um registro de treino offline
export async function addSetToOfflineLog(logId: string, set: Omit<OfflineWorkoutSet, 'id'>): Promise<string> {
  const database = await initOfflineDB();
  const existing = await database.get('pendingWorkoutLogs', logId);
  
  if (!existing) {
    throw new Error('Registro de treino não encontrado');
  }
  
  const setId = generateOfflineId();
  const newSet: OfflineWorkoutSet = {
    ...set,
    id: setId
  };
  
  existing.data.sets = [...(existing.data.sets || []), newSet];
  await database.put('pendingWorkoutLogs', existing);
  
  return setId;
}

// Atualizar série em um registro de treino offline
export async function updateSetInOfflineLog(logId: string, setId: string, updates: Partial<OfflineWorkoutSet>): Promise<void> {
  const database = await initOfflineDB();
  const existing = await database.get('pendingWorkoutLogs', logId);
  
  if (!existing) {
    throw new Error('Registro de treino não encontrado');
  }
  
  existing.data.sets = (existing.data.sets || []).map((s: OfflineWorkoutSet) => 
    s.id === setId ? { ...s, ...updates } : s
  );
  await database.put('pendingWorkoutLogs', existing);
}

// Remover série de um registro de treino offline
export async function removeSetFromOfflineLog(logId: string, setId: string): Promise<void> {
  const database = await initOfflineDB();
  const existing = await database.get('pendingWorkoutLogs', logId);
  
  if (!existing) {
    throw new Error('Registro de treino não encontrado');
  }
  
  existing.data.sets = (existing.data.sets || []).filter((s: OfflineWorkoutSet) => s.id !== setId);
  await database.put('pendingWorkoutLogs', existing);
}

// Finalizar treino offline
export async function completeOfflineTrainingLog(logId: string, endTime?: string): Promise<void> {
  const database = await initOfflineDB();
  const existing = await database.get('pendingWorkoutLogs', logId);
  
  if (!existing) {
    throw new Error('Registro de treino não encontrado');
  }
  
  const startTime = existing.data.startTime ? new Date(existing.data.startTime).getTime() : existing.data.createdAt;
  const endTimeMs = endTime ? new Date(endTime).getTime() : Date.now();
  const duration = Math.round((endTimeMs - startTime) / 60000); // em minutos
  
  existing.data.status = 'completed';
  existing.data.endTime = endTime || new Date().toISOString();
  existing.data.duration = duration;
  
  await database.put('pendingWorkoutLogs', existing);
}

// Obter registro de treino offline por ID
export async function getOfflineTrainingLog(id: string): Promise<OfflineTrainingLog | null> {
  const database = await initOfflineDB();
  const log = await database.get('pendingWorkoutLogs', id);
  return log?.data || null;
}

// Obter todos os registros de treino offline (não sincronizados)
export async function getAllOfflineTrainingLogs(source?: 'personal' | 'student'): Promise<OfflineTrainingLog[]> {
  const database = await initOfflineDB();
  const logs = await database.getAllFromIndex('pendingWorkoutLogs', 'by-createdAt');
  
  const offlineLogs = logs
    .filter(l => l.data && typeof l.data === 'object' && 'source' in l.data)
    .map(l => l.data as OfflineTrainingLog);
  
  if (source) {
    return offlineLogs.filter(l => l.source === source);
  }
  
  return offlineLogs;
}

// Obter contagem de registros pendentes por fonte
export async function getPendingCountBySource(): Promise<{ personal: number; student: number; total: number }> {
  const database = await initOfflineDB();
  const logs = await database.getAll('pendingWorkoutLogs');
  
  let personal = 0;
  let student = 0;
  
  for (const log of logs) {
    if (log.data && typeof log.data === 'object' && 'source' in log.data) {
      if (log.data.source === 'personal') personal++;
      else if (log.data.source === 'student') student++;
    } else {
      // Registros antigos sem source são considerados do personal
      personal++;
    }
  }
  
  const cardioLogs = await database.count('pendingCardioLogs');
  const syncQueue = await database.count('syncQueue');
  
  return {
    personal: personal + cardioLogs,
    student,
    total: personal + student + cardioLogs + syncQueue
  };
}

// Verificar se há treino em andamento offline
export async function getInProgressOfflineLog(source: 'personal' | 'student', studentId?: number): Promise<OfflineTrainingLog | null> {
  const logs = await getAllOfflineTrainingLogs(source);
  
  const inProgress = logs.find(l => 
    l.status === 'in_progress' && 
    (!studentId || l.studentId === studentId)
  );
  
  return inProgress || null;
}
