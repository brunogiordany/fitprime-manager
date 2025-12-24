import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  MessageSquare,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Clock,
  FileText
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Users,
      title: "Gestão de Alunos",
      description: "Cadastro completo com perfil detalhado, anamnese, evolução e histórico de treinos."
    },
    {
      icon: Dumbbell,
      title: "Treinos Personalizados",
      description: "Crie treinos por dia da semana com exercícios, séries, repetições e vídeos."
    },
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Visualização diária e semanal com controle de presença e status das sessões."
    },
    {
      icon: CreditCard,
      title: "Cobranças Automatizadas",
      description: "Gerencie pagamentos, planos e pacotes com lembretes automáticos."
    },
    {
      icon: BarChart3,
      title: "Evolução com Gráficos",
      description: "Acompanhe medidas, peso e fotos de evolução dos seus alunos."
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integrado",
      description: "Envie lembretes e mensagens automáticas via Evolution API."
    },
  ];

  const securityFeatures = [
    "Autenticação OAuth segura",
    "Sessões JWT criptografadas",
    "Proteção contra SQL Injection",
    "Rate limiting anti-DDoS",
    "Validação de permissões",
    "Logs de auditoria"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              FitPrime
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/portal')}>
              Portal do Aluno
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <Zap className="h-3 w-3 mr-1" />
            Plataforma completa para Personal Trainers
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
            Gerencie seus alunos com{" "}
            <span className="text-emerald-600">eficiência</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Tudo que você precisa para organizar treinos, agenda, cobranças e comunicação 
            com seus alunos em uma única plataforma segura e intuitiva.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Começar Agora
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation('/portal')}>
              <Smartphone className="h-5 w-5 mr-2" />
              Sou Aluno
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tudo que você precisa</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Funcionalidades pensadas para facilitar o dia a dia do personal trainer
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-0 shadow-lg shadow-emerald-100/50">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">
                <Shield className="h-3 w-3 mr-1" />
                Segurança em primeiro lugar
              </Badge>
              <h2 className="text-3xl font-bold mb-6">
                Seus dados protegidos com as melhores práticas
              </h2>
              <p className="text-gray-300 mb-8">
                Implementamos múltiplas camadas de segurança para garantir que os dados 
                dos seus alunos estejam sempre protegidos contra ameaças.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-3xl opacity-20"></div>
              <Card className="relative bg-gray-800/50 border-gray-700 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg">
                      <Shield className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm">Autenticação OAuth ativa</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg">
                      <Clock className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm">Sessões com expiração automática</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm">Logs de auditoria completos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para transformar sua gestão?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comece agora mesmo a organizar seus alunos, treinos e cobranças de forma 
            profissional e segura.
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Criar Conta Gratuita
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-white">
        <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold">FitPrime Manager</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 FitPrime. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
