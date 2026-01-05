import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  Dumbbell, 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowLeft, 
  KeyRound, 
  CheckCircle2,
  User,
  Phone,
  CreditCard,
  Award
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type AuthMode = "login" | "register";

export default function PersonalLogin() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  
  // Login form
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  
  // Register form
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cpf: "",
    cref: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'newPassword' | 'success'>('email');
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Password setup states (para contas OAuth que precisam definir senha)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupStep, setSetupStep] = useState<'code' | 'newPassword' | 'success'>('code');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Check if already logged in - mas não redirecionar automaticamente
  // O usuário pode querer fazer login com outra conta
  const { data: user, isLoading: isCheckingAuth } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  
  useEffect(() => {
    
    // Load saved email if "Remember me" was active
    const savedEmail = localStorage.getItem("personalRememberEmail");
    if (savedEmail) {
      setLoginForm(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Login mutation
  const loginMutation = trpc.auth.loginPersonal.useMutation({
    onSuccess: async (data) => {
      toast.success(`Bem-vindo, ${data.userName}!`);
      
      if (rememberMe) {
        localStorage.setItem("personalRememberEmail", loginForm.email);
      } else {
        localStorage.removeItem("personalRememberEmail");
      }
      
      // Invalidar o cache do auth.me para forçar nova verificação
      await utils.auth.me.invalidate();
      
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      // Verificar se precisa configurar senha (conta OAuth)
      if (error.message === 'NEEDS_PASSWORD_SETUP') {
        setSetupEmail(loginForm.email);
        setShowPasswordSetup(true);
        setSetupStep('code');
        toast.info('Enviamos um código para seu email. Use-o para definir sua senha.');
        return;
      }
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  // Register mutation
  const registerMutation = trpc.auth.registerPersonal.useMutation({
    onSuccess: async (data) => {
      toast.success(`Conta criada com sucesso! Bem-vindo, ${data.userName}!`);
      
      // Invalidar o cache do auth.me para forçar nova verificação
      await utils.auth.me.invalidate();
      
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });

  // Password reset mutations
  const requestResetMutation = trpc.auth.requestPersonalPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Código enviado para seu email!");
      setForgotPasswordStep('code');
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar código");
    },
  });

  const verifyCodeMutation = trpc.auth.verifyPersonalResetCode.useMutation({
    onSuccess: () => {
      setForgotPasswordStep('newPassword');
    },
    onError: (error: any) => {
      toast.error(error.message || "Código inválido ou expirado");
    },
  });

  const resetPasswordMutation = trpc.auth.resetPersonalPassword.useMutation({
    onSuccess: () => {
      setForgotPasswordStep('success');
      toast.success("Senha redefinida com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao redefinir senha");
    },
  });

  const validateLoginForm = () => {
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

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {};
    
    if (!registerForm.name.trim()) {
      errors.name = "Nome é obrigatório";
    } else if (registerForm.name.trim().length < 2) {
      errors.name = "Nome deve ter pelo menos 2 caracteres";
    }
    
    if (!registerForm.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = "Email inválido";
    }
    
    if (!registerForm.password) {
      errors.password = "Senha é obrigatória";
    } else if (registerForm.password.length < 6) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "As senhas não coincidem";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = () => {
    if (!validateLoginForm()) return;
    
    loginMutation.mutate({
      email: loginForm.email,
      password: loginForm.password,
    });
  };

  const handleRegister = () => {
    if (!validateRegisterForm()) return;
    
    registerMutation.mutate({
      email: registerForm.email,
      password: registerForm.password,
      name: registerForm.name,
      phone: registerForm.phone || undefined,
      cpf: registerForm.cpf || undefined,
      cref: registerForm.cref || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (authMode === "login") {
        handleLogin();
      } else {
        handleRegister();
      }
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
    if (newPassword !== confirmNewPassword) {
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
    setConfirmNewPassword("");
  };

  const openForgotPassword = () => {
    setForgotPasswordEmail(loginForm.email);
    setShowForgotPassword(true);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo FitPrime */}
        <div className="text-center mb-8">
          <img 
            src="/fitprime-logo.png" 
            alt="FitPrime Manager" 
            className="h-20 mx-auto mb-2"
          />
        </div>

        <Card className="border-0 shadow-2xl bg-slate-800/50 backdrop-blur border border-emerald-500/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-white">
              Área do Personal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Gerencie seus alunos e negócio
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Tabs value={authMode} onValueChange={(v) => { setAuthMode(v as AuthMode); setFormErrors({}); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-700/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                  Criar Conta
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="flex items-center gap-2 text-slate-300">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    placeholder="seu@email.com"
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 ${formErrors.email ? "border-red-500" : ""}`}
                  />
                  {formErrors.email && <p className="text-xs text-red-400">{formErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="flex items-center gap-2 text-slate-300">
                      <Lock className="h-4 w-4" />
                      Senha
                    </Label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      placeholder="Sua senha"
                      className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-10 ${formErrors.password ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-xs text-red-400">{formErrors.password}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-slate-600 data-[state=checked]:bg-emerald-600"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm text-slate-400 cursor-pointer select-none"
                  >
                    Lembrar de mim
                  </label>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
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
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="flex items-center gap-2 text-slate-300">
                    <User className="h-4 w-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    placeholder="Seu nome completo"
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 ${formErrors.name ? "border-red-500" : ""}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center gap-2 text-slate-300">
                    <Mail className="h-4 w-4" />
                    Email *
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    placeholder="seu@email.com"
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 ${formErrors.email ? "border-red-500" : ""}`}
                  />
                  {formErrors.email && <p className="text-xs text-red-400">{formErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center gap-2 text-slate-300">
                      <Lock className="h-4 w-4" />
                      Senha *
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                        onKeyPress={handleKeyPress}
                        placeholder="Min. 6 caracteres"
                        className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-10 ${formErrors.password ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formErrors.password && <p className="text-xs text-red-400">{formErrors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="flex items-center gap-2 text-slate-300">
                      <Lock className="h-4 w-4" />
                      Confirmar *
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        onKeyPress={handleKeyPress}
                        placeholder="Repita a senha"
                        className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-10 ${formErrors.confirmPassword ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formErrors.confirmPassword && <p className="text-xs text-red-400">{formErrors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-cref" className="flex items-center gap-2 text-slate-300">
                      <Award className="h-4 w-4" />
                      CREF
                    </Label>
                    <Input
                      id="register-cref"
                      type="text"
                      value={registerForm.cref}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, cref: e.target.value }))}
                      placeholder="000000-G/SP"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Ao criar sua conta, você concorda com nossos Termos de Uso e Política de Privacidade.
                </p>
              </TabsContent>
            </Tabs>

            {/* Back button */}
            <Button
              variant="ghost"
              className="w-full mt-4 text-slate-400 hover:text-white hover:bg-slate-700/50"
              onClick={() => setLocation("/login")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} FitPrime. Todos os direitos reservados.
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-400" />
              {forgotPasswordStep === 'success' ? 'Senha Redefinida!' : 'Recuperar Senha'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {forgotPasswordStep === 'email' && 'Digite seu email para receber o código de recuperação'}
              {forgotPasswordStep === 'code' && 'Digite o código de 6 dígitos enviado para seu email'}
              {forgotPasswordStep === 'newPassword' && 'Digite sua nova senha'}
              {forgotPasswordStep === 'success' && 'Sua senha foi alterada com sucesso!'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {forgotPasswordStep === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-300">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-purple-700"
                  onClick={handleRequestReset}
                  disabled={requestResetMutation.isPending}
                >
                  {requestResetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Enviar Código
                </Button>
              </>
            )}

            {forgotPasswordStep === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-code" className="text-slate-300">Código de Verificação</Label>
                  <Input
                    id="reset-code"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest"
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-purple-700"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verificar Código
                </Button>
              </>
            )}

            {forgotPasswordStep === 'newPassword' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-300">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-slate-700/50 border-slate-600 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password" className="text-slate-300">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-purple-700"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Redefinir Senha
                </Button>
              </>
            )}

            {forgotPasswordStep === 'success' && (
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-slate-300">
                  Você já pode fazer login com sua nova senha.
                </p>
                <Button
                  className="w-full bg-emerald-600 hover:bg-purple-700"
                  onClick={closeForgotPasswordDialog}
                >
                  Fazer Login
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para configurar senha (contas OAuth) */}
      <Dialog open={showPasswordSetup} onOpenChange={setShowPasswordSetup}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-400" />
              Configurar Senha
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {setupStep === 'code' && 'Digite o código de 6 dígitos enviado para seu email'}
              {setupStep === 'newPassword' && 'Crie uma senha para acessar sua conta'}
              {setupStep === 'success' && 'Senha configurada com sucesso!'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {setupStep === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="setup-code" className="text-slate-300">Código de Verificação</Label>
                  <Input
                    id="setup-code"
                    type="text"
                    maxLength={6}
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest"
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  onClick={() => {
                    if (setupCode.length !== 6) {
                      toast.error('Digite o código de 6 dígitos');
                      return;
                    }
                    verifyCodeMutation.mutate(
                      { email: setupEmail, code: setupCode },
                      {
                        onSuccess: () => setSetupStep('newPassword'),
                        onError: (err: any) => toast.error(err.message || 'Código inválido')
                      }
                    );
                  }}
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verificar Código
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Não recebeu? Verifique sua caixa de spam ou tente novamente.
                </p>
              </>
            )}

            {setupStep === 'newPassword' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="setup-password" className="text-slate-300">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="setup-password"
                      type={showSetupPassword ? "text" : "password"}
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-slate-700/50 border-slate-600 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showSetupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-confirm-password" className="text-slate-300">Confirmar Senha</Label>
                  <Input
                    id="setup-confirm-password"
                    type="password"
                    value={setupConfirmPassword}
                    onChange={(e) => setSetupConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  onClick={() => {
                    if (setupPassword.length < 6) {
                      toast.error('Senha deve ter pelo menos 6 caracteres');
                      return;
                    }
                    if (setupPassword !== setupConfirmPassword) {
                      toast.error('As senhas não coincidem');
                      return;
                    }
                    resetPasswordMutation.mutate(
                      { email: setupEmail, code: setupCode, newPassword: setupPassword },
                      {
                        onSuccess: () => {
                          setSetupStep('success');
                          // Login automático após definir senha
                          setTimeout(() => {
                            loginMutation.mutate({
                              email: setupEmail,
                              password: setupPassword,
                            });
                          }, 500);
                        },
                        onError: (err: any) => toast.error(err.message || 'Erro ao definir senha')
                      }
                    );
                  }}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Definir Senha
                </Button>
              </>
            )}

            {setupStep === 'success' && (
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
                </div>
                <p className="text-slate-300">
                  Senha configurada! Entrando na sua conta...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
