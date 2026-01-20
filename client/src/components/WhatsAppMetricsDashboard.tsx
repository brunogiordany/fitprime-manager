import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  MessageSquare,
  Send,
  CheckCheck,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  Zap,
  Eye,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Calendar,
  User,
  X,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppMessageLog {
  log: {
    id: number;
    phone?: string;
    message?: string;
    status?: string | null;
    direction?: string;
    createdAt?: Date | string;
  };
  student?: {
    id: number;
    name?: string;
  };
}

interface AutomationStats {
  totalAutomations: number;
  totalSent: number;
  successRate: number;
  studentsReached: number;
  byType?: { name: string; sent: number; successRate: number }[];
}

interface WhatsAppMetricsDashboardProps {
  messages: WhatsAppMessageLog[];
  chatMessages?: any[];
  automationStats?: AutomationStats;
}

type PeriodOption = 'today' | 'yesterday' | '7d' | '15d' | '30d' | '90d' | 'custom';

export default function WhatsAppMetricsDashboard({ messages, chatMessages = [], automationStats }: WhatsAppMetricsDashboardProps) {
  // Estado para período
  const [period, setPeriod] = useState<PeriodOption>('7d');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Estado para filtro por aluno
  const [selectedStudentId, setSelectedStudentId] = useState<number | 'all'>('all');

  // Extrair lista única de alunos das mensagens
  const students = useMemo(() => {
    const studentMap = new Map<number, string>();
    messages.forEach(m => {
      if (m.student?.id && m.student?.name) {
        studentMap.set(m.student.id, m.student.name);
      }
    });
    return Array.from(studentMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [messages]);

  // Calcular datas do período selecionado
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (period) {
      case 'today':
        return { start: today, end: today };
      case 'yesterday':
        return { start: subDays(today, 1), end: subDays(today, 1) };
      case '7d':
        return { start: subDays(today, 6), end: today };
      case '15d':
        return { start: subDays(today, 14), end: today };
      case '30d':
        return { start: subDays(today, 29), end: today };
      case '90d':
        return { start: subDays(today, 89), end: today };
      case 'custom':
        return {
          start: customDateRange.from || subDays(today, 6),
          end: customDateRange.to || today,
        };
      default:
        return { start: subDays(today, 6), end: today };
    }
  }, [period, customDateRange]);

  // Filtrar mensagens pelo período e aluno
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const msgDate = new Date(m.log.createdAt || new Date());
      const inDateRange = isWithinInterval(msgDate, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
      const matchesStudent = selectedStudentId === 'all' || m.student?.id === selectedStudentId;
      return inDateRange && matchesStudent;
    });
  }, [messages, dateRange, selectedStudentId]);

  const filteredChatMessages = useMemo(() => {
    return chatMessages.filter((m: any) => {
      const msgDate = new Date(m.createdAt);
      const inDateRange = isWithinInterval(msgDate, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
      const matchesStudent = selectedStudentId === 'all' || m.studentId === selectedStudentId;
      return inDateRange && matchesStudent;
    });
  }, [chatMessages, dateRange, selectedStudentId]);

  // Calcular métricas com mensagens filtradas
  const totalMessages = filteredMessages.length;
  const sentMessages = filteredMessages.filter(m => m.log.status === "sent" || m.log.status === "delivered" || m.log.status === "read").length;
  const deliveredMessages = filteredMessages.filter(m => m.log.status === "delivered" || m.log.status === "read").length;
  const readMessages = filteredMessages.filter(m => m.log.status === "read").length;
  const failedMessages = filteredMessages.filter(m => m.log.status === "failed").length;
  const pendingMessages = filteredMessages.filter(m => m.log.status === "pending").length;

  // Taxas
  const deliveryRate = totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(1) : "0";
  const openRate = deliveredMessages > 0 ? ((readMessages / deliveredMessages) * 100).toFixed(1) : "0";
  const failureRate = totalMessages > 0 ? ((failedMessages / totalMessages) * 100).toFixed(1) : "0";

  // Mensagens recebidas vs enviadas (do chat)
  const receivedMessages = filteredChatMessages.filter((m: any) => m.senderType === "student").length;
  const sentChatMessages = filteredChatMessages.filter((m: any) => m.senderType === "personal").length;
  const responseRate = receivedMessages > 0 ? ((sentChatMessages / receivedMessages) * 100).toFixed(1) : "0";

  // Dados para gráfico de linha (período selecionado)
  const daysInPeriod = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end,
  });

  const dailyData = daysInPeriod.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const dayMessages = filteredMessages.filter(m => {
      const msgDate = new Date(m.log.createdAt || new Date());
      return isWithinInterval(msgDate, { start: dayStart, end: dayEnd });
    });

    const dayChatMessages = filteredChatMessages.filter((m: any) => {
      const msgDate = new Date(m.createdAt);
      return isWithinInterval(msgDate, { start: dayStart, end: dayEnd });
    });

    return {
      date: format(day, "dd/MM", { locale: ptBR }),
      fullDate: format(day, "EEEE, dd 'de' MMMM", { locale: ptBR }),
      enviadas: dayMessages.filter(m => m.log.status === "sent" || m.log.status === "delivered" || m.log.status === "read").length,
      entregues: dayMessages.filter(m => m.log.status === "delivered" || m.log.status === "read").length,
      lidas: dayMessages.filter(m => m.log.status === "read").length,
      falhas: dayMessages.filter(m => m.log.status === "failed").length,
      recebidas: dayChatMessages.filter((m: any) => m.senderType === "student").length,
    };
  });

  // Dados para gráfico de pizza (status)
  const statusData = [
    { name: "Entregues", value: deliveredMessages - readMessages, color: "#22c55e" },
    { name: "Lidas", value: readMessages, color: "#3b82f6" },
    { name: "Pendentes", value: pendingMessages, color: "#f59e0b" },
    { name: "Falhas", value: failedMessages, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Dados para gráfico de tipos de mensagem (baseado na direção)
  const messageTypes = filteredMessages.reduce((acc: Record<string, number>, msg) => {
    const type = msg.log.direction === 'inbound' ? 'Recebida' : 'Enviada';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(messageTypes).map(([name, value]) => ({
    name,
    value,
  }));

  // Horários mais ativos
  const hourlyActivity = filteredMessages.reduce((acc: Record<number, number>, msg) => {
    const hour = new Date(msg.log.createdAt || new Date()).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}h`,
    mensagens: hourlyActivity[i] || 0,
  }));

  // Encontrar horário de pico
  const peakHour = Object.entries(hourlyActivity).sort(([, a], [, b]) => b - a)[0];
  const peakHourFormatted = peakHour ? `${peakHour[0].padStart(2, "0")}:00` : "N/A";

  // Cores para os gráficos
  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Phone className="h-6 w-6 text-green-500" />
            Métricas do WhatsApp
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Análise de desempenho das mensagens
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Filtro por Aluno */}
          <Select 
            value={selectedStudentId === 'all' ? 'all' : String(selectedStudentId)} 
            onValueChange={(value) => setSelectedStudentId(value === 'all' ? 'all' : Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por aluno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os alunos</SelectItem>
              {students.map(student => (
                <SelectItem key={student.id} value={String(student.id)}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por Período */}
          <Select value={period} onValueChange={(value: PeriodOption) => setPeriod(value)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === 'custom' && (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {customDateRange.from && customDateRange.to
                    ? `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM')}`
                    : 'Selecionar datas'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range) => {
                    setCustomDateRange({ from: range?.from, to: range?.to });
                    if (range?.from && range?.to) {
                      setIsCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          )}

          <Badge variant="outline" className="text-gray-500">
            {differenceInDays(dateRange.end, dateRange.start) + 1} dias
          </Badge>

          {/* Badge do aluno selecionado */}
          {selectedStudentId !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              {students.find(s => s.id === selectedStudentId)?.name}
              <button 
                onClick={() => setSelectedStudentId('all')}
                className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 premium:from-[#0d1520] premium:to-[#0a0f1a] border-green-200 dark:border-green-800 premium:border-emerald-500/40 premium:shadow-[0_0_15px_rgba(0,255,136,0.15)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 premium:text-emerald-400">Total Enviadas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 premium:text-[#00FF88]">{sentMessages}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 premium:bg-emerald-500/20 flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600 premium:text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600 premium:text-emerald-400/70">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{totalMessages} no total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 premium:from-[#0d1520] premium:to-[#0a0f1a] border-blue-200 dark:border-blue-800 premium:border-cyan-500/40 premium:shadow-[0_0_15px_rgba(0,200,255,0.15)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 premium:text-cyan-400">Taxa de Entrega</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 premium:text-cyan-300">{deliveryRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 premium:bg-cyan-500/20 flex items-center justify-center">
                <CheckCheck className="h-5 w-5 text-blue-600 premium:text-cyan-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-blue-600 premium:text-cyan-400/70">
              <span>{deliveredMessages} entregues</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 premium:from-[#0d1520] premium:to-[#0a0f1a] border-purple-200 dark:border-purple-800 premium:border-violet-500/40 premium:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 premium:text-violet-400">Taxa de Abertura</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 premium:text-violet-300">{openRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 premium:bg-violet-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-600 premium:text-violet-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-purple-600 premium:text-violet-400/70">
              <span>{readMessages} lidas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 premium:from-[#0d1520] premium:to-[#0a0f1a] border-amber-200 dark:border-amber-800 premium:border-amber-500/40 premium:shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 premium:text-amber-400">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 premium:text-amber-300">{responseRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-amber-600 premium:text-amber-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-amber-600 premium:text-amber-400/70">
              <span>{receivedMessages} recebidas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="premium:bg-[#0d1520] premium:border-red-500/30 premium:shadow-[0_0_10px_rgba(239,68,68,0.1)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 premium:bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 premium:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 premium:text-gray-400">Falhas</p>
                <p className="text-lg font-bold premium:text-white">{failedMessages}</p>
                <p className="text-xs text-red-600 premium:text-red-400">{failureRate}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-yellow-500/30 premium:shadow-[0_0_10px_rgba(234,179,8,0.1)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 premium:bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 premium:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 premium:text-gray-400">Pendentes</p>
                <p className="text-lg font-bold premium:text-white">{pendingMessages}</p>
                <p className="text-xs text-yellow-600 premium:text-yellow-400">aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-emerald-500/30 premium:shadow-[0_0_10px_rgba(0,255,136,0.1)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 premium:bg-emerald-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600 premium:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 premium:text-gray-400">Horário de Pico</p>
                <p className="text-lg font-bold premium:text-[#00FF88]">{peakHourFormatted}</p>
                <p className="text-xs text-green-600 premium:text-emerald-400">mais ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-indigo-500/30 premium:shadow-[0_0_10px_rgba(99,102,241,0.1)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 premium:bg-indigo-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600 premium:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 premium:text-gray-400">Engajamento</p>
                <p className="text-lg font-bold premium:text-white">{receivedMessages + sentChatMessages}</p>
                <p className="text-xs text-indigo-600 premium:text-indigo-400">interações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Mensagens por Dia */}
        <Card className="premium:bg-[#0d1520] premium:border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 premium:text-white">
              <TrendingUp className="h-4 w-4 text-green-500 premium:text-emerald-400" />
              Mensagens por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRecebidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="enviadas" 
                    stroke="#22c55e" 
                    fill="url(#colorEnviadas)"
                    name="Enviadas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="recebidas" 
                    stroke="#3b82f6" 
                    fill="url(#colorRecebidas)"
                    name="Recebidas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Status das Mensagens */}
        <Card className="premium:bg-[#0d1520] premium:border-cyan-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 premium:text-white">
              <CheckCheck className="h-4 w-4 text-blue-500 premium:text-cyan-400" />
              Status das Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Sem dados de status disponíveis</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Atividade por Hora */}
        <Card className="premium:bg-[#0d1520] premium:border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 premium:text-white">
              <Clock className="h-4 w-4 text-amber-500 premium:text-amber-400" />
              Atividade por Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="hour" className="text-xs" interval={2} />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="mensagens" fill="#22c55e" radius={[4, 4, 0, 0]} name="Mensagens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Tipos de Mensagem */}
        <Card className="premium:bg-[#0d1520] premium:border-violet-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 premium:text-white">
              <MessageSquare className="h-4 w-4 text-purple-500 premium:text-violet-400" />
              Tipos de Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Sem dados de tipos disponíveis</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas de Automações */}
      {automationStats && (
        <Card className="border-purple-200 dark:border-purple-800 premium:bg-[#0d1520] premium:border-violet-500/40 premium:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 premium:text-white">
              <Zap className="h-4 w-4 text-purple-500 premium:text-violet-400" />
              Estatísticas de Automações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{automationStats.totalAutomations}</p>
                <p className="text-xs text-gray-500">Automações Ativas</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{automationStats.totalSent}</p>
                <p className="text-xs text-gray-500">Mensagens Enviadas</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{automationStats.successRate}%</p>
                <p className="text-xs text-gray-500">Taxa de Sucesso</p>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{automationStats.studentsReached}</p>
                <p className="text-xs text-gray-500">Alunos Alcançados</p>
              </div>
            </div>
            
            {automationStats.byType && automationStats.byType.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Por Tipo de Automação</p>
                <div className="space-y-2">
                  {automationStats.byType.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 premium:bg-[#0d1520] premium:border premium:border-emerald-500/30 rounded-lg gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-green-600 dark:text-green-400 premium:text-emerald-400 premium:border-emerald-500/50">
                          {item.sent} enviadas
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 premium:text-cyan-400 premium:border-cyan-500/50">
                          {item.successRate}% sucesso
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 premium:from-[#0d1520] premium:to-[#0a0f1a] border-green-200 dark:border-green-800 premium:border-emerald-500/40 premium:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300 premium:text-[#00FF88]">
            <Zap className="h-4 w-4" />
            Insights Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-green-500/20 premium:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-green-600 premium:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-300 premium:text-emerald-300">Melhor horário</p>
                <p className="text-green-600 dark:text-green-400 premium:text-emerald-400/80">
                  {peakHourFormatted !== "N/A" 
                    ? `Envie mensagens às ${peakHourFormatted} para maior engajamento`
                    : "Ainda não há dados suficientes"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-500/20 premium:bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="h-3 w-3 text-blue-600 premium:text-cyan-400" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-300 premium:text-cyan-300">Taxa de abertura</p>
                <p className="text-green-600 dark:text-green-400 premium:text-cyan-400/80">
                  {parseFloat(openRate) > 70 
                    ? "Excelente! Suas mensagens estão sendo lidas"
                    : parseFloat(openRate) > 40
                    ? "Boa taxa, continue assim!"
                    : "Tente personalizar mais suas mensagens"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 premium:bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="h-3 w-3 text-purple-600 premium:text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-300 premium:text-violet-300">Engajamento</p>
                <p className="text-green-600 dark:text-green-400 premium:text-violet-400/80">
                  {parseFloat(responseRate) > 50 
                    ? "Ótimo! Seus alunos estão respondendo bem"
                    : parseFloat(responseRate) > 20
                    ? "Bom engajamento, pode melhorar"
                    : "Incentive mais respostas dos alunos"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
