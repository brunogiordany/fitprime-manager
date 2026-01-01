import { useOffline } from '@/contexts/OfflineContext';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface OfflineStatusBarProps {
  className?: string;
}

export function OfflineStatusBar({ className }: OfflineStatusBarProps) {
  const { isOnline, wasOffline, pendingOperations, isSyncing, syncNow } = useOffline();
  const [showReconnected, setShowReconnected] = useState(false);

  // Mostrar mensagem de reconexão temporariamente
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  // Não mostrar nada se está online, sem pendências e não reconectou recentemente
  if (isOnline && pendingOperations === 0 && !showReconnected) {
    return null;
  }

  // Barra de reconexão (verde)
  if (showReconnected && isOnline && pendingOperations === 0) {
    return (
      <div
        className={cn(
          'w-full bg-emerald-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm animate-in slide-in-from-top duration-300',
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>Conexão restaurada!</span>
      </div>
    );
  }

  // Barra offline (amarela/laranja)
  if (!isOnline) {
    return (
      <div
        className={cn(
          'w-full bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm',
          className
        )}
      >
        <WifiOff className="h-4 w-4" />
        <span>Você está offline</span>
        {pendingOperations > 0 && (
          <span className="bg-amber-600 px-2 py-0.5 rounded-full text-xs">
            {pendingOperations} pendente{pendingOperations > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  // Barra de sincronização (azul)
  if (pendingOperations > 0) {
    return (
      <div
        className={cn(
          'w-full bg-blue-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm',
          className
        )}
      >
        {isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Sincronizando {pendingOperations} operação(ões)...</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>{pendingOperations} operação(ões) pendente(s)</span>
            <Button
              size="sm"
              variant="secondary"
              className="ml-2 h-6 text-xs bg-white/20 hover:bg-white/30 text-white"
              onClick={syncNow}
            >
              Sincronizar
            </Button>
          </>
        )}
      </div>
    );
  }

  return null;
}

// Versão compacta para usar em headers
export function OfflineStatusCompact({ className }: { className?: string }) {
  const { isOnline, pendingOperations, isSyncing } = useOffline();

  if (isOnline && pendingOperations === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        !isOnline
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        className
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Sincronizando...</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>{pendingOperations} pendente{pendingOperations > 1 ? 's' : ''}</span>
        </>
      )}
    </div>
  );
}

export default OfflineStatusBar;
