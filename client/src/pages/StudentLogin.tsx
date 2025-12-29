import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Dumbbell, Loader2, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Verificar se já está logado
  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    if (token) {
      setLocation("/portal-aluno");
    }
  }, []);

  // Mutation para login
  const loginMutation = trpc.students.loginStudent.useMutation({
    onSuccess: (data) => {
      toast.success(`Bem-vindo, ${data.studentName}!`);
      localStorage.setItem("studentToken", data.token);
      localStorage.setItem("studentId", String(data.studentId));
      setLocation("/portal-aluno");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao fazer login");
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
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Senha
            </Label>
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
    </div>
  );
}
