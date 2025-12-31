import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Dumbbell, Loader2, Eye, EyeOff, Mail, Lock, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Estados para recuperação de senha
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'newPassword' | 'success'>('email');
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Verificar se já está logado
  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    if (token) {
      setLocation("/meu-portal");
    }
  }, []);

  // Mutation para login
  const loginMutation = trpc.students.loginStudent.useMutation({
    onSuccess: (data) => {
      toast.success(`Bem-vindo, ${data.studentName}!`);
      localStorage.setItem("studentToken", data.token);
      localStorage.setItem("studentId", String(data.studentId));
      localStorage.setItem("studentData", JSON.stringify({
        id: data.studentId,
        name: data.studentName,
        email: loginForm.email,
      }));
      setLocation("/meu-portal");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  // Mutation para solicitar recuperação de senha
  const requestResetMutation = trpc.students.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Código enviado para seu email!");
      setForgotPasswordStep('code');
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar código");
    },
  });

  // Mutation para verificar código
  const verifyCodeMutation = trpc.students.verifyResetCode.useMutation({
    onSuccess: () => {
      setForgotPasswordStep('newPassword');
    },
    onError: (error: any) => {
      toast.error(error.message || "Código inválido ou expirado");
    },
  });

  // Mutation para redefinir senha
  const resetPasswordMutation = trpc.students.resetPassword.useMutation({
    onSuccess: () => {
      setForgotPasswordStep('success');
      toast.success("Senha redefinida com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao redefinir senha");
    },
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!loginForm.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
      errors.email = "Email inválido";
    }
    if (!loginForm.password) {
      errors.password = "Senha é obrigatória";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = () => {
    if (!validateForm()) return;
    
    loginMutation.mutate({
      email: loginForm.email,
      password: loginForm.password,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleRequestReset = () => {
    if (!forgotPasswordEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      toast.error("Digite um email válido");
      return;
    }
    requestResetMutation.mutate({ email: forgotPasswordEmail });
  };

  const handleVerifyCode = () => {
    if (!resetCode.trim() || resetCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    verifyCodeMutation.mutate({ email: forgotPasswordEmail, code: resetCode });
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    resetPasswordMutation.mutate({ 
      email: forgotPasswordEmail, 
      code: resetCode, 
      newPassword 
    });
  };

  const closeForgotPasswordDialog = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotPasswordEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const openForgotPassword = () => {
    setForgotPasswordEmail(loginForm.email);
    setShowForgotPassword(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Portal do Aluno</CardTitle>
          <CardDescription>
            Acesse sua conta para ver seus treinos e acompanhar sua evolução
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              onKeyPress={handleKeyPress}
              placeholder="seu@email.com"
              className={formErrors.email ? "border-red-500" : ""}
            />
            {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </Label>
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="Sua senha"
                className={formErrors.password ? "border-red-500 pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            onClick={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              Ainda não tem conta?
            </p>
            <p className="text-xs text-gray-400">
              Solicite um convite ao seu personal trainer para criar sua conta.
            </p>
          </div>

          <Button 
            variant="ghost"
            className="w-full"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o início
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de Recuperação de Senha */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-600" />
              {forgotPasswordStep === 'success' ? 'Senha Redefinida!' : 'Recuperar Senha'}
            </DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'email' && 'Digite seu email para receber um código de recuperação.'}
              {forgotPasswordStep === 'code' && 'Digite o código de 6 dígitos enviado para seu email.'}
              {forgotPasswordStep === 'newPassword' && 'Crie uma nova senha para sua conta.'}
              {forgotPasswordStep === 'success' && 'Sua senha foi redefinida com sucesso!'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {forgotPasswordStep === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="seu@email.com"
                    onKeyPress={(e) => e.key === 'Enter' && handleRequestReset()}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={handleRequestReset}
                  disabled={requestResetMutation.isPending}
                >
                  {requestResetMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar código"
                  )}
                </Button>
              </>
            )}

            {forgotPasswordStep === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-code">Código de verificação</Label>
                  <Input
                    id="reset-code"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Código enviado para {forgotPasswordEmail}
                  </p>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar código"
                  )}
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full"
                  onClick={() => setForgotPasswordStep('email')}
                >
                  Voltar
                </Button>
              </>
            )}

            {forgotPasswordStep === 'newPassword' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente"
                    onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Redefinindo...
                    </>
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </>
            )}

            {forgotPasswordStep === 'success' && (
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-gray-600">
                  Você já pode fazer login com sua nova senha.
                </p>
                <Button 
                  className="w-full"
                  onClick={closeForgotPasswordDialog}
                >
                  Fazer login
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
