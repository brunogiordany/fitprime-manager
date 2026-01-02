import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  History, 
  RotateCcw, 
  Eye, 
  Clock, 
  User,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PageVersionHistoryProps {
  pageId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (versionData: any) => void;
}

export function PageVersionHistory({ 
  pageId, 
  open, 
  onOpenChange, 
  onRestore 
}: PageVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Buscar versões da página
  const { data: versions = [], isLoading, refetch } = trpc.pageVersions.list.useQuery(
    { pageId },
    { enabled: open }
  );
  
  // Mutation para restaurar versão
  const restoreMutation = trpc.pageVersions.restore.useMutation({
    onSuccess: (data) => {
      toast.success("Versão restaurada com sucesso!");
      onRestore(data);
      onOpenChange(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao restaurar versão");
    }
  });

  const handleRestore = async () => {
    if (!selectedVersion) return;
    
    setIsRestoring(true);
    try {
      await restoreMutation.mutateAsync({ 
        pageId, 
        versionId: selectedVersion.id 
      });
    } finally {
      setIsRestoring(false);
      setShowConfirmRestore(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeDiff = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDate(date);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Versões
            </DialogTitle>
            <DialogDescription>
              Visualize e restaure versões anteriores da página
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma versão salva</p>
              <p className="text-sm">As versões são criadas automaticamente ao salvar a página</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {versions.map((version: any, index: number) => (
                  <div 
                    key={version.id}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                      selectedVersion?.id === version.id 
                        ? "border-emerald-500 bg-emerald-50" 
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Versão {versions.length - index}
                          </span>
                          {index === 0 && (
                            <Badge variant="default" className="bg-emerald-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Atual
                            </Badge>
                          )}
                          {version.isPublished && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              Publicada
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeDiff(version.createdAt)}
                          </span>
                          {version.createdBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.createdBy}
                            </span>
                          )}
                        </div>
                        
                        {version.changeDescription && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {version.changeDescription}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVersion(version);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        {index > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVersion(version);
                              setShowConfirmRestore(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restaurar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview da Versão</DialogTitle>
            <DialogDescription>
              {selectedVersion && formatDate(selectedVersion.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-100 rounded-lg p-4 max-h-[500px] overflow-auto">
            {selectedVersion?.content && (
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(JSON.parse(selectedVersion.content), null, 2)}
              </pre>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setShowPreview(false);
              setShowConfirmRestore(true);
            }}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Restaurar Esta Versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmação de Restauração */}
      <AlertDialog open={showConfirmRestore} onOpenChange={setShowConfirmRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Restaurar Versão?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá substituir o conteúdo atual da página pela versão selecionada.
              Uma nova versão será criada automaticamente com o estado atual antes da restauração.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore}
              disabled={isRestoring}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isRestoring ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PageVersionHistory;
