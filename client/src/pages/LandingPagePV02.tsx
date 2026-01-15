import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Brain,
  Lightbulb,
  Crown,
  Timer,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Camera,
  FileText,
  Bot,
  Wallet,
  BellRing,
  LineChart,
  UserCheck,
  CalendarCheck,
  ClipboardList,
  Repeat,
  ThumbsUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { trackPageView } from "@/lib/analytics";
import { pixelEvents } from "@/lib/tracking-pixels";
import ChatWidget from "@/components/ChatWidget";
import ExitIntentPopup from "@/components/ExitIntentPopup";

// Função para calcular o próximo domingo à meia-noite
function getNextSundayMidnight() {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 59, 999);
  return nextSunday;
}

export default function LandingPagePV02() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Contador de urgência
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
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

  // Tracking de page view
  useEffect(() => {
    trackPageView('/pv02');
    pixelEvents.viewContent({
      contentId: 'landing_page_pv02',
      contentName: 'Landing Page AIDA PV02',
      contentType: 'product_group',
      contentCategory: 'sales_page',
    });
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const handleCTA = () => {
    setLocation('/quiz-trial');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      <ChatWidget />
      <ExitIntentPopup enabled={true} delay={5000} />
      
      {/* ============================================
          SEÇÃO 1: ATENÇÃO (ATTENTION)
          Capturar atenção imediata com dor + promessa
          ============================================ */}
      
      {/* Header Fixo com CTA */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/fitprime-logo.png" 
              alt="FitPrime Manager" 
              className="h-8 w-auto object-contain"
            />
          </div>
          <Button 
            onClick={handleCTA}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 text-sm"
          >
            Começar Grátis
          </Button>
        </div>
      </header>

      {/* Hero - Atenção Máxima */}
      <section className="pt-20 pb-8 px-4 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-5xl mx-auto text-center">
          
          {/* Badge de Urgência */}
          <div className="mb-6">
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 text-sm">
              <Flame className="h-4 w-4 mr-2 animate-pulse" />
              Oferta por tempo limitado
            </Badge>
          </div>
          
          {/* Headline Principal - A Dor */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            <span className="text-white">Você está </span>
            <span className="text-red-400">perdendo dinheiro</span>
            <br />
            <span className="text-white">toda vez que </span>
            <span className="text-emerald-400">abre o WhatsApp</span>
          </h1>
          
          {/* Subheadline - Agitação */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Enquanto você responde <span className="text-red-400 font-semibold">"qual era meu treino?"</span> pela 
            <span className="text-red-400 font-semibold"> décima vez</span> hoje, 
            outros personais estão <span className="text-emerald-400 font-semibold">faturando R$15.000+</span> por mês 
            com <span className="text-emerald-400 font-semibold">metade do esforço</span>.
          </p>

          {/* CTA Principal - ACIMA DA DOBRA */}
          <div className="mb-8">
            <Button 
              onClick={handleCTA}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-all duration-300"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Quero Parar de Perder Dinheiro
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-sm text-slate-400 mt-3">
              <CheckCircle2 className="h-4 w-4 inline mr-1 text-emerald-500" />
              7 dias grátis • Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>

          {/* Contador de Urgência */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 max-w-md mx-auto mb-8">
            <p className="text-sm text-slate-400 mb-2">Oferta expira em:</p>
            <div className="flex justify-center gap-3">
              {[
                { value: timeLeft.days, label: 'Dias' },
                { value: timeLeft.hours, label: 'Horas' },
                { value: timeLeft.minutes, label: 'Min' },
                { value: timeLeft.seconds, label: 'Seg' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-700 rounded-lg px-3 py-2 min-w-[50px]">
                  <span className="text-2xl font-bold text-emerald-400">{String(item.value).padStart(2, '0')}</span>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prova Social Rápida */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white">
                    {['A','B','C','D','E'][i-1]}
                  </div>
                ))}
              </div>
              <span>+500 personais ativos</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-1">4.9/5 (127 avaliações)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Indicator */}
      <div className="flex justify-center py-4">
        <ChevronDown className="h-8 w-8 text-slate-500 animate-bounce" />
      </div>

      {/* ============================================
          SEÇÃO 2: INTERESSE (INTEREST)
          Mostrar que entendemos a dor profundamente
          ============================================ */}
      
      <section className="py-16 px-4 bg-slate-800">
        <div className="container max-w-5xl mx-auto">
          
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-700 text-slate-300">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              A verdade que ninguém te conta
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              O problema <span className="text-red-400">não é você</span>.
              <br />
              É o <span className="text-red-400">sistema quebrado</span>.
            </h2>
          </div>

          {/* As Dores em Detalhes */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: MessageSquare,
                title: "WhatsApp Infinito",
                pain: "Você responde 50+ mensagens por dia",
                cost: "= 2 horas perdidas",
                color: "red"
              },
              {
                icon: CreditCard,
                title: "Cobranças Manuais",
                pain: "Você corre atrás de pagamentos atrasados",
                cost: "= R$500+ não recebidos/mês",
                color: "red"
              },
              {
                icon: Calendar,
                title: "Agenda Caótica",
                pain: "Remarcações, faltas, conflitos de horário",
                cost: "= 4 aulas perdidas/semana",
                color: "red"
              },
              {
                icon: FileText,
                title: "Treinos no Papel",
                pain: "Aluno esquece, você refaz, ninguém evolui",
                cost: "= Alunos desistem em 3 meses",
                color: "red"
              }
            ].map((item, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-700 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <item.icon className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">{item.title}</h3>
                      <p className="text-slate-400 mb-2">{item.pain}</p>
                      <p className="text-red-400 font-semibold text-sm">{item.cost}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cálculo do Prejuízo */}
          <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-500/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-red-400">Fazendo as contas...</span>
            </h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-4xl font-black text-red-400">10h</p>
                <p className="text-slate-400">por semana em burocracia</p>
              </div>
              <div>
                <p className="text-4xl font-black text-red-400">R$2.000</p>
                <p className="text-slate-400">em aulas não dadas/mês</p>
              </div>
              <div>
                <p className="text-4xl font-black text-red-400">R$24.000</p>
                <p className="text-slate-400">jogados fora por ano</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO 3: DESEJO (DESIRE)
          A solução e todos os benefícios
          ============================================ */}
      
      <section className="py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container max-w-5xl mx-auto">
          
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-4 w-4 mr-2" />
              A solução completa
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              E se você pudesse <span className="text-emerald-400">automatizar tudo</span>
              <br />
              e <span className="text-emerald-400">focar só em treinar</span>?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              O FitPrime Manager é o sistema completo que transforma seu negócio de personal trainer.
            </p>
          </div>

          {/* Features Grid - Todas as funcionalidades */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Bot,
                title: "IA que Monta Treinos",
                description: "Gere treinos personalizados em segundos com inteligência artificial. Considera restrições, objetivos e preferências.",
                tag: "EXCLUSIVO"
              },
              {
                icon: Wallet,
                title: "Cobranças Automáticas",
                description: "PIX, cartão, boleto. O sistema cobra sozinho, envia lembretes e você só recebe. Chega de correr atrás.",
                tag: "POPULAR"
              },
              {
                icon: Calendar,
                title: "Agenda Inteligente",
                description: "Agendamento online, lembretes automáticos, controle de faltas. Seus alunos marcam sozinhos.",
                tag: ""
              },
              {
                icon: Smartphone,
                title: "Portal do Aluno",
                description: "App completo para o aluno ver treinos, registrar séries, acompanhar evolução. Tudo na palma da mão.",
                tag: ""
              },
              {
                icon: Camera,
                title: "Fotos de Evolução",
                description: "Comparativo antes/depois com poses guiadas. Mostre resultados reais e fidelize seus alunos.",
                tag: "NOVO"
              },
              {
                icon: LineChart,
                title: "Dashboard de Métricas",
                description: "Veja faturamento, frequência, evolução de alunos. Tome decisões baseadas em dados reais.",
                tag: ""
              },
              {
                icon: BellRing,
                title: "Lembretes WhatsApp",
                description: "Lembretes automáticos de sessão, pagamento e aniversário. Integração direta com WhatsApp.",
                tag: ""
              },
              {
                icon: RefreshCw,
                title: "Substituição de Exercícios",
                description: "100+ exercícios alternativos. Aluno pode trocar exercício durante o treino se não tiver equipamento.",
                tag: "NOVO"
              },
              {
                icon: ClipboardList,
                title: "Anamnese Completa",
                description: "Formulário profissional de anamnese. Histórico de saúde, lesões, objetivos. Tudo organizado.",
                tag: ""
              },
              {
                icon: UserCheck,
                title: "Gestão de Alunos",
                description: "Cadastro completo, status de pagamento, frequência, evolução. Tudo em um só lugar.",
                tag: ""
              },
              {
                icon: Repeat,
                title: "Periodização Automática",
                description: "Crie mesociclos, microciclos e progressões. O sistema ajusta cargas automaticamente.",
                tag: ""
              },
              {
                icon: Trophy,
                title: "Gamificação",
                description: "Ranking, conquistas, streaks. Mantenha seus alunos motivados e engajados.",
                tag: ""
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    {feature.tag && (
                      <Badge className={`text-xs ${feature.tag === 'EXCLUSIVO' ? 'bg-purple-500/20 text-purple-400' : feature.tag === 'NOVO' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {feature.tag}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Intermediário */}
          <div className="text-center">
            <Button 
              onClick={handleCTA}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-2xl shadow-emerald-500/30"
            >
              <Gift className="h-5 w-5 mr-2" />
              Testar Grátis por 7 Dias
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Transformação - Antes x Depois */}
      <section className="py-16 px-4 bg-slate-800">
        <div className="container max-w-5xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Sua vida <span className="text-red-400">antes</span> vs <span className="text-emerald-400">depois</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Antes */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sem FitPrime
              </h3>
              <ul className="space-y-4">
                {[
                  "Acorda e já tem 30 mensagens no WhatsApp",
                  "Passa 2h por dia respondendo dúvidas",
                  "Corre atrás de pagamentos atrasados",
                  "Alunos esquecem o treino toda semana",
                  "Não sabe quanto faturou no mês",
                  "Trabalha 12h/dia e ganha pouco",
                  "Alunos desistem em 3 meses"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-red-400 mt-1">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Depois */}
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Com FitPrime
              </h3>
              <ul className="space-y-4">
                {[
                  "Acorda tranquilo, sistema já respondeu tudo",
                  "Foca 100% em treinar e evoluir alunos",
                  "Pagamentos caem automaticamente na conta",
                  "Aluno acessa treino no app a qualquer hora",
                  "Dashboard mostra faturamento em tempo real",
                  "Trabalha 6h/dia e fatura 2x mais",
                  "Alunos ficam anos e indicam amigos"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="container max-w-5xl mx-auto">
          
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <Star className="h-4 w-4 mr-2 fill-yellow-400" />
              Prova Social
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              O que dizem os <span className="text-emerald-400">personais que usam</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Carlos Silva",
                role: "Personal Trainer - SP",
                avatar: "CS",
                text: "Antes eu passava 3 horas por dia no WhatsApp. Agora o sistema faz tudo. Meu faturamento dobrou em 4 meses.",
                result: "+R$8.000/mês"
              },
              {
                name: "Ana Paula",
                role: "Personal Trainer - RJ",
                avatar: "AP",
                text: "A cobrança automática mudou minha vida. Não perco mais tempo cobrando, e a inadimplência caiu 90%.",
                result: "90% menos inadimplência"
              },
              {
                name: "Ricardo Mendes",
                role: "Personal Trainer - MG",
                avatar: "RM",
                text: "Meus alunos amam o app. Eles veem o treino, registram tudo, e eu acompanho a evolução em tempo real.",
                result: "Retenção de 95%"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    {testimonial.result}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO 4: AÇÃO (ACTION)
          CTA final com urgência e garantia
          ============================================ */}
      
      <section className="py-16 px-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container max-w-3xl mx-auto text-center">
          
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            Comece agora mesmo
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Pronto para <span className="text-emerald-400">transformar</span>
            <br />
            seu negócio de personal?
          </h2>
          
          <p className="text-xl text-slate-400 mb-8">
            Teste grátis por 7 dias. Sem compromisso. Sem cartão de crédito.
          </p>

          {/* Garantias */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: Shield, text: "7 dias grátis" },
              { icon: CreditCard, text: "Sem cartão" },
              { icon: ThumbsUp, text: "Cancele quando quiser" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
                <item.icon className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Final */}
          <Button 
            onClick={handleCTA}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xl px-12 py-8 rounded-2xl shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            <Rocket className="h-6 w-6 mr-3" />
            QUERO TESTAR GRÁTIS AGORA
            <ArrowRight className="h-6 w-6 ml-3" />
          </Button>
          
          <p className="text-sm text-slate-500 mt-6">
            Mais de 500 personais já transformaram seus negócios com o FitPrime
          </p>

          {/* Contador Final */}
          <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-sm text-slate-400 mb-3">
              <Timer className="h-4 w-4 inline mr-1" />
              Oferta especial expira em:
            </p>
            <div className="flex justify-center gap-3">
              {[
                { value: timeLeft.days, label: 'Dias' },
                { value: timeLeft.hours, label: 'Horas' },
                { value: timeLeft.minutes, label: 'Min' },
                { value: timeLeft.seconds, label: 'Seg' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-700 rounded-lg px-3 py-2 min-w-[50px]">
                  <span className="text-2xl font-bold text-emerald-400">{String(item.value).padStart(2, '0')}</span>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 border-t border-slate-800">
        <div className="container max-w-5xl mx-auto text-center">
          <img 
            src="/fitprime-logo.png" 
            alt="FitPrime Manager" 
            className="h-8 w-auto mx-auto mb-4 opacity-50"
          />
          <p className="text-sm text-slate-500">
            © 2026 FitPrime Manager. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
