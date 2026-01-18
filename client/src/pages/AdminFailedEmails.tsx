import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Mail,
  Send,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";

interface FailedEmail {
  id: number;
  leadEmail: string;
  subject: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  leadName: string | null;
  recommendedPlan: string | null;
}

export default function AdminFailedEmails() {
  const auth = useAuth();
  const user = auth.user;
  const authLoading = (auth as any).loading ?? false;
  const [selectedEmail, setSelectedEmail] = useState<FailedEmail | null>(null);
  const [showResendAllDialog, setShowResendAllDialog] = useState(false);
  const [resendingAll, setResendingAll] = useState(false);

  // Query para listar emails com falha
  const { data: failedEmails, isLoading, refetch } = trpc.quiz.listFailedEmails.useQuery();

  // Mutation para reenviar email individual
  const resendEmailMutation = trpc.quiz.resendEmail.useMutation({
    onSuccess: () => {
      toast.success("Email reagendado para envio!");
      refetch();
      setSelectedEmail(null);
    },
    onError: (error) => {
      toast.error(`Erro ao reenviar: ${error.message}`);
    },
  });

  // Mutation para reenviar todos os emails com falha
  const resendAllMutation = trpc.quiz.resendFailedEmails.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setShowResendAllDialog(false);
      setResendingAll(false);
    },
    onError: (error) => {
      toast.error(`Erro ao reenviar: ${error.message}`);
      setResendingAll(false);
    },
  });

  // Verificar autenticação
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const handleResendEmail = (email: FailedEmail) => {
    // Buscar o leadId pelo email
    resendEmailMutation.mutate({ leadId: email.id });
  };

  const handleResendAll = () => {
    setResendingAll(true);
    resendAllMutation.mutate();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Falhou</Badge>;
      case "bounced":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Rejeitado</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case "sent":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Enviado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Mail className="h-6 w-6 text-destructive" />
                  Emails com Falha
                </h1>
                <p className="text-muted-foreground">
                  Gerencie e reenvie emails que falharam no envio
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              {failedEmails && failedEmails.length > 0 && (
                <Button 
                  variant="default"
                  onClick={() => setShowResendAllDialog(true)}
                  className="bg-primary"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reenviar Todos ({failedEmails.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total com Falha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {failedEmails?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Falhou
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {failedEmails?.filter(e => e.status === "failed").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Rejeitado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {failedEmails?.filter(e => e.status === "bounced").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Emails com Falha</CardTitle>
            <CardDescription>
              Emails que não foram entregues aos destinatários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !failedEmails || failedEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">Nenhum email com falha!</h3>
                <p className="text-muted-foreground">
                  Todos os emails foram enviados com sucesso.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">
                          {email.leadName || "-"}
                        </TableCell>
                        <TableCell>{email.leadEmail}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {email.subject}
                        </TableCell>
                        <TableCell>{getStatusBadge(email.status)}</TableCell>
                        <TableCell>
                          {email.recommendedPlan ? (
                            <Badge variant="outline">{email.recommendedPlan}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{formatDate(email.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEmail(email)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Reenviar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação para reenviar individual */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar Email</DialogTitle>
            <DialogDescription>
              Deseja reenviar o email para este lead?
            </DialogDescription>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Lead:</span>
                  <p className="font-medium">{selectedEmail.leadName || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedEmail.leadEmail}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Assunto:</span>
                  <p className="font-medium">{selectedEmail.subject}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEmail(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedEmail && handleResendEmail(selectedEmail)}
              disabled={resendEmailMutation.isPending}
            >
              {resendEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Reenviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para reenviar todos */}
      <AlertDialog open={showResendAllDialog} onOpenChange={setShowResendAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reenviar Todos os Emails?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá reagendar {failedEmails?.length || 0} email(s) para envio.
              Os emails serão processados em segundo plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resendingAll}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResendAll} disabled={resendingAll}>
              {resendingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reenviar Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
