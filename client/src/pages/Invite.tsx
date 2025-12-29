import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Dumbbell, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  
  // Estado do formulário de cadastro
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Verificar se o convite é válido
  const { data: inviteData, isLoading: inviteLoading, error: inviteError } = trpc.students.validateInvite.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  // Mutation para registrar novo aluno
  const registerStudentMutation = trpc.students.registerWithInvite.useMutation({
    onSuccess: (data) => {
      toast.success("Cadastro realizado com sucesso!");
      // Salvar token JWT no localStorage
      if (data.token) {
        localStorage.setItem("studentToken", data.token);
        localStorage.setItem("studentId", String(data.studentId));
      }
      setRegistrationSuccess(true);
      // Redirecionar para o portal do aluno após 2 segundos
      setTimeout(() => {
        setLocation("/portal-aluno");
      }, 2000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao realizar cadastro");
    },
  });

  // Preencher nome do formulário com o nome do aluno do convite
  useEffect(() => {
    if (inviteData?.studentName && !registerForm.name) {
      setRegisterForm(prev => ({ ...prev, name: inviteData.studentName || "" }));
    }
    if (inviteData?.studentEmail && !registerForm.email) {
      setRegisterForm(prev => ({ ...prev, email: inviteData.studentEmail || "" }));
    }
    if (inviteData?.studentPhone && !registerForm.phone) {
      setRegisterForm(prev => ({ ...prev, phone: inviteData.studentPhone || "" }));
    }
  }, [inviteData]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!registerForm.name.trim()) {
      errors.name = "Nome é obrigatório";
    }
    if (!registerForm.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = "Email inválido";
    }
    if (!registerForm.phone.trim()) {
      errors.phone = "Telefone é obrigatório";
    }
    if (!registerForm.password) {
      errors.password = "Senha é obrigatória";
    } else if (registerForm.password.length < 6) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Senhas não conferem";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = () => {
    if (!validateForm()) return;
    
    registerStudentMutation.mutate({
      token: token || "",
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
    });
  };

  if (inviteLoading) {
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

  // Cadastro realizado com sucesso
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-600">Cadastro Realizado!</CardTitle>
            <CardDescription>
              Bem-vindo ao FitPrime! Redirecionando para o seu portal...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de cadastro (convite válido)
  if (inviteData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Bem-vindo ao FitPrime!</CardTitle>
            <CardDescription>
              Você foi convidado por <strong>{inviteData.personalName}</strong> para acessar o Portal do Aluno
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-700 text-center">
                Complete seu cadastro para acessar seus treinos, agenda e muito mais!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome completo *
              </Label>
              <Input
                id="name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome completo"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone *
              </Label>
              <Input
                id="phone"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Criar senha *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirmar senha *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Repita a senha"
                className={formErrors.confirmPassword ? "border-red-500" : ""}
              />
              {formErrors.confirmPassword && <p className="text-xs text-red-500">{formErrors.confirmPassword}</p>}
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={handleRegister}
              disabled={registerStudentMutation.isPending}
            >
              {registerStudentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando conta...
                </>
              ) : (
                "Criar minha conta"
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              Ao criar sua conta, você concorda com os termos de uso e política de privacidade.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
