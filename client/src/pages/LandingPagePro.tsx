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
  Star,
  Flame,
  Heart,
  Rocket,
  Sparkles,
  Trophy,
  TrendingUp,
  Gift,
  Play,
  Target,
  LineChart,
  AlertCircle,
  DollarSign,
  Eye,
  Brain,
  Lightbulb,
  Lock,
  Smartphone as PhoneIcon
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import ChatWidget from "@/components/ChatWidget";
import ExitIntentPopup from "@/components/ExitIntentPopup";

// Links de checkout dos planos
const PLANS_CHECKOUT = {
  starter: "https://pay.cakto.com.br/32rof96",
  pro: "https://pay.cakto.com.br/onb2wr2",
  business: "https://pay.cakto.com.br/zh3rnh6",
  premium: "https://pay.cakto.com.br/kbevbfw",
  enterprise: "https://pay.cakto.com.br/apzipd3",
};

const PLANS_DATA = [
  {
    id: "starter",
    name: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    description: "Perfeito para começar",
    features: [
      "Até 15 alunos",
      "Agenda completa",
      "Montagem de treinos",
      "Portal do aluno",
      "Relatórios básicos"
    ],
    highlight: false
  },
  {
    id: "pro",
    name: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    description: "Para personais em crescimento",
    features: [
      "Até 25 alunos",
      "Tudo do Starter +",
      "Cobranças automáticas",
      "Análise de evolução",
      "Suporte prioritário"
    ],
    highlight: false
  },
  {
    id: "business",
    name: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.03,
    description: "Para personais consolidados",
    features: [
      "Até 40 alunos",
      "Tudo do Pro +",
      "Múltiplos personais",
      "Integração com APIs",
      "Suporte 24/7"
    ],
    highlight: true
  },
  {
    id: "premium",
    name: "Premium",
    price: 297,
    studentLimit: 70,
    extraStudentPrice: 4.24,
    description: "Para estúdios pequenos",
    features: [
      "Até 70 alunos",
      "Tudo do Business +",
      "Gestão de múltiplos estúdios",
      "API completa",
      "Onboarding dedicado"
    ],
    highlight: false
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 497,
    studentLimit: 150,
    extraStudentPrice: 3.31,
    description: "Para grandes estúdios",
    features: [
      "Até 150 alunos",
      "Tudo do Premium +",
      "Suporte dedicado",
      "Consultoria estratégica",
      "SLA garantido"
    ],
    highlight: false
  }
];

// Função para calcular o próximo domingo à meia-noite
function getNextSundayMidnight() {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 59, 999);
  return nextSunday;
}

