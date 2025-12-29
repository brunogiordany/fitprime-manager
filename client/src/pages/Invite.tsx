import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Dumbbell, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Verificar se o convite é válido
  const { data: inviteData, isLoading: inviteLoading, error: inviteError } = trpc.students.validateInvite.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  // Mutation para aceitar o convite
  const acceptInviteMutation = trpc.students.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("Convite aceito com sucesso! Bem-vindo ao FitPrime!");
      setLocation("/meu-portal");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao aceitar convite");
    },
  });

  // Se o usuário está logado e o convite é válido, aceitar automaticamente
  useEffect(() => {
    if (user && inviteData?.valid && !acceptInviteMutation.isPending && !acceptInviteMutation.isSuccess) {
      acceptInviteMutation.mutate({ token: token || "" });
    }
  }, [user, inviteData, token]);

  const isLoading = authLoading || inviteLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando convite...</p>
        </div>
      </div>
    );
  }

  // Convite inválido ou expirado
  if (inviteError || (inviteData && !inviteData.valid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Convite Inválido</CardTitle>
            <CardDescription>
              {inviteData?.message || "Este convite não existe, já foi usado ou expirou."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Entre em contato com seu personal trainer para solicitar um novo convite.
            </p>
            <Button 
              variant="outline"
              onClick={() => setLocation("/")}
            >
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convite válido - mostrar informações e botão de login
  if (inviteData?.valid) {
    // Se já está logado, mostrar que está processando
    if (user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">Vinculando sua conta...</CardTitle>
              <CardDescription>
                Aguarde enquanto vinculamos sua conta ao perfil de aluno.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    // Não está logado - mostrar convite e botão de login
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Convite para o FitPrime</CardTitle>
            <CardDescription>
              Você foi convidado para acessar o Portal do Aluno
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Convite válido!</span>
              </div>
              <p className="text-sm text-emerald-600">
                Personal: <strong>{inviteData.personalName}</strong>
              </p>
              {inviteData.studentName && (
                <p className="text-sm text-emerald-600">
                  Aluno: <strong>{inviteData.studentName}</strong>
                </p>
              )}
            </div>

            <div className="text-sm text-gray-500 space-y-2">
              <p>Ao aceitar este convite, você terá acesso a:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Seus treinos personalizados</li>
                <li>Agenda de sessões</li>
                <li>Histórico de pagamentos</li>
                <li>Evolução e medidas</li>
                <li>Fotos de progresso</li>
              </ul>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={() => {
                // Salvar token no localStorage para usar após login
                localStorage.setItem("pendingInviteToken", token || "");
                window.location.href = getLoginUrl();
              }}
            >
              Aceitar Convite e Entrar
            </Button>

            <p className="text-xs text-center text-gray-400">
              Você será redirecionado para fazer login com sua conta Manus
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
