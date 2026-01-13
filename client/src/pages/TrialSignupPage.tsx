import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { trackPageView, trackTrialFormOpened, trackTrialFormSubmitted, trackTrialCreated } from "@/lib/analytics";
import { pixelEvents } from "@/lib/tracking-pixels";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  Sparkles, 
  Shield, 
  ArrowRight,
  Gift,
  Zap,
  Calendar,
  Phone,
  Mail,
  User,
  CreditCard,
  Loader2,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

export default function TrialSignupPage() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTrialMutation = trpc.trial.createTrial.useMutation();

  useEffect(() => {
    trackPageView('/cadastro-trial');
    trackTrialFormOpened('trial_signup_page');
    // Meta Pixel - ViewContent para página de cadastro trial
    pixelEvents.viewContent({
      contentId: 'trial_signup',
      contentName: 'Cadastro Trial',
      contentType: 'product',
      contentCategory: 'trial',
      value: 0,
    });
  }, []);

  // Formatação de data de nascimento
  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 8) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d)/, "$1/$2");
    }
    return value;
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2");
    }
    return value;
  };

  // Formatação de telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  // Validação de CPF
  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(numbers[10])) return false;
    
    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.trim().split(" ").length < 2) {
      newErrors.name = "Digite seu nome completo";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "WhatsApp é obrigatório";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido";
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }
    
    if (!formData.birthDate.trim()) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else if (formData.birthDate.replace(/\D/g, "").length !== 8) {
      newErrors.birthDate = "Data inválida";
    }
    
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Converter data DD/MM/YYYY para YYYY-MM-DD
      const dateParts = formData.birthDate.split("/");
      const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      
      await createTrialMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        cpf: formData.cpf.replace(/\D/g, ""),
        birthDate: formattedDate,
        password: formData.password,
      });
      
      trackTrialFormSubmitted();
      trackTrialCreated();
      
      // Meta Pixel - StartTrial e CompleteRegistration
      const userData = {
        email: formData.email,
        phone: formData.phone,
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' '),
      };
      pixelEvents.startTrial({
        contentId: 'trial_24h',
        contentName: 'Trial 24 Horas',
        value: 0,
        predictedLtv: 97 * 12, // LTV estimado se converter para Starter
      }, userData);
      pixelEvents.completeRegistration(userData, {
        contentName: 'Trial Registration',
        status: 'completed',
        value: 0,
      });
      
      toast.success("Conta criada com sucesso! Redirecionando para o login...");
      
      // Redirecionar imediatamente para a página de login
      setLocation("/");
    } catch (error: any) {
      if (error.message?.includes("CPF já cadastrado")) {
        setErrors({ cpf: "CPF já cadastrado. Faça login na sua conta existente." });
      } else if (error.message?.includes("Email já cadastrado")) {
        setErrors({ email: "Email já cadastrado. Faça login na sua conta existente." });
      } else {
        toast.error("Erro ao criar conta: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Users, text: "Até 5 alunos ativos" },
    { icon: Sparkles, text: "Geração de treinos com IA" },
    { icon: Calendar, text: "Agenda completa" },
    { icon: Shield, text: "Sem compromisso" },
  ];

  // Removido: tela de sucesso - agora redireciona direto para login

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FitPrime</span>
          </div>
          <Button variant="outline" onClick={() => setLocation("/login")}>
            Já tenho conta
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Benefits */}
          <div className="space-y-8">
            <div>
              <Badge className="bg-emerald-100 text-emerald-700 mb-4">
                <Gift className="w-3 h-3 mr-1" />
                Teste Grátis
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Experimente o FitPrime por <span className="text-emerald-600">24 horas</span>
              </h1>
              <p className="text-lg text-gray-600">
                Acesso completo a todas as funcionalidades. Sem cartão de crédito. Sem compromisso.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Por que testar o FitPrime?</h3>
              <ul className="space-y-2 text-emerald-50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Economize até 10 horas por semana</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Treinos personalizados em segundos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gestão completa dos seus alunos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Automação de cobranças</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Form */}
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">Criar Conta Trial</CardTitle>
              <CardDescription>
                Preencha seus dados para começar seu teste gratuito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      className={errors.cpf ? "border-red-500" : ""}
                    />
                    {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
                  </div>

                  <div>
                    <Label htmlFor="birthDate" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      placeholder="DD/MM/AAAA"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: formatBirthDate(e.target.value) })}
                      className={errors.birthDate ? "border-red-500" : ""}
                    />
                    {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    Criar Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Começar Teste Grátis
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  Ao criar sua conta, você concorda com nossos{" "}
                  <a href="/termos" className="text-emerald-600 hover:underline">Termos de Uso</a>
                  {" "}e{" "}
                  <a href="/privacidade" className="text-emerald-600 hover:underline">Política de Privacidade</a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 FitPrime. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