export default function LandingPagePro() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Contador de urgência
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [spotsLeft, setSpotsLeft] = useState(7);
  const offerEndDate = useMemo(() => getNextSundayMidnight(), []);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = offerEndDate.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [offerEndDate]);
  
  useEffect(() => {
    const storedSpots = localStorage.getItem('fitprime_spots');
    const storedTime = localStorage.getItem('fitprime_spots_time');
    const now = Date.now();
    
    if (storedSpots && storedTime) {
      const timeDiff = now - parseInt(storedTime);
      const hoursElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 2));
      const newSpots = Math.max(3, parseInt(storedSpots) - hoursElapsed);
      setSpotsLeft(newSpots);
      
      if (hoursElapsed > 0) {
        localStorage.setItem('fitprime_spots', newSpots.toString());
        localStorage.setItem('fitprime_spots_time', now.toString());
      }
    } else {
      const initialSpots = Math.floor(Math.random() * 8) + 5;
      setSpotsLeft(initialSpots);
      localStorage.setItem('fitprime_spots', initialSpots.toString());
      localStorage.setItem('fitprime_spots_time', now.toString());
    }
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const handleCheckout = (planId: string) => {
    const url = PLANS_CHECKOUT[planId as keyof typeof PLANS_CHECKOUT];
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleStartTrial = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-white">
      <ChatWidget />
      <ExitIntentPopup enabled={true} delay={5000} />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">FitPrime</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Como Funciona
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/quiz'}>
              Descubra Seu Plano
            </Button>
            <Button onClick={handleStartTrial} className="bg-emerald-600 hover:bg-emerald-700">
              Testar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Problema + Solução */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="container max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Lado Esquerdo - Problema */}
            <div>
              <Badge className="mb-6 bg-red-100 text-red-700 hover:bg-red-100">
                <AlertCircle className="h-4 w-4 mr-2" />
                O Problema Real
              </Badge>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Você perde <span className="text-red-600">10+ horas por semana</span> com tarefas administrativas
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Agenda desorganizada</h3>
                    <p className="text-gray-600">Planilhas, agendas em papel, mensagens perdidas no WhatsApp</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Cobranças manuais</h3>
                    <p className="text-gray-600">Ficar atrás de alunos para pagar, perder dinheiro com inadimplência</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Treinos repetitivos</h3>
                    <p className="text-gray-600">Montar treino do zero para cada aluno, sem dados de evolução</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Alunos desengajados</h3>
                    <p className="text-gray-600">Sem acompanhamento de evolução, alunos desistem mais rápido</p>
                  </div>
                </div>
              </div>

              <p className="text-lg text-gray-700 font-semibold">
                💰 Resultado: Você perde <span className="text-red-600">R$ 5.000 a R$ 15.000 por mês</span> em tempo desperdiçado e alunos que saem
              </p>
            </div>

            {/* Lado Direito - Solução */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
              <Badge className="mb-6 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <Sparkles className="h-4 w-4 mr-2" />
                A Solução
              </Badge>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                FitPrime: Seu <span className="text-emerald-600">assistente administrativo</span> 24/7
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Agenda inteligente</h3>
                    <p className="text-gray-600">Visualize tudo em um calendário, notificações automáticas</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Cobranças automáticas</h3>
                    <p className="text-gray-600">Receba no prazo, sem correr atrás de ninguém</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Treinos com IA</h3>
                    <p className="text-gray-600">Gere treinos em segundos baseado na anamnese do aluno</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Portal do aluno</h3>
                    <p className="text-gray-600">Alunos acompanham evolução, aumenta engajamento</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-emerald-200 mb-6">
                <p className="text-sm text-gray-600 mb-2">Economize por mês:</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-600">10h</span>
                  <span className="text-gray-600">+ R$ 5-15k em receita recuperada</span>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={handleStartTrial}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg py-6"
              >
                Começar Teste Grátis (1 dia)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Jornada do Personal Trainer */}
      <section className="py-20 px-4 bg-gray-50" id="features">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700">
              <Rocket className="h-3 w-3 mr-1" />
              Jornada do Personal Trainer
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como o FitPrime <span className="text-emerald-600">transforma sua rotina</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Veja passo a passo como você vai organizar sua vida profissional e ganhar tempo para o que realmente importa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-20">
            {/* Passo 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-xl">1</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Cadastre seus alunos</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Importe seus alunos do Excel ou cadastre manualmente. Cada aluno tem seu perfil completo com foto, objetivos, histórico de medidas e evolução.
              </p>
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
                [Screenshot: Lista de alunos com filtros]
              </div>
            </div>

            {/* Passo 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-xl">2</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Gere treinos com IA</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Preencha a anamnese do aluno uma vez. A IA gera treinos personalizados em segundos baseado no objetivo, experiência e restrições.
              </p>
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
                [Screenshot: Gerador de treinos com IA]
              </div>
            </div>

            {/* Passo 3 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-xl">3</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Agende automaticamente</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Selecione os dias de treino e a IA cria 4 semanas de agendamento automaticamente. Seus alunos recebem notificações no WhatsApp.
              </p>
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
                [Screenshot: Calendário com agendamentos]
              </div>
            </div>

            {/* Passo 4 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-xl">4</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Cobranças automáticas</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Configure uma vez e esqueça. O FitPrime envia cobranças automáticas, rastreia pagamentos e bloqueia acesso para inadimplentes.
              </p>
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
                [Screenshot: Dashboard de cobranças]
              </div>
            </div>

            {/* Passo 5 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-xl">5</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Acompanhe evolução</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Visualize gráficos de evolução de peso, medidas e composição corporal. Identifique quem está progredindo e quem precisa de ajustes.
              </p>
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
                [Screenshot: Gráficos de evolução]
              </div>
            </div>

            {/* Passo 6 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 transition">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-xl">6</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Relatórios e insights</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Veja MRR, taxa de conversão, alunos mais engajados e muito mais. Dados em tempo real para tomar decisões melhores.
              </p>
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
                [Screenshot: Dashboard de relatórios]
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">Resultado: Você ganha 10h por semana</h3>
            <p className="text-xl mb-8 opacity-90">
              Menos tempo em tarefas administrativas = Mais tempo para treinar, criar conteúdo e crescer seu negócio
            </p>
            <Button 
              size="lg" 
              onClick={handleStartTrial}
              className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Começar Teste Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de Benefícios com Quiz */}
      <section className="py-20 px-4 bg-white" id="pricing">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700">
              <Target className="h-3 w-3 mr-1" />
              Descubra Seu Plano Ideal
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Não sabe qual plano é o <span className="text-emerald-600">melhor para você</span>?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Responda algumas perguntas rápidas e descubra o plano perfeito para seu momento profissional.
            </p>
          </div>

          {/* Cards de Benefícios */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
              <div className="h-14 w-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Economize 10+ horas/semana</h3>
              <p className="text-gray-600 mb-4">
                Automatize cobranças, agenda e comunicação. Foque no que importa: treinar seus alunos.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Cobranças 100% automáticas
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Agenda inteligente
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Lembretes automáticos
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Treinos com IA em segundos</h3>
              <p className="text-gray-600 mb-4">
                Crie treinos personalizados instantâneamente com nossa IA treinada por especialistas.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Baseado na anamnese
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Adaptação automática
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Progressão inteligente
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
              <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cresça seu negócio</h3>
              <p className="text-gray-600 mb-4">
                Relatórios, métricas e insights para escalar sua carreira como personal trainer.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  Dashboard completo
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  Análise de retenção
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  Previsão de receita
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Principal - Quiz */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-10 text-center text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Descubra o plano perfeito para você em 2 minutos
            </h3>
            <p className="text-emerald-100 mb-8 text-lg max-w-2xl mx-auto">
              Nosso quiz inteligente analisa seu perfil e recomenda os 3 melhores planos para seu momento.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/quiz'}
                className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
              >
                <Target className="mr-2 h-5 w-5" />
                Fazer Quiz Gratuito
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/pricing-complete'}
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                Ver Todos os Planos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-emerald-200 text-sm mt-6">
              Sem compromisso • Resultado instantâneo • Plano personalizado
            </p>
          </div>
        </div>
      </section>

      {/* Seção para Fisiculturistas e Atletas */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-purple-100 text-purple-700">
                <Trophy className="h-3 w-3 mr-1" />
                Para Fisiculturistas e Atletas
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Leve seu treinamento para o <span className="text-purple-600">próximo nível</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Se você é um atleta sério ou fisiculturista, o FitPrime foi feito para você. Acompanhe cada detalhe da sua evolução com precisão.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <Flame className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Análise de Composição Corporal</h3>
                    <p className="text-gray-600">Bioimpedância, adipômetro, fotos guiadas - veja exatamente onde você está ganhando músculo e perdendo gordura</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <LineChart className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Progressão de Carga Detalhada</h3>
                    <p className="text-gray-600">Gráficos mostrando a evolução de cada exercício, séries, reps e descanso. Identifique plateaus e ajuste</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Brain className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Treinos Adaptados por IA</h3>
                    <p className="text-gray-600">A IA analisa seus dados e sugere ajustes no treino para maximizar ganhos e evitar overtraining</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Eye className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Comparação Antes/Depois</h3>
                    <p className="text-gray-600">Veja sua transformação lado a lado com análise de postura, simetria e proporções</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
              <div className="bg-white rounded-xl p-6 mb-6 border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-4">Exemplo de Evolução Rastreada:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-semibold text-gray-900">75kg → 82kg (+7kg)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gordura Corporal:</span>
                    <span className="font-semibold text-gray-900">18% → 14% (-4%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Músculo Ganho:</span>
                    <span className="font-semibold text-purple-600">+11kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supino Máximo:</span>
                    <span className="font-semibold text-gray-900">100kg → 130kg (+30kg)</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Tudo rastreado automaticamente. Você só se preocupa em treinar pesado e comer bem.
              </p>

              <Button 
                onClick={handleStartTrial}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
              >
                Começar Teste Grátis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 bg-white border-y border-gray-100">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confiado por +500 personais trainers</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">+5.000</div>
                <p className="text-sm text-gray-600">Alunos gerenciados</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">R$ 2M+</div>
                <p className="text-sm text-gray-600">Em cobranças processadas</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">4.9/5</div>
                <p className="text-sm text-gray-600">Avaliação média</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Preciso de cartão de crédito para o teste grátis?",
                a: "Não! Teste completamente grátis por 1 dia. Sem cartão, sem compromisso. Se gostar, escolha um plano."
              },
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim! Sem contrato, sem multa. Você pode cancelar sua assinatura a qualquer momento diretamente na plataforma."
              },
              {
                q: "Como funciona a cobrança por aluno excedente?",
                a: "Se você contratar o plano Starter (15 alunos) e tiver 20 alunos, paga R$ 6,47 por cada aluno extra. Automático e sem surpresas."
              },
              {
                q: "Meus dados estão seguros?",
                a: "100% seguro! Usamos criptografia de ponta a ponta, backup automático e conformidade com LGPD. Seus dados são seus."
              },
              {
                q: "Posso integrar com outras ferramentas?",
                a: "Sim! FitPrime integra com WhatsApp, Cakto (pagamentos), Google Calendar e mais. Veja nossa documentação de API."
              },
              {
                q: "Qual é o suporte?",
                a: "Depende do plano. Starter tem suporte por email. Pro+ tem suporte prioritário. Enterprise tem suporte 24/7 dedicado."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="container max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para organizar sua vida?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece com 1 dia grátis. Sem cartão, sem compromisso. Cancele quando quiser.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleStartTrial}
              className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Começar Teste Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Ver Planos
            </Button>
          </div>

          {/* Urgência */}
          <div className="mt-12 bg-white/10 rounded-xl p-6 backdrop-blur border border-white/20">
            <p className="text-sm opacity-90 mb-2">⏰ Oferta especial por tempo limitado:</p>
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <div className="text-center">
                <div>{timeLeft.days}</div>
                <div className="text-xs opacity-75">dias</div>
              </div>
              <span>:</span>
              <div className="text-center">
                <div>{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-xs opacity-75">horas</div>
              </div>
              <span>:</span>
              <div className="text-center">
                <div>{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-xs opacity-75">minutos</div>
              </div>
            </div>
            <p className="text-sm opacity-90 mt-4">🎯 Apenas {spotsLeft} vagas restantes para este período</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="container max-w-7xl mx-auto text-center">
          <p className="mb-4">© 2025 FitPrime. Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Privacidade</a>
            <a href="#" className="hover:text-white transition">Termos</a>
            <a href="#" className="hover:text-white transition">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
