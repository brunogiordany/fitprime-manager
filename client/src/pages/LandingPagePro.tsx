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
  Minus,
  Crown
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
  
  // Animação dos números
  const [displayPerdaMensal, setDisplayPerdaMensal] = useState(0);
  const [displayPerdaAnual, setDisplayPerdaAnual] = useState(0);
  const [displayGanhoExtra, setDisplayGanhoExtra] = useState(0);
  
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

  // Animação dos números da calculadora
  useEffect(() => {
    const duration = 500; // 500ms de animação
    const steps = 20;
    const stepDuration = duration / steps;
    
    const targetPerdaMensal = calculosPersonalizados.perdaMensal;
    const targetPerdaAnual = calculosPersonalizados.perdaAnual;
    const targetGanhoExtra = calculosPersonalizados.ganhoExtra;
    
    let currentStep = 0;
    
    const animate = () => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setDisplayPerdaMensal(Math.round(targetPerdaMensal * easeOut));
      setDisplayPerdaAnual(Math.round(targetPerdaAnual * easeOut));
      setDisplayGanhoExtra(Math.round(targetGanhoExtra * easeOut));
      
      if (currentStep < steps) {
        setTimeout(animate, stepDuration);
      }
    };
    
    animate();
  }, [calculosPersonalizados]);

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

            {/* CTA Principal - Leva para Calculadora */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => {
                  const calcSection = document.getElementById('calculadora');
                  if (calcSection) calcSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-6"
              >
                Quanto Você Está Perdendo Por Mês?
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-gray-500">Calcule em 30 segundos</p>
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
                      R$ {displayPerdaMensal.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-red-200">
                    <span className="text-gray-600">Perda anual:</span>
                    <span className="text-3xl font-bold text-red-600">
                      R$ {displayPerdaAnual.toLocaleString('pt-BR')}
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
                      +R$ {displayGanhoExtra.toLocaleString('pt-BR')}/mês
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Benefícios */}
              <div className="space-y-3 mb-6">
                <div className="flex gap-3 items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-gray-700">Agenda de 1 a 12 meses automaticamente</p>
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
                  <strong>Retorno potencial:</strong> <span className="text-lg font-bold">R$ {displayGanhoExtra.toLocaleString('pt-BR')}/mês</span><br/>
                  <span className="text-sm">Tempo economizado: <strong>{horasBurocracia * 4}h/mês</strong></span>
                </p>
              </div>

              <Button 
                size="lg" 
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  if (featuresSection) {
                    const yOffset = -80; // Offset para mostrar o título da seção
                    const y = featuresSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg py-6"
              >
                Ver Jornada do Personal Premium
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">Descubra como se tornar um personal de elite</p>
            </div>
          </div>

          {/* SEÇÃO DIVISOR DE ÁGUAS - ALUNOS PREMIUM */}
          <div className="mt-12 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            {/* Efeitos visuais */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Divisor de Águas
                </Badge>
                <h3 className="text-2xl md:text-4xl font-bold mb-4">
                  E se você pudesse cobrar <span className="text-purple-400">25% a mais</span> por aula?
                </h3>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  Com métricas profissionais, você atrai os alunos que <strong className="text-white">mais pagam</strong>: fisiculturistas, empresários e amantes do mundo fitness.
                </p>
              </div>

              {/* Grid de benefícios */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/5 backdrop-blur border border-purple-500/30 rounded-xl p-6 text-center">
                  <div className="h-14 w-14 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-7 w-7 text-purple-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Métricas Profissionais</h4>
                  <p className="text-gray-400 text-sm">
                    Gráficos de evolução, BF%, massa magra, circunferências. Tudo que alunos exigentes amam.
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur border border-purple-500/30 rounded-xl p-6 text-center">
                  <div className="h-14 w-14 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-7 w-7 text-purple-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Alunos de Elite</h4>
                  <p className="text-gray-400 text-sm">
                    Fisiculturistas, atletas e empresários querem dados. Quem oferece, cobra mais.
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur border border-purple-500/30 rounded-xl p-6 text-center">
                  <div className="h-14 w-14 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-7 w-7 text-purple-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Posicionamento Premium</h4>
                  <p className="text-gray-400 text-sm">
                    Saia do "personal comum" e entre no nível dos profissionais que cobram R$200+ por aula.
                  </p>
                </div>
              </div>

              {/* Cálculo do potencial */}
              <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/40 rounded-2xl p-6 md:p-8 mb-8">
                <div className="text-center mb-6">
                  <p className="text-purple-300 text-sm mb-2">BASEADO NOS SEUS NÚMEROS:</p>
                  <p className="text-white text-lg">
                    Você cobra <span className="text-purple-400 font-bold text-2xl">R$ {valorAula}</span> por aula
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">Se cobrasse 25% a mais:</p>
                    <p className="text-3xl font-bold text-purple-400">
                      R$ {Math.round(valorAula * 1.25)}/aula
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">Ganho extra por mês:</p>
                    <p className="text-3xl font-bold text-indigo-400">
                      +R$ {Math.round(valorAula * 0.25 * horasBurocracia * 4).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">({horasBurocracia * 4} aulas/mês)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">+ Ganho com FitPrime:</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      +R$ {displayGanhoExtra.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-purple-500/30 text-center">
                  <p className="text-gray-300 mb-2">POTENCIAL TOTAL:</p>
                  <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400">
                    +R$ {(Math.round(valorAula * 0.25 * horasBurocracia * 4) + displayGanhoExtra).toLocaleString('pt-BR')}/mês
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Cobrando mais + economizando tempo com FitPrime
                  </p>
                </div>
              </div>

              {/* MEGA ANCORAGEM TOTAL - Somando TUDO */}
              {(() => {
                // Perda mensal
                const perda = displayPerdaMensal;
                // Ganho potencial com FitPrime (tempo economizado)
                const ganhoFitPrime = displayGanhoExtra;
                // Ganho extra cobrando 25% a mais
                const ganho25Porcento = Math.round(valorAula * 0.25 * horasBurocracia * 4);
                // IMPACTO TOTAL = tudo somado
                const impactoTotal = perda + ganhoFitPrime + ganho25Porcento;
                // 10% do impacto total
                const dezPorcentoImpacto = Math.round(impactoTotal * 0.1);
                // Garantir mínimo de R$ 291 (3x o plano Beginner de R$ 97)
                const valorAncoragemMinimo = 291;
                // Valor final da ancoragem: sempre o maior entre 10% do impacto ou R$ 291
                const valorAncoragem = Math.max(dezPorcentoImpacto, valorAncoragemMinimo);
                
                return (
                  <div className="mt-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 border border-emerald-500/30">
                    <div className="text-center mb-6">
                      <Badge className="mb-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Reflexão Final
                      </Badge>
                      <h4 className="text-xl md:text-2xl font-bold text-white">
                        Se o FitPrime custasse <span className="text-emerald-400">apenas 10%</span> de tudo isso...
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <p className="text-red-400 text-xs mb-1">Você perde:</p>
                        <p className="text-xl font-bold text-red-400">R$ {perda.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                        <p className="text-amber-400 text-xs mb-1">Deixa de ganhar:</p>
                        <p className="text-xl font-bold text-amber-400">+R$ {ganhoFitPrime.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
                        <p className="text-purple-400 text-xs mb-1">Cobrando +25%:</p>
                        <p className="text-xl font-bold text-purple-400">+R$ {ganho25Porcento.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-xl p-4 text-center">
                        <p className="text-emerald-400 text-xs mb-1">IMPACTO TOTAL:</p>
                        <p className="text-xl font-black text-emerald-400">R$ {impactoTotal.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>

                    <div className="text-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                      <p className="text-gray-400 text-sm mb-2">10% de R$ {impactoTotal.toLocaleString('pt-BR')} seria:</p>
                      <p className="text-5xl md:text-6xl font-black text-emerald-400 mb-3">
                        R$ {valorAncoragem.toLocaleString('pt-BR')}<span className="text-2xl">/mês</span>
                      </p>
                      <p className="text-xl text-white font-semibold mb-2">
                        Mas relaxa... o FitPrime <span className="text-emerald-400">não custa nem perto disso</span>
                      </p>
                      <p className="text-gray-400 text-sm">
                        Você vai se surpreender com o preço. Continue descobrindo tudo que o FitPrime faz por você.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* DEPOIMENTOS ESTRATÉGICOS */}
              <div className="mt-10 mb-8">
                <p className="text-center text-purple-300 text-sm mb-6 uppercase tracking-wider">Quem já elevou o nível</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Depoimento 1 - Fisiculturista */}
                  <div className="bg-white/5 backdrop-blur border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">RF</div>
                      <div>
                        <p className="text-white font-semibold text-sm">Rafael Mendes</p>
                        <p className="text-purple-400 text-xs">Atleta Fisiculturista</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">
                      "Meu personal agora me mostra <span className="text-purple-400 font-semibold">gráficos de evolução, BF%, massa magra</span>... Tudo que eu precisava pra competir. Pago o dobro e acho barato."
                    </p>
                    <div className="flex gap-1 mt-3">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                  </div>

                  {/* Depoimento 2 - Amante do esporte */}
                  <div className="bg-white/5 backdrop-blur border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">CS</div>
                      <div>
                        <p className="text-white font-semibold text-sm">Carla Santos</p>
                        <p className="text-indigo-400 text-xs">Empresária, 42 anos</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">
                      "Sou viciada em dados! Ver minha evolução semana a semana me motiva demais. <span className="text-indigo-400 font-semibold">Indiquei meu personal pra 5 amigas</span> que também querem isso."
                    </p>
                    <div className="flex gap-1 mt-3">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                  </div>

                  {/* Depoimento 3 - Personal que triplicou */}
                  <div className="bg-white/5 backdrop-blur border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">MT</div>
                      <div>
                        <p className="text-white font-semibold text-sm">Marcos Tavares</p>
                        <p className="text-emerald-400 text-xs">Personal Trainer</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">
                      "Fechei com <span className="text-emerald-400 font-semibold">3 alunos premium em 2 meses</span>: 2 empresários que adoram métricas e 1 fisiculturista. Só com esses 3, <span className="text-emerald-400 font-semibold">fecho R$ 4.500/mês</span>. O FitPrime se pagou por anos em um único mês."
                    </p>
                    <div className="flex gap-1 mt-3">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                  </div>
                </div>

                {/* Segundo row de depoimentos */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {/* Depoimento 4 - Personal com clientes dados */}
                  <div className="bg-white/5 backdrop-blur border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">JL</div>
                      <div>
                        <p className="text-white font-semibold text-sm">Juliana Lima</p>
                        <p className="text-pink-400 text-xs">Personal Trainer</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">
                      "Antes eu cobrava R$80 a aula. Com as métricas do FitPrime, <span className="text-pink-400 font-semibold">passei a cobrar R$180</span>. Em 3 meses conquistei <span className="text-pink-400 font-semibold">8 novos alunos premium</span> que vieram por indicação. Minha renda saltou de R$ 3.200 pra <span className="text-pink-400 font-semibold">R$ 11.500/mês</span>."
                    </p>
                    <div className="flex gap-1 mt-3">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                  </div>

                  {/* Depoimento 5 - Aluno maromba */}
                  <div className="bg-white/5 backdrop-blur border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">PH</div>
                      <div>
                        <p className="text-white font-semibold text-sm">Pedro Henrique</p>
                        <p className="text-amber-400 text-xs">Maromba, 28 anos</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">
                      "Treino há 8 anos e nunca tive um acompanhamento tão profissional. <span className="text-amber-400 font-semibold">Ver meus dados em tempo real</span> mudou meu jogo. Meu personal virou meu parceiro de evolução."
                    </p>
                    <div className="flex gap-1 mt-3">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Eleve seu nível e atraia os alunos que pagam o que você merece.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => {
                    const featuresSection = document.getElementById('features');
                    if (featuresSection) featuresSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-8 py-6"
                >
                  Quero Ser um Personal Premium
                  <Crown className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Jornada do Personal Premium */}
      <section className="py-20 px-4 bg-gray-50" id="features">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-emerald-100 text-purple-700 border-purple-200">
              <Crown className="h-3 w-3 mr-1" />
              Jornada do Personal Premium
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como se tornar um <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-emerald-600">Personal Premium</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              O caminho para atrair alunos que pagam mais, oferecer um serviço de elite e <strong>triplicar sua renda</strong> com menos esforço
            </p>
          </div>

          {/* Jornada do Personal Premium */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              <span className="text-purple-600">Sua</span> Transformação em 4 Passos
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
                  Cadastro simples: só nome, email, telefone e gênero. Seu aluno recebe o convite e finaliza o cadastro com seus dados e anamnese.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Cadastro em 30 segundos
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Aluno completa o perfil
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Anamnese pronta no sistema
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
                  Você define os horários (seg 12h, ter 15h, sex 17h) e a IA agenda de 1 a 12 meses automaticamente.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Agenda de 1 a 12 meses
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Horários flexíveis
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Lembrete no WhatsApp
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
                <h4 className="text-lg font-bold text-gray-900 text-center mb-2">Treino na Palma da Mão</h4>
                <p className="text-gray-600 text-sm text-center">
                  Aluno vê o treino do dia direto no celular.
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
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 md:p-12 text-white text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Resultado: Você ganha 10h por semana</h3>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Menos tempo em tarefas administrativas = Mais tempo para treinar, criar conteúdo e crescer seu negócio
            </p>
            <Button 
              size="lg" 
              onClick={() => {
                const quizSection = document.getElementById('quiz');
                if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-emerald-600 hover:bg-gray-100 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto"
            >
              Quais São os Benefícios Exclusivos?
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
              Tudo isso em um só lugar
            </h3>
            <p className="text-emerald-100 mb-8 text-lg max-w-2xl mx-auto">
              Economize tempo, ganhe mais dinheiro e tenha controle total do seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => {
                  const atletasSection = document.getElementById('atletas');
                  if (atletasSection) atletasSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
              >
                E Para Atletas e Fisiculturistas?
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-emerald-200 text-sm mt-6">
              Funcionalidades avançadas para quem leva a sério
            </p>
          </div>
        </div>
      </section>

      {/* Seção para Fisiculturistas e Atletas */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white" id="atletas">
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
                onClick={() => {
                  const socialSection = document.getElementById('social-proof');
                  if (socialSection) socialSection.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
              >
                Quem Já Usa o FitPrime?
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white" id="social-proof">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700">
              <Users className="h-3 w-3 mr-1" />
              Histórias Reais
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que dizem os <span className="text-emerald-600">personais que usam</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Veja como o FitPrime transformou a rotina de profissionais como você
            </p>
          </div>

          {/* Grid de Depoimentos */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Depoimento 1 - Dor: Cobrança */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="/testimonials/person1.png" 
                  alt="Rafael Silva" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Rafael Silva</h4>
                  <p className="text-sm text-gray-500">Personal Trainer • São Paulo</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 relative">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-emerald-50 rotate-45"></div>
                <p className="text-gray-700 italic">
                  "Eu perdia 2 alunos por mês só por constrangimento de cobrar. Agora o sistema faz isso por mim. <strong>Minha inadimplência caiu de 25% pra menos de 5%.</strong>"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
            </div>

            {/* Depoimento 2 - Dor: Tempo */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="/testimonials/person2.png" 
                  alt="Camila Rodrigues" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Camila Rodrigues</h4>
                  <p className="text-sm text-gray-500">Personal Trainer • Rio de Janeiro</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 relative">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-emerald-50 rotate-45"></div>
                <p className="text-gray-700 italic">
                  "Eu passava o domingo inteiro montando treinos. Agora a IA faz em segundos e eu só ajusto. <strong>Ganhei meu final de semana de volta.</strong>"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
            </div>

            {/* Depoimento 3 - Dor: Desorganização */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="/testimonials/person3.png" 
                  alt="Márcio Oliveira" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Márcio Oliveira</h4>
                  <p className="text-sm text-gray-500">Personal Trainer • Belo Horizonte</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 relative">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-emerald-50 rotate-45"></div>
                <p className="text-gray-700 italic">
                  "Tinha tudo em planilha, caderno, WhatsApp... Uma bagunça. <strong>Agora tenho tudo num lugar só e nunca mais esqueci horário de aluno.</strong>"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
            </div>

            {/* Depoimento 4 - Solução: Agenda automática */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="/testimonials/person4.png" 
                  alt="Juliana Costa" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Juliana Costa</h4>
                  <p className="text-sm text-gray-500">Personal Trainer • Curitiba</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 relative">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-emerald-50 rotate-45"></div>
                <p className="text-gray-700 italic">
                  "O agendamento automático mudou minha vida. Configuro uma vez e a IA agenda até 12 meses. <strong>Meus alunos recebem lembrete no WhatsApp e eu não preciso fazer nada.</strong>"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
            </div>

            {/* Depoimento 5 - Solução: Profissionalismo */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="/testimonials/person5.png" 
                  alt="Anderson Lima" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Anderson Lima</h4>
                  <p className="text-sm text-gray-500">Coach de Fisiculturismo • Goiânia</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 relative">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-emerald-50 rotate-45"></div>
                <p className="text-gray-700 italic">
                  "Meus atletas agora têm um portal profissional pra acompanhar tudo. <strong>Isso me diferencia da concorrência e justifica meu preço premium.</strong>"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
            </div>

            {/* Depoimento 6 - Solução: Crescimento */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="/testimonials/person6.png" 
                  alt="Fernanda Santos" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Fernanda Santos</h4>
                  <p className="text-sm text-gray-500">Personal Trainer • Brasília</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 relative">
                <div className="absolute -top-2 left-6 w-4 h-4 bg-emerald-50 rotate-45"></div>
                <p className="text-gray-700 italic">
                  "Com o tempo que economizei, consegui pegar mais 5 alunos. <strong>O FitPrime se pagou no primeiro mês e ainda sobrou.</strong>"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">+500</div>
              <p className="text-gray-600">Personais ativos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">+5.000</div>
              <p className="text-gray-600">Alunos gerenciados</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">R$ 2M+</div>
              <p className="text-gray-600">Cobranças processadas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">4.9/5</div>
              <p className="text-gray-600">Avaliação média</p>
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
                {([
                  { feature: "IA para gerar treinos personalizados", a: false, b: false, c: "partial" },
                  { feature: "Agendamento automático com IA (1-12 meses)", a: false, b: false, c: false },
                  { feature: "Cobranças automáticas (PIX/Cartão)", a: "partial", b: true, c: false },
                  { feature: "Bloqueio automático para inadimplentes", a: false, b: false, c: false },
                  { feature: "WhatsApp integrado (notificações)", a: false, b: "partial", c: false },
                  { feature: "Dashboard financeiro (MRR, Churn, Previsão)", a: false, b: false, c: "partial" },
                  { feature: "Portal do aluno personalizado", a: "partial", b: "partial", c: true },
                  { feature: "Anamnese e avaliação física completa", a: true, b: true, c: true },
                  { feature: "Gráficos de evolução (peso, medidas, fotos)", a: false, b: false, c: "partial" },
                  { feature: "Diário de treino detalhado", a: false, b: false, c: false },
                  { feature: "Relatórios de negócio avançados", a: false, b: false, c: "partial" },
                  { feature: "Análise de composição corporal", a: false, b: false, c: "partial" },
                  { feature: "Periodização de treinos", a: "partial", b: "partial", c: true },
                  { feature: "Gestão de múltiplos personais", a: false, b: false, c: "partial" },
                  { feature: "Suporte em português 24/7", a: true, b: true, c: "partial" },
                  { feature: "Automações personalizadas", a: false, b: false, c: false },
                  { feature: "Lixeira com recuperação de dados", a: false, b: false, c: false },
                ] as { feature: string; a: boolean | "partial"; b: boolean | "partial"; c: boolean | "partial" }[]).map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-4 px-4 text-gray-700 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center bg-emerald-50/50">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
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
              onClick={() => {
                const faqSection = document.getElementById('faq');
                if (faqSection) faqSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-6"
            >
              Ainda Tem Dúvidas?
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50" id="faq">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700">
              <MessageSquare className="h-3 w-3 mr-1" />
              Dúvidas Frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo o que você precisa saber
            </h2>
            <p className="text-gray-600">Respostas para as perguntas mais comuns dos personais</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Como a IA gera treinos personalizados em segundos?",
                a: "Nossa IA analisa a anamnese completa do aluno (objetivos, restrições, experiência, equipamentos disponíveis) e gera um treino 100% personalizado em menos de 30 segundos. Você pode ajustar qualquer exercício depois. É como ter um assistente que nunca dorme."
              },
              {
                q: "Como funciona o agendamento automático?",
                a: "Você define os dias e horários de cada aluno (seg 12h, ter 15h, sex 17h). A IA agenda automaticamente de 1 a 12 meses, conforme o contrato que você fechou com o aluno. Lembretes são enviados pelo WhatsApp. Você nunca mais vai precisar ficar trocando mensagem pra confirmar horário."
              },
              {
                q: "Como as cobranças automáticas acabam com a inadimplência?",
                a: "O FitPrime envia cobranças automáticas por PIX ou cartão na data que você definir. Se o aluno não pagar, o sistema bloqueia o acesso ao portal automaticamente. Sem constrangimento, sem conversa difícil. Você foca em treinar, não em cobrar."
              },
              {
                q: "Meus alunos vão conseguir usar o portal sozinhos?",
                a: "Sim! O portal do aluno foi feito pra ser simples. Eles vêem o treino do dia, marcam os exercícios feitos e acompanham a evolução. Tudo pelo celular, sem precisar te mandar mensagem."
              },
              {
                q: "Quanto tempo leva pra começar a usar?",
                a: "Menos de 10 minutos. Você escolhe o plano, cadastra seus alunos (só nome, email e telefone - eles completam o resto) e já começa a usar. A anamnese já está pronta no sistema. Sem treinamento complicado, sem curva de aprendizado. Se você sabe usar WhatsApp, sabe usar o FitPrime."
              },
              {
                q: "E se eu precisar de ajuda?",
                a: "Nosso suporte é 100% em português e responde rápido. Além disso, temos tutoriais em vídeo, central de ajuda e um grupo exclusivo de personais que usam o FitPrime pra trocar experiências."
              },
              {
                q: "Posso cancelar quando quiser?",
                a: "Sim, sem contrato e sem multa. Mas a verdade é que depois que você experimentar ter 10+ horas por semana de volta e nunca mais precisar cobrar aluno, vai ser difícil querer voltar pro WhatsApp e planilha."
              },
              {
                q: "O FitPrime funciona pra quem tem poucos alunos?",
                a: "Funciona e faz ainda mais sentido! Com poucos alunos, cada hora que você perde com burocracia é uma hora que poderia estar captando novos alunos ou descansando. O FitPrime te dá esse tempo de volta."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final - Agressivo e Persuasivo */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container max-w-4xl mx-auto text-center">
          {/* Headline Agressiva */}
          <div className="mb-8">
            <p className="text-emerald-400 font-semibold mb-4 text-lg">Chegou a hora de decidir</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Você vai continuar perdendo<br/>
              <span className="text-red-400">R$ {displayPerdaMensal.toLocaleString('pt-BR')}/mês</span> em burocracia?
            </h2>
          </div>

          {/* Contraste */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6 text-left">
              <h3 className="text-red-400 font-bold text-xl mb-4">Continuar como está:</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Perder {horasBurocracia * 4}h/mês com WhatsApp e planilhas</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Deixar de ganhar R$ {displayPerdaMensal.toLocaleString('pt-BR')}/mês</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Continuar cobrando aluno no constrangimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Trabalhar mais, ganhar menos</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-6 text-left">
              <h3 className="text-emerald-400 font-bold text-xl mb-4">Usar o FitPrime:</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Recuperar {horasBurocracia * 4}h/mês pra treinar ou descansar</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Potencial de ganhar R$ {displayGanhoExtra.toLocaleString('pt-BR')}/mês a mais</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Cobranças automáticas sem constrangimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Trabalhar menos, ganhar mais</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Final - Impactante */}
          <div className="relative overflow-hidden">
            {/* Background com efeito */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            
            <div className="relative p-8 md:p-16 text-center">
              {/* Badge de urgência */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 animate-pulse">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                +500 personais já transformaram seus negócios
              </div>
              
              {/* Headline principal */}
              <h3 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                Chega de perder tempo e dinheiro
              </h3>
              <p className="text-xl md:text-2xl text-emerald-100 mb-2 font-medium">
                Descubra em 2 minutos se o FitPrime é pra você
              </p>
              <p className="text-emerald-200 mb-10 text-lg max-w-xl mx-auto">
                Responda 3 perguntas rápidas e veja qual plano combina com seu momento como personal.
              </p>
              
              {/* Botão principal com efeito */}
              <div className="relative inline-block group">
                <div className="absolute -inset-1 bg-white/30 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/quiz'}
                  className="relative bg-white text-emerald-600 hover:bg-gray-50 text-xl md:text-2xl px-12 md:px-16 py-8 md:py-10 font-black shadow-2xl hover:scale-105 transition-all rounded-xl"
                >
                  QUERO DESCOBRIR AGORA
                  <ArrowRight className="ml-3 h-7 w-7" />
                </Button>
              </div>
              
              {/* Garantias */}
              <div className="flex flex-wrap justify-center gap-6 mt-8 text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span>Sem compromisso</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span>Resultado instantâneo</span>
                </div>
              </div>
              
              {/* Prova social final */}
              <div className="mt-10 pt-8 border-t border-white/20">
                <p className="text-white/80 text-sm">
                  A cada dia que passa, você perde dinheiro com burocracia.
                </p>
                <p className="text-white font-bold mt-1">
                  A pergunta é: até quando?
                </p>
              </div>
            </div>
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
