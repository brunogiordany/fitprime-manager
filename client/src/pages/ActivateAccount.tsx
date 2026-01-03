import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Dumbbell, Mail, User, Lock, Phone, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
// Helper to get login URL
const getLoginUrl = () => {
  const appId = import.meta.env.VITE_APP_ID;
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || 'https://manus.im';
  const currentUrl = window.location.origin;
  return `${portalUrl}/login?app_id=${appId}&redirect_uri=${encodeURIComponent(currentUrl + '/api/oauth/callback')}`;
};

export default function ActivateAccount() {
  const [, params] = useRoute("/ativar-conta/:token");
  const [, navigate] = useLocation();
  
  
  const token = params?.token || "";
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Query to validate token and get activation data
  const { data: activationData, isLoading: isLoadingActivation, error: activationError } = 
    trpc.activation.validateToken.useQuery(
      { token },
      { enabled: !!token, retry: false }
    );
  
  // Mutation to complete activation
  const activateMutation = trpc.activation.completeActivation.useMutation({
    onSuccess: (data) => {
      toast.success("Conta ativada com sucesso!", {
        description: "Você será redirecionado para fazer login.",
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 2000);
    },
    onError: (error) => {
      toast.error("Erro ao ativar conta", {
        description: error.message,
      });
    },
  });
  
  // Pre-fill name if available
  useEffect(() => {
    if (activationData?.name) {
      setName(activationData.name);
    }
    if (activationData?.phone) {
      setPhone(activationData.phone);
    }
  }, [activationData]);
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    
    if (!password) {
      newErrors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    activateMutation.mutate({
      token,
      name: name.trim(),
      phone: phone.trim() || undefined,
      password,
    });
  };
  
  // Format phone number
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };
  
  // Loading state
  if (isLoadingActivation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600">Validando seu link de ativação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state - invalid or expired token
  if (activationError || !activationData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Link Inválido ou Expirado</CardTitle>
            <CardDescription className="text-red-600">
              {activationData?.message || "Este link de ativação não é mais válido."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O link de ativação pode ter expirado ou já foi utilizado. 
                Se você já tem uma conta, faça login normalmente.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Fazer Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Already activated
  if (activationData?.status === "activated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-700">Conta Já Ativada</CardTitle>
            <CardDescription>
              Sua conta já foi ativada anteriormente. Faça login para acessar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Success state after activation
  if (activateMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Sparkles className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-700">Conta Ativada!</CardTitle>
            <CardDescription className="text-lg">
              Bem-vindo ao FitPrime! Redirecionando para o login...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main activation form
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            FitPrime
          </h1>
          <p className="text-gray-500">Gestão inteligente para Personal Trainers</p>
        </div>
        
        {/* Activation Card */}
        <Card className="border-0 shadow-xl shadow-emerald-100/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Ativar Minha Conta</CardTitle>
            <CardDescription className="text-center">
              Complete seu cadastro para começar a usar o FitPrime
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Plan Info */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 mb-6 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">{activationData?.planName || "Plano FitPrime"}</p>
                  <p className="text-sm text-emerald-600">
                    {activationData?.amount 
                      ? `R$ ${Number(activationData.amount).toFixed(2).replace('.', ',')}/mês`
                      : "Compra confirmada"
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={activationData?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Este é o email usado na compra e não pode ser alterado
                </p>
              </div>
              
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  WhatsApp (opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                />
              </div>
              
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  Criar Senha *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>
              
              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  Confirmar Senha *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-lg font-semibold shadow-lg shadow-emerald-200"
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    Ativar Minha Conta
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
            
            {/* Already have account */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Já tem uma conta?{" "}
                <button
                  onClick={() => window.location.href = getLoginUrl()}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Fazer login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Ao ativar sua conta, você concorda com nossos{" "}
          <a href="#" className="text-emerald-600 hover:underline">Termos de Uso</a>
          {" "}e{" "}
          <a href="#" className="text-emerald-600 hover:underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
}
