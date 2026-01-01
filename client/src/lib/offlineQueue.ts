// Sistema de fila para operações offline
// Armazena operações no localStorage e sincroniza quando voltar online

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string; // 'workout_log', 'exercise_log', 'measurement', etc.
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

const QUEUE_KEY = 'fitprime_offline_queue';
const MAX_RETRIES = 3;

// Gerar ID único
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Obter fila do localStorage
export function getOfflineQueue(): OfflineOperation[] {
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

// Salvar fila no localStorage
function saveQueue(queue: OfflineOperation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[OfflineQueue] Erro ao salvar fila:', error);
  }
}

// Adicionar operação à fila
export function addToOfflineQueue(
  type: OfflineOperation['type'],
  entity: string,
  data: Record<string, unknown>
): OfflineOperation {
  const operation: OfflineOperation = {
    id: generateId(),
    type,
    entity,
    data,
    timestamp: Date.now(),
    retries: 0,
    status: 'pending',
  };

  const queue = getOfflineQueue();
  queue.push(operation);
  saveQueue(queue);

  console.log('[OfflineQueue] Operação adicionada:', operation);
  return operation;
}

// Remover operação da fila
export function removeFromQueue(operationId: string): void {
  const queue = getOfflineQueue();
  const filtered = queue.filter((op) => op.id !== operationId);
  saveQueue(filtered);
}

// Atualizar status de uma operação
export function updateOperationStatus(
  operationId: string,
  status: OfflineOperation['status']
): void {
  const queue = getOfflineQueue();
  const operation = queue.find((op) => op.id === operationId);
  if (operation) {
    operation.status = status;
    if (status === 'failed') {
      operation.retries += 1;
    }
    saveQueue(queue);
  }
}

// Obter operações pendentes
export function getPendingOperations(): OfflineOperation[] {
  return getOfflineQueue().filter(
    (op) => op.status === 'pending' && op.retries < MAX_RETRIES
  );
}

// Obter contagem de operações pendentes
export function getPendingCount(): number {
  return getPendingOperations().length;
}

// Limpar operações completadas
export function clearCompletedOperations(): void {
  const queue = getOfflineQueue();
  const pending = queue.filter((op) => op.status !== 'completed');
  saveQueue(pending);
}

// Limpar toda a fila
export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

// Verificar se há operações pendentes para uma entidade específica
export function hasPendingOperationsFor(entity: string): boolean {
  return getPendingOperations().some((op) => op.entity === entity);
}

// Obter operações por entidade
export function getOperationsByEntity(entity: string): OfflineOperation[] {
  return getOfflineQueue().filter((op) => op.entity === entity);
}

// Exportar para debug
export function debugQueue(): void {
  console.log('[OfflineQueue] Estado atual:', getOfflineQueue());
}
