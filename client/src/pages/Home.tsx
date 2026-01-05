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
  Play
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";

// Link de checkout da Cakto
const CAKTO_CHECKOUT_URL = "https://pay.cakto.com.br/y9iqj9q";

// Função para calcular o próximo domingo à meia-noite (fim da oferta semanal)
function getNextSundayMidnight() {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 59, 999);
  return nextSunday;
}

export default function Home() {
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
  
  // SEO: Definir título da página
  useEffect(() => {
    document.title = "FitPrime Manager - Sistema de Gestão para Personal Trainers";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const handleSubscribe = () => {
    window.open(CAKTO_CHECKOUT_URL, '_blank');
  };

  const handleStartTrial = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">FitPrime</span>
          </div>

        </div>
      </header>

      {/* Hero Section - Alto Astral */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              +500 Personal Trainers já transformaram sua rotina
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Sistema de Gestão para Personal Trainers:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Mais Tempo para Treinar
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              O FitPrime organiza seus alunos, agenda, treinos e cobranças em um só lugar. 
              Você foca no que ama fazer: <strong className="text-gray-900">transformar vidas através do treino</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={handleSubscribe}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-6 shadow-lg shadow-emerald-200"
              >
                Quero Organizar Minha Vida
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleStartTrial}
                className="text-lg px-8 py-6 border-2"
              >
                <Play className="mr-2 h-5 w-5" />
                Testar Grátis
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {['B', 'M', 'J', 'R', 'A'][i-1]}
                    </div>
                  ))}
                </div>
                <span>+500 personais ativos</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios Rápidos */}
      <section className="py-12 px-4 bg-white border-y border-gray-100">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: "Economize 10h/semana", desc: "Automação inteligente" },
              { icon: Users, title: "Alunos Ilimitados", desc: "Sem taxa por aluno" },
              { icon: Smartphone, title: "Portal do Aluno", desc: "Acesso pelo celular" },
              { icon: CreditCard, title: "Cobranças Automáticas", desc: "Receba em dia" },
            ].map((item, i) => (
              <div key={i} className="text-center p-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades - Seção Positiva */}
      <section className="py-20 px-4 bg-gray-50" id="features">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700">
              <Rocket className="h-3 w-3 mr-1" />
              Tudo que você precisa
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades do Sistema para Personal Trainer
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Cada funcionalidade foi pensada para facilitar sua vida e impressionar seus alunos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Gestão de Alunos",
                desc: "Cadastro completo com fotos, medidas, objetivos e histórico de evolução. Tudo organizado e fácil de acessar.",
                highlight: "Ilimitado"
              },
              {
                icon: Calendar,
                title: "Agenda Inteligente",
                desc: "Visualize sua semana, mês ou dia. Arraste e solte para remarcar. Notificações automáticas para você e seus alunos.",
                highlight: "Automático"
              },
              {
                icon: Dumbbell,
                title: "Montagem de Treinos",
                desc: "Crie treinos personalizados com séries, repetições e descanso. Duplique e adapte para outros alunos em segundos.",
                highlight: "Rápido"
              },
              {
                icon: CreditCard,
                title: "Cobranças Automáticas",
                desc: "Gere boletos e PIX automaticamente. Acompanhe quem pagou e quem está pendente. Lembretes automáticos.",
                highlight: "Receba em dia"
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Integrado",
                desc: "Envie treinos, lembretes e mensagens direto pelo WhatsApp. Comunicação rápida e profissional.",
                highlight: "1 clique"
              },
              {
                icon: BarChart3,
                title: "Relatórios e Métricas",
                desc: "Acompanhe sua receita, taxa de presença, evolução dos alunos e muito mais. Dados para tomar decisões.",
                highlight: "Insights"
              },
              {
                icon: Smartphone,
                title: "Portal do Aluno",
                desc: "Seus alunos acessam treinos, agenda e pagamentos pelo celular. Experiência premium que fideliza.",
                highlight: "Profissional"
              },
              {
                icon: Zap,
                title: "Automações",
                desc: "Mensagens de aniversário, lembretes de treino, cobranças... Tudo no piloto automático.",
                highlight: "Economia de tempo"
              },
              {
                icon: Shield,
                title: "Seguro e Confiável",
                desc: "Seus dados e dos seus alunos protegidos com criptografia. Backup automático diário.",
                highlight: "100% seguro"
              },
            ].map((feature, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transformação - Antes e Depois */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Gestão de Alunos e Treinos <span className="text-emerald-600">Simplificada</span>
            </h2>
            <p className="text-gray-600">Veja como o FitPrime transforma seu dia a dia</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Antes */}
            <Card className="border-2 border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-gray-500 flex items-center gap-2">
                  <span className="text-2xl">😓</span> Antes do FitPrime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Planilhas espalhadas pelo celular",
                  "Esquece de cobrar alunos",
                  "Perde tempo montando treino do zero",
                  "Alunos perguntando treino no WhatsApp",
                  "Agenda bagunçada com conflitos",
                  "Não sabe quanto ganhou no mês"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Depois */}
            <Card className="border-2 border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-emerald-700 flex items-center gap-2">
                  <span className="text-2xl">🚀</span> Com o FitPrime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Tudo centralizado em um app",
                  "Cobranças automáticas todo mês",
                  "Duplica treinos em 2 cliques",
                  "Alunos consultam no Portal",
                  "Agenda organizada e visual",
                  "Dashboard com toda sua receita"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-100 text-yellow-700">
              <Star className="h-3 w-3 mr-1 fill-yellow-500" />
              Histórias reais
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Depoimentos de Personal Trainers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Marcos Silva",
                role: "Personal Trainer há 8 anos",
                text: "Antes eu perdia horas organizando planilhas. Agora tenho mais tempo para meus alunos e minha família. O FitPrime mudou minha vida profissional.",
                avatar: "M"
              },
              {
                name: "Ana Paula",
                role: "Personal e Nutricionista",
                text: "Meus alunos amam o Portal! Eles se sentem VIPs por ter acesso aos treinos no celular. Isso me diferencia da concorrência.",
                avatar: "A"
              },
              {
                name: "Ricardo Costa",
                role: "Dono de Studio",
                text: "Gerencio 3 personais e mais de 100 alunos com facilidade. Os relatórios me ajudam a tomar decisões melhores para o negócio.",
                avatar: "R"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="border-0 shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção para Fisiculturistas */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-purple-500/20 text-purple-300">
                <Trophy className="h-3 w-3 mr-1" />
                Para Atletas e Entusiastas
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                App de Treino para Atletas e{" "}
                <span className="text-purple-400">Fisiculturistas</span>
              </h2>
              <p className="text-gray-300 mb-6">
                Se você é fisiculturista, atleta ou simplesmente ama treinar e quer ter controle total 
                da sua evolução, o FitPrime também é para você.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  "Registre todos os seus treinos e cargas",
                  "Acompanhe sua evolução com gráficos",
                  "Organize sua periodização",
                  "Tenha histórico de tudo que fez",
                  "Acesse de qualquer lugar pelo celular"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg"
                onClick={handleSubscribe}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Quero Evoluir Meus Treinos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-purple-500/30">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Seu diário de treino digital</h3>
                  <p className="text-gray-400">
                    Chega de anotar em papel ou perder histórico. 
                    Tenha tudo salvo e organizado para sempre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="py-20 px-4 bg-white" id="pricing">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-emerald-100 text-emerald-700">
            <Gift className="h-3 w-3 mr-1" />
            Oferta especial de lançamento
          </Badge>
          
<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preços do Sistema para Personal Trainer
            </h2>
          
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Menos que o valor de uma sessão de treino para organizar toda sua carreira.
          </p>

          {/* Contador de Urgência */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-8 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-orange-700 font-semibold">Preço promocional por tempo limitado</span>
            </div>
            
            {/* Timer */}
            <div className="flex justify-center gap-2 mb-4">
              <div className="bg-white rounded-lg px-3 py-2 min-w-[55px] shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{String(timeLeft.days).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500">dias</p>
              </div>
              <div className="text-xl text-gray-400 self-center">:</div>
              <div className="bg-white rounded-lg px-3 py-2 min-w-[55px] shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{String(timeLeft.hours).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500">horas</p>
              </div>
              <div className="text-xl text-gray-400 self-center">:</div>
              <div className="bg-white rounded-lg px-3 py-2 min-w-[55px] shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{String(timeLeft.minutes).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500">min</p>
              </div>
              <div className="text-xl text-gray-400 self-center">:</div>
              <div className="bg-white rounded-lg px-3 py-2 min-w-[55px] shadow-sm">
                <p className="text-2xl font-bold text-orange-500">{String(timeLeft.seconds).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500">seg</p>
              </div>
            </div>
            
            {/* Vagas restantes */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="flex -space-x-1">
                {[...Array(Math.min(spotsLeft, 5))].map((_, i) => (
                  <div key={i} className="h-5 w-5 rounded-full bg-emerald-500 border-2 border-white"></div>
                ))}
              </div>
              <span className="text-orange-700">
                <strong>{spotsLeft} vagas</strong> restantes neste preço
              </span>
            </div>
          </div>

          <Card className="border-2 border-emerald-200 shadow-xl max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 text-sm font-medium">
              Mais popular
            </div>
            <CardHeader className="pb-2">
              <div className="text-gray-400 line-through text-lg">De R$ 197/mês</div>
              <CardTitle className="text-5xl font-bold text-gray-900">
                R$ 97<span className="text-xl font-normal text-gray-400">/mês</span>
              </CardTitle>
              <CardDescription className="text-emerald-600 font-medium text-lg">
                Menos de R$ 3,30 por dia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-left space-y-3">
                {[
                  "Alunos ilimitados",
                  "Treinos ilimitados",
                  "Agenda completa",
                  "Cobranças automáticas",
                  "WhatsApp integrado",
                  "Portal do Aluno",
                  "Relatórios e gráficos",
                  "Suporte prioritário",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 space-y-3">
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg py-6"
                  onClick={handleSubscribe}
                >
                  Começar Agora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={handleStartTrial}
                >
                  Testar Grátis por 1 Dia
                </Button>
              </div>
              
              <p className="text-xs text-gray-400 pt-2">
                Pagamento seguro • Cancele quando quiser
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span>Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-500" />
              <span>Cancele Quando Quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-500" />
              <span>Suporte Humanizado</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Perguntas Frequentes sobre o FitPrime</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Posso testar antes de pagar?",
                a: "Sim! Você pode testar o FitPrime gratuitamente por 1 dia. É tempo suficiente para conhecer todas as funcionalidades e ver como ele pode te ajudar."
              },
              {
                q: "Quantos alunos posso cadastrar?",
                a: "Ilimitados! Não cobramos por aluno. Você pode ter 5 ou 500 alunos pelo mesmo valor."
              },
              {
                q: "Meus alunos precisam pagar algo?",
                a: "Não! O Portal do Aluno é gratuito para seus alunos. Eles acessam treinos e agenda sem custo adicional."
              },
              {
                q: "Funciona no celular?",
                a: "Sim! O FitPrime funciona em qualquer dispositivo com navegador. Você e seus alunos podem acessar pelo celular, tablet ou computador."
              },
              {
                q: "E se eu quiser cancelar?",
                a: "Sem problema! Você pode cancelar a qualquer momento, sem multas ou burocracia. Seus dados ficam salvos caso queira voltar."
              },
              {
                q: "Não sou personal, posso usar?",
                a: "Claro! Se você é atleta, fisiculturista ou entusiasta do treino, pode usar o FitPrime para organizar seus próprios treinos e acompanhar sua evolução."
              }
            ].map((faq, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-900">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comece Agora com o Melhor Sistema para Personal Trainer
          </h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Junte-se a mais de 500 personal trainers que já organizaram sua vida com o FitPrime.
          </p>
          
          <Button 
            size="lg"
            onClick={handleSubscribe}
            className="bg-white text-emerald-700 hover:bg-gray-100 text-lg px-8 py-6 shadow-lg"
          >
            Começar Agora por R$ 97/mês
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="text-emerald-200 mt-4 text-sm">
            Pagamento seguro • Cancele quando quiser • Suporte humanizado
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">FitPrime Manager</span>
            </div>
            <p className="text-sm">
              © 2025 FitPrime Manager. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
