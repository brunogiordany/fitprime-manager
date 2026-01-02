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
  Smartphone as PhoneIcon,
  X,
  Minus
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo, useCallback } from "react";
import { trackPageView, trackQuizStarted } from "@/lib/analytics";
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
  
  // Calculadora interativa
  const [valorAula, setValorAula] = useState(100);
  const [horasBurocracia, setHorasBurocracia] = useState(10);
  
  // Cálculos baseados nos inputs
  const calculosPersonalizados = useMemo(() => {
    const aulasPerdidas = Math.floor(horasBurocracia / 2.5); // ~2.5h por aula considerando preparo
    const perdaMensal = aulasPerdidas * valorAula * 4; // 4 semanas
    const perdaAnual = perdaMensal * 12;
    const tempoRecuperado = horasBurocracia * 4; // horas por mês
    const aulasExtras = Math.floor(tempoRecuperado / 1); // 1h por aula
    const ganhoExtra = aulasExtras * valorAula;
    
    return {
      aulasPerdidas,
      perdaMensal,
      perdaAnual,
      tempoRecuperado,
      aulasExtras,
      ganhoExtra
    };
  }, [valorAula, horasBurocracia]);
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

  // Tracking de page view
  useEffect(() => {
    trackPageView('/');
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

        </div>
      </header>

      {/* Hero Section - Conexão Emocional */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="container max-w-7xl mx-auto">
          {/* Headline Principal */}
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-red-100 text-red-700 hover:bg-red-100">
              <AlertCircle className="h-4 w-4 mr-2" />
              Isso te parece familiar?
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Você é <span className="text-emerald-600">Personal Trainer</span>,<br/>
              não secretário.
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Enquanto você deveria estar treinando alunos e ganhando dinheiro,<br/>
              está preso respondendo WhatsApp, cobrando pagamentos e remarcando horários.
            </p>

            {/* Frases do dia a dia - HERO */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="bg-white rounded-full px-6 py-3 border-2 border-red-200 shadow-sm">
                <p className="text-gray-700">"Oi, posso remarcar pra quinta?" 😩</p>
              </div>
              <div className="bg-white rounded-full px-6 py-3 border-2 border-red-200 shadow-sm">
                <p className="text-gray-700">"Esqueci de pagar, manda o pix de novo?" 💸</p>
              </div>
              <div className="bg-white rounded-full px-6 py-3 border-2 border-red-200 shadow-sm">
                <p className="text-gray-700">"Qual era meu treino mesmo?" 📝</p>
              </div>
            </div>

            {/* Dores em destaque */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <Clock className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Tempo Perdido</h3>
                <p className="text-gray-600 text-sm">10+ horas por semana respondendo mensagens, cobrando e organizando planilhas</p>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <DollarSign className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Dinheiro na Mesa</h3>
                <p className="text-gray-600 text-sm">Alunos que não pagam em dia, cobranças que você esquece de fazer</p>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <Users className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Alunos Perdidos</h3>
                <p className="text-gray-600 text-sm">Sem acompanhamento de evolução, alunos perdem motivação e cancelam</p>
              </div>
            </div>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => {
                  const quizSection = document.getElementById('quiz');
                  if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-6"
              >
                Descubra Se o FitPrime É Pra Você
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-gray-500">Responda 3 perguntas rápidas e descubra</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Calculadora - Mais abaixo */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-amber-50" id="calculadora">
        <div className="container max-w-7xl mx-auto">
          {/* Headline da Calculadora */}
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-amber-100 text-amber-700 hover:bg-amber-100">
              <DollarSign className="h-4 w-4 mr-2" />
              Calculadora do Personal
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Descubra quanto você está <span className="text-amber-600">deixando de ganhar</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Coloque seus números reais e veja o impacto da burocracia no seu bolso
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Lado Esquerdo - Calculadora */}
            <div className="bg-white rounded-2xl p-8 border-2 border-amber-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-amber-600" />
                Seus números
              </h3>
              
              {/* Input Valor da Aula */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quanto você cobra por aula?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                  <input
                    type="number"
                    value={valorAula}
                    onChange={(e) => setValorAula(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-amber-500 transition-colors"
                    min="0"
                    step="10"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[80, 100, 120, 150, 200].map((valor) => (
                    <button
                      key={valor}
                      onClick={() => setValorAula(valor)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        valorAula === valor 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      R$ {valor}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Input Horas com Burocracia */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantas horas por semana você gasta com burocracia?
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  (WhatsApp, cobranças, remarcar horários, planilhas, etc.)
                </p>
                <input
                  type="range"
                  value={horasBurocracia}
                  onChange={(e) => setHorasBurocracia(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  min="2"
                  max="20"
                  step="1"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>2h</span>
                  <span className="text-xl font-bold text-amber-600">{horasBurocracia}h/semana</span>
                  <span>20h</span>
                </div>
              </div>

              {/* Resultado - O que você perde */}
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h4 className="text-sm font-medium text-red-700 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  O que você está perdendo
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Aulas que poderia dar por semana:</span>
                    <span className="text-xl font-bold text-red-600">{calculosPersonalizados.aulasPerdidas} aulas</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Perda mensal:</span>
                    <span className="text-2xl font-bold text-red-600">
                      R$ {calculosPersonalizados.perdaMensal.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-red-200">
                    <span className="text-gray-600">Perda anual:</span>
                    <span className="text-3xl font-bold text-red-600">
                      R$ {calculosPersonalizados.perdaAnual.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado Direito - Solução com dados personalizados */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-emerald-600" />
                Com o FitPrime
              </h3>
              
              {/* Resultado - O que você ganha */}
              <div className="bg-white rounded-xl p-6 border border-emerald-200 mb-6">
                <h4 className="text-sm font-medium text-emerald-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  O que você ganha
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tempo recuperado por mês:</span>
                    <span className="text-xl font-bold text-emerald-600">{calculosPersonalizados.tempoRecuperado}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Aulas extras que pode dar:</span>
                    <span className="text-xl font-bold text-emerald-600">{calculosPersonalizados.aulasExtras} aulas</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-emerald-200">
                    <span className="text-gray-600">Potencial de ganho extra:</span>
                    <span className="text-3xl font-bold text-emerald-600">
                      +R$ {calculosPersonalizados.ganhoExtra.toLocaleString('pt-BR')}/mês
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Benefícios */}
              <div className="space-y-3 mb-6">
                <div className="flex gap-3 items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-gray-700">Aluno remarca sozinho pelo app</p>
                </div>
                <div className="flex gap-3 items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-gray-700">Cobrança automática no WhatsApp</p>
                </div>
                <div className="flex gap-3 items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-gray-700">Treino sempre no celular do aluno</p>
                </div>
                <div className="flex gap-3 items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-gray-700">Evolução com fotos e medidas</p>
                </div>
              </div>

              {/* Comparação */}
              <div className="bg-emerald-100 rounded-xl p-4 mb-6">
                <p className="text-emerald-800 text-center">
                  <strong>Investimento:</strong> A partir de R$ 97/mês<br/>
                  <span className="text-sm">Retorno potencial: <strong>R$ {calculosPersonalizados.ganhoExtra.toLocaleString('pt-BR')}/mês</strong></span>
                </p>
              </div>

              <Button 
                size="lg" 
                onClick={() => {
                  const quizSection = document.getElementById('quiz');
                  if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg py-6"
              >
                Qual Plano Combina Comigo?
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">Descubra em menos de 2 minutos</p>
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

          {/* Jornada do Personal */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              <span className="text-emerald-600">Sua</span> Jornada como Personal
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Passo 1 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">1</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Cadastre seus alunos</h4>
                </div>
                <div className="h-16 w-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Importe do Excel ou cadastre manualmente. Perfil completo com foto, objetivos e histórico.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Import do Excel/CSV
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Foto e dados completos
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Anamnese detalhada
                  </li>
                </ul>
              </div>

              {/* Passo 2 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">2</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Gere treinos com IA</h4>
                </div>
                <div className="h-16 w-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  A IA gera treinos personalizados em segundos baseado no objetivo e restrições do aluno.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Baseado na anamnese
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Progressão automática
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Adaptação por feedback
                  </li>
                </ul>
              </div>

              {/* Passo 3 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">3</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Agende automaticamente</h4>
                </div>
                <div className="h-16 w-16 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Selecione os dias e a IA cria 4 semanas de agendamento. Alunos recebem no WhatsApp.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    4 semanas automáticas
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Notificação WhatsApp
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Aluno remarca sozinho
                  </li>
                </ul>
              </div>

              {/* Passo 4 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">4</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Cobranças automáticas</h4>
                </div>
                <div className="h-16 w-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Configure uma vez e esqueça. Cobranças automáticas via WhatsApp e Pix.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Pix automático
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Lembrete de vencimento
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Bloqueio por inadimplência
                  </li>
                </ul>
              </div>

              {/* Passo 5 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">5</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Acompanhe evolução</h4>
                </div>
                <div className="h-16 w-16 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Gráficos de peso, medidas e composição corporal. Fotos de antes/depois.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Gráficos de evolução
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Fotos comparativas
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Cálculo de BF automático
                  </li>
                </ul>
              </div>

              {/* Passo 6 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">6</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Relatórios e insights</h4>
                </div>
                <div className="h-16 w-16 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  MRR, taxa de retenção, alunos engajados. Dados para crescer seu negócio.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Dashboard completo
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Métricas de receita
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Previsão de churn
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Jornada do Aluno */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              <span className="text-blue-600">Experiência do</span> Seu Aluno
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {/* Aluno 1 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 text-center mb-2">App no Celular</h4>
                <p className="text-gray-600 text-sm text-center">
                  Treino sempre disponível. Sem papel, sem dúvida.
                </p>
              </div>

              {/* Aluno 2 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 text-center mb-2">Lembretes WhatsApp</h4>
                <p className="text-gray-600 text-sm text-center">
                  Notificações automáticas de treino e pagamento.
                </p>
              </div>

              {/* Aluno 3 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 text-center mb-2">Remarca Sozinho</h4>
                <p className="text-gray-600 text-sm text-center">
                  Aluno reagenda pelo app. Sem te incomodar.
                </p>
              </div>

              {/* Aluno 4 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <LineChart className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 text-center mb-2">Vê Sua Evolução</h4>
                <p className="text-gray-600 text-sm text-center">
                  Gráficos e fotos de progresso. Motivação garantida.
                </p>
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
              onClick={() => {
                const quizSection = document.getElementById('quiz');
                if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Veja Se o FitPrime É Pra Você
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de Benefícios com Quiz */}
      <section className="py-20 px-4 bg-white" id="quiz">
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
              Será que o FitPrime é pra você?
            </h3>
            <p className="text-emerald-100 mb-8 text-lg max-w-2xl mx-auto">
              Responda 3 perguntas simples e descubra qual plano combina com seu momento como personal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/quiz'}
                className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
              >
                <Target className="mr-2 h-5 w-5" />
                Descobrir Meu Plano Ideal
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/pricing-complete'}
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                Já Sei o Que Quero
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-emerald-200 text-sm mt-6">
              Menos de 2 minutos • Resultado personalizado • Sem compromisso
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
                onClick={() => window.location.href = '/quiz'}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
              >
                Descubra Se É Pra Você
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

      {/* Tabela Comparativa */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700">
              <Trophy className="h-3 w-3 mr-1" />
              Comparação de Mercado
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que o FitPrime é <span className="text-emerald-600">diferente</span>?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Veja como nos comparamos com outras soluções do mercado
            </p>
          </div>

          {/* Tabela Comparativa */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Funcionalidade</th>
                  <th className="py-4 px-4 text-center">
                    <div className="bg-emerald-600 text-white rounded-lg py-2 px-4 font-bold">
                      FitPrime
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center text-gray-500 font-medium">App A</th>
                  <th className="py-4 px-4 text-center text-gray-500 font-medium">App B</th>
                  <th className="py-4 px-4 text-center text-gray-500 font-medium">App C</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "IA para gerar treinos personalizados", fitprime: true, a: false, b: false, c: "partial" },
                  { feature: "Agendamento automático com IA", fitprime: true, a: false, b: false, c: false },
                  { feature: "Cobranças automáticas (PIX/Cartão)", fitprime: true, a: "partial", b: true, c: false },
                  { feature: "Bloqueio automático para inadimplentes", fitprime: true, a: false, b: false, c: false },
                  { feature: "WhatsApp integrado", fitprime: true, a: false, b: "partial", c: false },
                  { feature: "Dashboard financeiro (MRR, Churn)", fitprime: true, a: false, b: false, c: "partial" },
                  { feature: "Biblioteca de exercícios em vídeo", fitprime: true, a: true, b: true, c: true },
                  { feature: "Anamnese e avaliação física", fitprime: true, a: true, b: true, c: true },
                  { feature: "App do aluno (iOS/Android)", fitprime: true, a: true, b: true, c: true },
                  { feature: "Gráficos de evolução do aluno", fitprime: true, a: false, b: false, c: true },
                  { feature: "Diário de treino detalhado", fitprime: true, a: false, b: false, c: false },
                  { feature: "Relatórios de negócio", fitprime: true, a: false, b: false, c: "partial" },
                  { feature: "Integração com wearables", fitprime: "soon", a: false, b: false, c: true },
                  { feature: "Suporte em português", fitprime: true, a: true, b: true, c: "partial" },
                  { feature: "Preço acessível (a partir de R$ 97)", fitprime: true, a: true, b: true, c: false },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-4 px-4 text-gray-700 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center bg-emerald-50/50">
                      {row.fitprime === true && <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />}
                      {row.fitprime === false && <X className="h-6 w-6 text-gray-300 mx-auto" />}
                      {row.fitprime === "partial" && <Minus className="h-6 w-6 text-amber-500 mx-auto" />}
                      {row.fitprime === "soon" && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Em breve</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.a === true && <CheckCircle2 className="h-5 w-5 text-gray-400 mx-auto" />}
                      {row.a === false && <X className="h-5 w-5 text-gray-300 mx-auto" />}
                      {row.a === "partial" && <Minus className="h-5 w-5 text-amber-500 mx-auto" />}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.b === true && <CheckCircle2 className="h-5 w-5 text-gray-400 mx-auto" />}
                      {row.b === false && <X className="h-5 w-5 text-gray-300 mx-auto" />}
                      {row.b === "partial" && <Minus className="h-5 w-5 text-amber-500 mx-auto" />}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.c === true && <CheckCircle2 className="h-5 w-5 text-gray-400 mx-auto" />}
                      {row.c === false && <X className="h-5 w-5 text-gray-300 mx-auto" />}
                      {row.c === "partial" && <Minus className="h-5 w-5 text-amber-500 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Incluso</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-amber-500" />
              <span>Parcial</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-gray-300" />
              <span>Não incluso</span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/quiz'}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-6"
            >
              Descubra Se o FitPrime É Pra Você
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
                q: "Como funciona para começar?",
                a: "Você faz o quiz para descobrir o plano ideal, escolhe o que combina com seu momento e já pode começar a usar. Simples assim!"
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
            Será que o FitPrime é pra você?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Responda 3 perguntas rápidas e descubra qual plano combina com seu momento.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/quiz'}
              className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Descobrir Meu Plano Ideal
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/pricing-complete'}
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Já Sei o Que Quero
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
