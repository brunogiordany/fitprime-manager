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
  FileText,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Timer,
  XCircle,
  Brain,
  Target,
  Sparkles,
  Award,
  ChevronRight,
  Star,
  Phone,
  Mail,
  MapPin,
  Play,
  Check,
  X,
  ArrowDown,
  Flame,
  Heart,
  Lightbulb,
  Rocket
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showPricing, setShowPricing] = useState(false);

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

  // Dados de dores e estatísticas
  const painPoints = [
    {
      icon: Timer,
      title: "8 horas por semana",
      subtitle: "perdidas com tarefas manuais",
      description: "Anotações em papel, planilhas confusas, mensagens manuais... Tempo que você poderia estar treinando mais alunos ou descansando.",
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      icon: DollarSign,
      title: "R$ 2.400/mês",
      subtitle: "deixados na mesa",
      description: "Cobranças esquecidas, alunos que somem sem pagar, falta de controle financeiro. Dinheiro que já era seu e você perdeu.",
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      icon: Users,
      title: "3 alunos por mês",
      subtitle: "perdidos por desorganização",
      description: "Aluno que não recebeu o treino, sessão esquecida, falta de acompanhamento. Eles vão para o concorrente que é mais organizado.",
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Gestão Completa de Alunos",
      description: "Cadastre seus alunos em segundos. Perfil completo com foto, contato, anamnese detalhada, histórico de medidas e evolução. Tudo num só lugar, acessível de qualquer dispositivo.",
      benefits: ["Cadastro em 30 segundos", "Anamnese completa", "Histórico de evolução", "Fotos de antes/depois"]
    },
    {
      icon: Dumbbell,
      title: "Treinos Personalizados",
      description: "Monte treinos profissionais em minutos. Organize por dia da semana (A, B, C), adicione exercícios com séries, repetições, carga e até vídeos demonstrativos. Seus alunos recebem tudo no celular.",
      benefits: ["Treinos por dia da semana", "Vídeos demonstrativos", "Diário de treino", "Aluno registra evolução"]
    },
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Visualize sua semana inteira num só lugar. Agende sessões, controle presença, veja quem faltou, quem confirmou. Nunca mais esqueça um horário ou perca um aluno por falta de organização.",
      benefits: ["Visão diária e semanal", "Controle de presença", "Lembretes automáticos", "Agendamento recorrente"]
    },
    {
      icon: CreditCard,
      title: "Cobranças Automáticas",
      description: "Crie planos (mensal, trimestral, semestral), vincule ao aluno e pronto. O sistema gera as cobranças automaticamente, envia lembretes e você só acompanha quem pagou. Aceita cartão de crédito!",
      benefits: ["Planos personalizados", "Cobranças automáticas", "Pagamento por cartão", "Lembretes de vencimento"]
    },
    {
      icon: BarChart3,
      title: "Evolução com Gráficos",
      description: "Acompanhe o progresso real dos seus alunos. Peso, medidas, percentual de gordura, tudo em gráficos bonitos e fáceis de entender. Mostre resultados concretos e fidelize seus clientes.",
      benefits: ["Gráficos de evolução", "Cálculo automático de BF", "Comparativo de medidas", "Relatórios em PDF"]
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integrado",
      description: "Conecte seu WhatsApp e automatize mensagens. Lembrete de treino, cobrança de pagamento, parabéns de aniversário... Tudo automático, sem você precisar lembrar de nada.",
      benefits: ["Lembretes automáticos", "Cobrança por WhatsApp", "Mensagens de aniversário", "Confirmação de sessão"]
    },
  ];

  const comparisonData = [
    { feature: "Tempo gasto com tarefas administrativas", without: "8+ horas/semana", with: "30 minutos/semana" },
    { feature: "Cobranças esquecidas por mês", without: "R$ 500-2.000", with: "R$ 0" },
    { feature: "Alunos perdidos por desorganização", without: "2-4 por mês", with: "0" },
    { feature: "Tempo para montar um treino", without: "30-60 minutos", with: "5 minutos" },
    { feature: "Controle de presença", without: "Caderninho/memória", with: "Automático" },
    { feature: "Lembretes de sessão", without: "Manual (esquece)", with: "Automático via WhatsApp" },
    { feature: "Acompanhamento de evolução", without: "Fotos no celular", with: "Gráficos profissionais" },
    { feature: "Profissionalismo percebido", without: "Amador", with: "Profissional" },
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Personal Trainer há 8 anos",
      text: "Antes eu perdia horas anotando treinos em papel e cobrando alunos pelo WhatsApp. Agora faço tudo em minutos e meus alunos me veem como muito mais profissional.",
      rating: 5
    },
    {
      name: "Ana Paula",
      role: "Personal Trainer há 3 anos",
      text: "Recuperei 3 alunos que tinham desistido só porque agora eu mando os treinos certinho e acompanho a evolução deles. O sistema se paga em uma semana.",
      rating: 5
    },
    {
      name: "Roberto Mendes",
      role: "Personal Trainer há 12 anos",
      text: "Nunca mais esqueci de cobrar ninguém. O sistema avisa automaticamente e eu só acompanho. Minha receita aumentou 40% em 3 meses.",
      rating: 5
    },
  ];

  const handleStartTrial = () => {
    window.location.href = getLoginUrl();
  };

  const handleSubscribe = () => {
    // Redireciona para o checkout do Stripe
    window.location.href = '/api/subscription/checkout';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
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
            <Button variant="ghost" onClick={() => setLocation('/portal')} className="hidden sm:flex">
              Portal do Aluno
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={handleStartTrial}
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Problema */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-red-100 text-red-700 hover:bg-red-100 text-sm px-4 py-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              A verdade que ninguém te conta
            </Badge>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              Você está <span className="text-red-500">perdendo dinheiro</span> todo mês
              <br className="hidden md:block" />
              <span className="text-gray-600">e nem percebe</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Enquanto você anota treinos em papel, cobra pelo WhatsApp e esquece sessões, 
              <strong className="text-gray-900"> seus concorrentes estão usando sistemas profissionais</strong> para 
              atender mais alunos, cobrar sem constrangimento e parecer muito mais profissionais que você.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8 py-6"
                onClick={handleStartTrial}
              >
                Quero Parar de Perder Dinheiro
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 inline mr-1 text-emerald-500" />
              Teste grátis por 1 dia • Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900">
              Quanto você está perdendo <span className="text-red-500">agora mesmo?</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Esses números são baseados em pesquisas com mais de 500 personal trainers. 
              Reconhece algum deles?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {painPoints.map((point, index) => (
              <Card key={index} className={`border-2 border-red-100 ${point.bgColor} hover:shadow-lg transition-all`}>
                <CardHeader className="pb-2">
                  <div className={`h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center mb-4`}>
                    <point.icon className={`h-6 w-6 ${point.color}`} />
                  </div>
                  <CardTitle className={`text-3xl font-bold ${point.color}`}>{point.title}</CardTitle>
                  <CardDescription className="text-red-600 font-medium">{point.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-red-700 mb-2">
              Somando tudo: você pode estar perdendo até <span className="text-3xl md:text-4xl">R$ 5.000/mês</span>
            </h3>
            <p className="text-red-600">
              Entre tempo desperdiçado, cobranças esquecidas e alunos perdidos. 
              <strong> E o pior: você nem percebe porque não tem controle.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900">
              Sua vida <span className="text-red-500">SEM</span> vs <span className="text-emerald-500">COM</span> o FitPrime
            </h2>
            <p className="text-gray-600">
              Veja a diferença real no seu dia a dia
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-100 p-4 font-bold text-sm md:text-base">
              <div className="text-gray-700">Situação</div>
              <div className="text-red-600 text-center">
                <X className="h-5 w-5 inline mr-1" />
                Sem FitPrime
              </div>
              <div className="text-emerald-600 text-center">
                <Check className="h-5 w-5 inline mr-1" />
                Com FitPrime
              </div>
            </div>
            {comparisonData.map((row, index) => (
              <div key={index} className={`grid grid-cols-3 p-4 text-sm md:text-base ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-t`}>
                <div className="text-gray-700 font-medium">{row.feature}</div>
                <div className="text-red-600 text-center">{row.without}</div>
                <div className="text-emerald-600 text-center font-medium">{row.with}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Solução */}
      <section className="py-16 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <Sparkles className="h-3 w-3 mr-1" />
              A solução completa
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900">
              Tudo que você precisa para <span className="text-emerald-600">triplicar sua organização</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Funcionalidades pensadas por personal trainers, para personal trainers. 
              Simples de usar, mesmo se você não entende nada de tecnologia.
            </p>
          </div>

          <div className="space-y-8">
            {features.map((feature, index) => (
              <Card key={index} className={`border-0 shadow-lg overflow-hidden ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                <div className="md:flex">
                  <div className={`md:w-1/3 bg-gradient-to-br from-emerald-500 to-teal-600 p-8 flex items-center justify-center ${index % 2 === 0 ? '' : 'md:order-2'}`}>
                    <feature.icon className="h-24 w-24 text-white/90" />
                  </div>
                  <div className="md:w-2/3 p-6 md:p-8">
                    <CardTitle className="text-xl md:text-2xl mb-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600 mb-6">
                      {feature.description}
                    </CardDescription>
                    <div className="grid grid-cols-2 gap-3">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portal do Aluno Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container max-w-6xl mx-auto">
          <div className="md:flex items-center gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <Badge className="mb-6 bg-white text-emerald-700">
                <Smartphone className="h-3 w-3 mr-1" />
                Bônus exclusivo
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900">
                Portal do Aluno: seu aluno acessa <span className="text-emerald-600">tudo pelo celular</span>
              </h2>
              <p className="text-gray-600 mb-6">
                Seus alunos recebem um convite e acessam um portal exclusivo onde podem:
              </p>
              <div className="space-y-3">
                {[
                  "Ver os treinos do dia com vídeos demonstrativos",
                  "Registrar o treino realizado (você recebe notificação)",
                  "Ver a agenda de sessões e confirmar presença",
                  "Acompanhar sua própria evolução com gráficos",
                  "Ver histórico de pagamentos",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border-4 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Portal do Aluno</p>
                    <p className="text-sm text-gray-500">Acesso exclusivo para seus clientes</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="font-medium text-emerald-700">Treino de Hoje: Treino A - Peito e Tríceps</p>
                    <p className="text-emerald-600">4 exercícios • 45 minutos</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-700">Próxima Sessão: Amanhã às 07:00</p>
                    <p className="text-blue-600">Academia XYZ • Confirmado</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="font-medium text-purple-700">Sua Evolução</p>
                    <p className="text-purple-600">-3kg este mês • -8% gordura</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900">
              O que dizem os personal trainers que <span className="text-emerald-600">já usam</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-900 to-gray-800" id="pricing">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">
            <Flame className="h-3 w-3 mr-1" />
            Oferta especial de lançamento
          </Badge>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-white">
            Quanto vale resolver <span className="text-emerald-400">todos esses problemas?</span>
          </h2>
          
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Você está perdendo até R$ 5.000/mês com desorganização. 
            O FitPrime custa menos que <strong className="text-white">uma única sessão de treino</strong>.
          </p>

          <Card className="bg-white/10 backdrop-blur border-emerald-500/30 max-w-md mx-auto">
            <CardHeader>
              <div className="text-gray-400 line-through text-lg">De R$ 197/mês</div>
              <CardTitle className="text-5xl font-bold text-white">
                R$ 97<span className="text-xl font-normal text-gray-400">/mês</span>
              </CardTitle>
              <CardDescription className="text-emerald-400 font-medium">
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
                  <div key={i} className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
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
                  Assinar Agora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full border-gray-600 text-white hover:bg-white/10"
                  onClick={handleStartTrial}
                >
                  Testar Grátis por 1 Dia
                </Button>
              </div>
              
              <p className="text-xs text-gray-400 pt-2">
                Pagamento seguro via Stripe • Cancele quando quiser
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Pagamento Seguro</p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Cancele Quando Quiser</p>
            </div>
            <div className="text-center">
              <Heart className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Suporte Humanizado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção para Fisiculturistas */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" id="fisiculturistas">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-purple-500/20 text-purple-300 hover:bg-purple-500/20">
              <Target className="h-3 w-3 mr-1" />
              Para quem leva a sério
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-white">
              Não é personal? <span className="text-purple-300">Também é pra você.</span>
            </h2>
            <p className="text-purple-200 max-w-3xl mx-auto text-lg">
              Se você é <strong className="text-white">fisiculturista</strong>, <strong className="text-white">entusiasta da musculação</strong> ou simplesmente 
              alguém que <strong className="text-white">leva o treino a sério</strong>, o FitPrime é a ferramenta que vai 
              transformar seus resultados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Dores do Fisiculturista */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Você se identifica?
              </h3>
              {[
                {
                  title: "Treinos perdidos em anotações",
                  desc: "Caderninho, notas do celular, planilhas... Você nunca sabe onde anotou aquele PR do supino."
                },
                {
                  title: "Sem histórico de evolução",
                  desc: "Quanto você levantava há 3 meses? Qual era seu peso? Suas medidas? Você não lembra."
                },
                {
                  title: "Periodização no achismo",
                  desc: "Você treina forte, mas não tem controle real. Não sabe se está progredindo ou estagnado."
                },
                {
                  title: "Fotos de evolução espalhadas",
                  desc: "Aquela foto de 6 meses atrás? Perdida em alguma pasta do celular. Impossível comparar."
                },
              ].map((item, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="font-medium text-red-300">{item.title}</p>
                  <p className="text-sm text-red-200/80">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Solução */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                Com o FitPrime você tem:
              </h3>
              {[
                {
                  title: "Diário de treino completo",
                  desc: "Registre cada série, cada repetição, cada carga. Veja seu histórico completo de qualquer exercício."
                },
                {
                  title: "Gráficos de evolução reais",
                  desc: "Peso, medidas, percentual de gordura, tudo em gráficos. Veja sua evolução semana a semana."
                },
                {
                  title: "Cálculo automático de BF",
                  desc: "Insira suas medidas e o sistema calcula seu percentual de gordura. Acompanhe sua composição corporal."
                },
                {
                  title: "Galeria de fotos organizada",
                  desc: "Todas as suas fotos de evolução em um só lugar, organizadas por data. Compare facilmente."
                },
              ].map((item, i) => (
                <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <p className="font-medium text-emerald-300">{item.title}</p>
                  <p className="text-sm text-emerald-200/80">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparativo Fisiculturista */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 md:p-8 mb-12">
            <h3 className="text-xl font-bold text-white mb-6 text-center">O que você ganha com controle total</h3>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {[
                { value: "100%", label: "dos treinos registrados", desc: "Nunca mais perca uma anotação" },
                { value: "3x", label: "mais consistência", desc: "Dados mostram que quem registra, evolui mais" },
                { value: "6 meses", label: "de histórico visual", desc: "Veja de onde você veio" },
                { value: "∞", label: "motivação", desc: "Ver evolução real motiva a continuar" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-3xl md:text-4xl font-bold text-purple-300">{stat.value}</p>
                  <p className="text-white font-medium">{stat.label}</p>
                  <p className="text-sm text-purple-200/70">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Depoimento Fisiculturista */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex gap-1 mb-4 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-white text-center italic mb-6">
              "Eu treinava há 5 anos e achava que estava evoluindo. Quando comecei a registrar tudo no FitPrime, 
              descobri que estava estagnado há meses. Em 3 meses de controle real, quebrei todos os meus PRs. 
              <strong className="text-purple-300">Dados não mentem.</strong>"
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                M
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Marcos Oliveira</p>
                <p className="text-sm text-purple-300">Fisiculturista amador • 4 anos de treino</p>
              </div>
            </div>
          </div>

          {/* CTA Fisiculturista */}
          <div className="text-center mt-12">
            <p className="text-purple-200 mb-6">
              <strong className="text-white">Mesmo preço, mesmas funcionalidades.</strong> Use como seu diário de treino pessoal.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-lg px-8 py-6"
              onClick={handleStartTrial}
            >
              Quero Controlar Minha Evolução
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Preciso entender de tecnologia para usar?",
                a: "Não! O FitPrime foi feito para ser simples. Se você sabe usar WhatsApp, sabe usar o FitPrime. Temos tutoriais em vídeo e suporte para te ajudar."
              },
              {
                q: "Posso testar antes de pagar?",
                a: "Sim! Você tem 1 dia grátis para testar todas as funcionalidades. Não precisa de cartão de crédito para começar."
              },
              {
                q: "E se eu não gostar?",
                a: "Você pode cancelar a qualquer momento, sem multa e sem burocracia. É só clicar em cancelar na sua conta."
              },
              {
                q: "Meus alunos precisam pagar algo?",
                a: "Não! O acesso ao Portal do Aluno é gratuito para todos os seus clientes. Você paga apenas a sua assinatura."
              },
              {
                q: "Não sou personal, posso usar?",
                a: "Claro! Muitos fisiculturistas e entusiastas usam o FitPrime como diário de treino pessoal. Você pode registrar seus treinos, acompanhar sua evolução e organizar suas fotos de progresso."
              },
              {
                q: "Funciona no celular?",
                a: "Sim! O FitPrime funciona em qualquer dispositivo: celular, tablet ou computador. Você e seus alunos acessam de qualquer lugar."
              },
              {
                q: "Como funciona a integração com WhatsApp?",
                a: "Você conecta seu WhatsApp escaneando um QR Code (igual ao WhatsApp Web). Depois, o sistema envia mensagens automáticas para seus alunos."
              },
            ].map((faq, i) => (
              <Card key={i} className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-emerald-500" />
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-500 to-teal-600">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-white">
            Pare de perder dinheiro. <span className="text-emerald-100">Comece agora.</span>
          </h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            Cada dia que passa sem organização é dinheiro que você está deixando na mesa. 
            Seus concorrentes já estão usando sistemas profissionais. E você?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-6"
              onClick={handleSubscribe}
            >
              Assinar por R$ 97/mês
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={handleStartTrial}
            >
              Testar Grátis por 1 Dia
            </Button>
          </div>
          <p className="text-emerald-100 text-sm mt-6">
            <CheckCircle2 className="h-4 w-4 inline mr-1" />
            Mais de 500 personal trainers já usam • Pagamento seguro • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-gray-900 text-white">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold">FitPrime Manager</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Termos de Uso</a>
              <a href="#" className="hover:text-white">Privacidade</a>
              <a href="#" className="hover:text-white">Suporte</a>
            </div>
            <p className="text-sm text-gray-400">
              © 2025 FitPrime. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
