import { useOffline } from '@/contexts/OfflineContext';
import { WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  variant?: 'badge' | 'bar' | 'icon';
}

export function OfflineIndicator({
  className,
  showDetails = false,
  variant = 'badge',
}: OfflineIndicatorProps) {
  const { isOnline, pendingOperations, isSyncing, syncNow } = useOffline();

  // Se está online e não tem operações pendentes, não mostrar nada
  if (isOnline && pendingOperations === 0 && variant !== 'icon') {
    return null;
  }

  // Variante de ícone simples
  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', className)}>
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-amber-500" />
              )}
              {pendingOperations > 0 && (
                <span className="text-xs text-amber-600 font-medium">
                  {pendingOperations}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline ? (
              pendingOperations > 0 ? (
                <p>{pendingOperations} operação(ões) pendente(s)</p>
              ) : (
                <p>Conectado</p>
              )
            ) : (
              <p>Você está offline</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Variante de badge
  if (variant === 'badge') {
    if (!isOnline) {
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-amber-50 text-amber-700 border-amber-200 gap-1.5',
            className
          )}
        >
          <WifiOff className="h-3 w-3" />
          Offline
          {pendingOperations > 0 && (
            <span className="ml-1 bg-amber-200 px-1.5 py-0.5 rounded-full text-xs">
              {pendingOperations}
            </span>
          )}
        </Badge>
      );
    }

    if (pendingOperations > 0) {
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-blue-50 text-blue-700 border-blue-200 gap-1.5 cursor-pointer',
            className
          )}
          onClick={() => !isSyncing && syncNow()}
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Cloud className="h-3 w-3" />
          )}
          {isSyncing ? 'Sincronizando...' : `${pendingOperations} pendente(s)`}
        </Badge>
      );
    }

    return null;
  }

  // Variante de barra (para topo da página)
  if (variant === 'bar') {
    if (!isOnline) {
      return (
        <div
          className={cn(
            'w-full bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm',
            className
          )}
        >
          <WifiOff className="h-4 w-4" />
          <span>Você está offline. Suas alterações serão salvas localmente.</span>
          {pendingOperations > 0 && (
            <Badge variant="secondary" className="ml-2 bg-amber-600">
              {pendingOperations} pendente(s)
            </Badge>
          )}
        </div>
      );
    }

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
              <Cloud className="h-4 w-4" />
              <span>{pendingOperations} operação(ões) pendente(s)</span>
              <Button
                size="sm"
                variant="secondary"
                className="ml-2 h-6 text-xs"
                onClick={syncNow}
              >
                Sincronizar agora
              </Button>
            </>
          )}
        </div>
      );
    }

    return null;
  }

  return null;
}

// Componente de status detalhado para configurações
export function OfflineStatusDetails() {
  const { isOnline, pendingOperations, isSyncing, syncNow, cacheSize } = useOffline();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Cloud className="h-5 w-5 text-green-500" />
          ) : (
            <CloudOff className="h-5 w-5 text-amber-500" />
          )}
          <span className="font-medium">
            {isOnline ? 'Conectado' : 'Offline'}
          </span>
        </div>
        <Badge variant={isOnline ? 'default' : 'secondary'}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Operações pendentes</p>
          <p className="font-medium">{pendingOperations}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Cache local</p>
          <p className="font-medium">{formatBytes(cacheSize)}</p>
        </div>
      </div>

      {pendingOperations > 0 && isOnline && (
        <Button
          onClick={syncNow}
          disabled={isSyncing}
          className="w-full"
          size="sm"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar agora
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default OfflineIndicator;
