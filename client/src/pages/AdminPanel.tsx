import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, 
  Users, 
  Gift, 
  Ban, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonal, setSelectedPersonal] = useState<any>(null);
  const [grantDays, setGrantDays] = useState(30);
  const [activateDays, setActivateDays] = useState(30);
  const [dialogType, setDialogType] = useState<'grant' | 'revoke' | 'activate' | 'cancel' | null>(null);

  // Verificar se é o owner
  const { data: ownerCheck, isLoading: checkingOwner } = trpc.admin.isOwner.useQuery();
  
  // Listar todos os personais
  const { data: personals, isLoading, refetch } = trpc.admin.listPersonals.useQuery(undefined, {
    enabled: ownerCheck?.isOwner === true,
  });

  // Mutations
  const grantTestAccess = trpc.admin.grantTestAccess.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const revokeTestAccess = trpc.admin.revokeTestAccess.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const activateSubscription = trpc.admin.activateSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelSubscription = trpc.admin.cancelSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Se não é owner, redirecionar
  if (!checkingOwner && !ownerCheck?.isOwner) {
    return <Redirect to="/dashboard" />;
  }

  if (checkingOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filtrar personais
  const filteredPersonals = personals?.filter((p: any) => {
    const search = searchTerm.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(search) ||
      p.userEmail?.toLowerCase().includes(search) ||
      p.businessName?.toLowerCase().includes(search) ||
      p.whatsappNumber?.includes(search)
    );
  }) || [];

  // Helpers para status
  const getStatusBadge = (personal: any) => {
    const now = new Date();
    
    // Verificar acesso de teste
    if (personal.testAccessEndsAt && new Date(personal.testAccessEndsAt) > now) {
      const daysLeft = Math.ceil((new Date(personal.testAccessEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
          <Gift className="w-3 h-3 mr-1" />
          Teste ({daysLeft}d)
        </Badge>
      );
    }
    
    // Verificar status da assinatura
    if (personal.subscriptionStatus === 'active') {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    
    if (personal.subscriptionStatus === 'trial') {
      // Verificar se trial expirou
      if (personal.trialEndsAt && new Date(personal.trialEndsAt) < now) {
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Trial Expirado
          </Badge>
        );
      }
      // Calcular horas restantes do trial
      const createdAt = new Date(personal.createdAt);
      const trialEnd = personal.trialEndsAt ? new Date(personal.trialEndsAt) : new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      if (trialEnd < now) {
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Trial Expirado
          </Badge>
        );
      }
      const hoursLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Clock className="w-3 h-3 mr-1" />
          Trial ({hoursLeft}h)
        </Badge>
      );
    }
    
    if (personal.subscriptionStatus === 'cancelled') {
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          <Ban className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      );
    }
    
    if (personal.subscriptionStatus === 'expired') {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        Desconhecido
      </Badge>
    );
  };

  const handleAction = (personal: any, action: 'grant' | 'revoke' | 'activate' | 'cancel') => {
    setSelectedPersonal(personal);
    setDialogType(action);
  };

  const confirmAction = () => {
    if (!selectedPersonal) return;

    switch (dialogType) {
      case 'grant':
        grantTestAccess.mutate({ personalId: selectedPersonal.id, days: grantDays });
        break;
      case 'revoke':
        revokeTestAccess.mutate({ personalId: selectedPersonal.id });
        break;
      case 'activate':
        activateSubscription.mutate({ personalId: selectedPersonal.id, days: activateDays });
        break;
      case 'cancel':
        cancelSubscription.mutate({ personalId: selectedPersonal.id });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-600" />
              Painel de Administração
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie acessos de teste e assinaturas dos personais
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Personais</p>
                  <p className="text-2xl font-bold">{personals?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ativos</p>
                  <p className="text-2xl font-bold">
                    {personals?.filter((p: any) => p.subscriptionStatus === 'active').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Acesso Teste</p>
                  <p className="text-2xl font-bold">
                    {personals?.filter((p: any) => p.testAccessEndsAt && new Date(p.testAccessEndsAt) > new Date()).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Em Trial</p>
                  <p className="text-2xl font-bold">
                    {personals?.filter((p: any) => p.subscriptionStatus === 'trial').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <CardTitle>Personais Cadastrados</CardTitle>
            <CardDescription>
              Gerencie acessos de teste e assinaturas
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email, empresa ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personal</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonals.map((personal: any) => (
                    <TableRow key={personal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{personal.userName || 'Sem nome'}</p>
                          <p className="text-sm text-gray-500">{personal.businessName || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{personal.userEmail || '-'}</p>
                          <p className="text-sm text-gray-500">{personal.whatsappNumber || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(personal)}
                        {personal.testAccessGrantedBy && personal.testAccessEndsAt && new Date(personal.testAccessEndsAt) > new Date() && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {personal.testAccessGrantedBy}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(personal.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {/* Botão para liberar acesso de teste */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() => handleAction(personal, 'grant')}
                          >
                            <Gift className="w-4 h-4 mr-1" />
                            Teste
                          </Button>
                          
                          {/* Botão para revogar acesso de teste (se tiver) */}
                          {personal.testAccessEndsAt && new Date(personal.testAccessEndsAt) > new Date() && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleAction(personal, 'revoke')}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Revogar
                            </Button>
                          )}
                          
                          {/* Botão para ativar assinatura */}
                          {personal.subscriptionStatus !== 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleAction(personal, 'activate')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Ativar
                            </Button>
                          )}
                          
                          {/* Botão para cancelar assinatura */}
                          {personal.subscriptionStatus === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-600 border-gray-200 hover:bg-gray-50"
                              onClick={() => handleAction(personal, 'cancel')}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPersonals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Nenhum personal encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação */}
      <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'grant' && 'Liberar Acesso de Teste'}
              {dialogType === 'revoke' && 'Revogar Acesso de Teste'}
              {dialogType === 'activate' && 'Ativar Assinatura'}
              {dialogType === 'cancel' && 'Cancelar Assinatura'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'grant' && (
                <>
                  Liberar acesso de teste para <strong>{selectedPersonal?.userName}</strong>.
                  Durante o período de teste, o personal terá acesso completo ao sistema.
                </>
              )}
              {dialogType === 'revoke' && (
                <>
                  Revogar acesso de teste de <strong>{selectedPersonal?.userName}</strong>.
                  O personal perderá o acesso imediatamente.
                </>
              )}
              {dialogType === 'activate' && (
                <>
                  Ativar assinatura de <strong>{selectedPersonal?.userName}</strong>.
                  O personal terá acesso completo ao sistema.
                </>
              )}
              {dialogType === 'cancel' && (
                <>
                  Cancelar assinatura de <strong>{selectedPersonal?.userName}</strong>.
                  O personal perderá o acesso ao sistema.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {dialogType === 'grant' && (
            <div className="py-4">
              <label className="text-sm font-medium">Duração do acesso (dias)</label>
              <Input
                type="number"
                value={grantDays}
                onChange={(e) => setGrantDays(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                className="mt-2"
              />
            </div>
          )}

          {dialogType === 'activate' && (
            <div className="py-4">
              <label className="text-sm font-medium">Duração da assinatura (dias)</label>
              <Input
                type="number"
                value={activateDays}
                onChange={(e) => setActivateDays(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                className="mt-2"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAction}
              className={
                dialogType === 'grant' ? 'bg-purple-600 hover:bg-purple-700' :
                dialogType === 'revoke' ? 'bg-red-600 hover:bg-red-700' :
                dialogType === 'activate' ? 'bg-green-600 hover:bg-green-700' :
                'bg-gray-600 hover:bg-gray-700'
              }
              disabled={
                grantTestAccess.isPending ||
                revokeTestAccess.isPending ||
                activateSubscription.isPending ||
                cancelSubscription.isPending
              }
            >
              {(grantTestAccess.isPending || revokeTestAccess.isPending || activateSubscription.isPending || cancelSubscription.isPending) ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
