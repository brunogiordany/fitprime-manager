import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from "date-fns";
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

interface WhatsAppMetricsDashboardProps {
  messages: WhatsAppMessageLog[];
  chatMessages?: any[];
}

export default function WhatsAppMetricsDashboard({ messages, chatMessages = [] }: WhatsAppMetricsDashboardProps) {
  // Calcular métricas
  const totalMessages = messages.length;
  const sentMessages = messages.filter(m => m.log.status === "sent" || m.log.status === "delivered" || m.log.status === "read").length;
  const deliveredMessages = messages.filter(m => m.log.status === "delivered" || m.log.status === "read").length;
  const readMessages = messages.filter(m => m.log.status === "read").length;
  const failedMessages = messages.filter(m => m.log.status === "failed").length;
  const pendingMessages = messages.filter(m => m.log.status === "pending").length;

  // Taxas
  const deliveryRate = totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(1) : "0";
  const openRate = deliveredMessages > 0 ? ((readMessages / deliveredMessages) * 100).toFixed(1) : "0";
  const failureRate = totalMessages > 0 ? ((failedMessages / totalMessages) * 100).toFixed(1) : "0";

  // Mensagens recebidas vs enviadas (do chat)
  const receivedMessages = chatMessages.filter((m: any) => m.senderType === "student").length;
  const sentChatMessages = chatMessages.filter((m: any) => m.senderType === "personal").length;
  const responseRate = receivedMessages > 0 ? ((sentChatMessages / receivedMessages) * 100).toFixed(1) : "0";

  // Dados para gráfico de linha (últimos 7 dias)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const dailyData = last7Days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const dayMessages = messages.filter(m => {
      const msgDate = new Date(m.log.createdAt || new Date());
      return isWithinInterval(msgDate, { start: dayStart, end: dayEnd });
    });

    const dayChatMessages = chatMessages.filter((m: any) => {
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
  const messageTypes = messages.reduce((acc: Record<string, number>, msg) => {
    const type = msg.log.direction === 'inbound' ? 'Recebida' : 'Enviada';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(messageTypes).map(([name, value]) => ({
    name,
    value,
  }));

  // Horários mais ativos
  const hourlyActivity = messages.reduce((acc: Record<number, number>, msg) => {
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
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Calendar className="h-3 w-3 mr-1" />
          Últimos 7 dias
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Total Enviadas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{sentMessages}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{totalMessages} no total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Taxa de Entrega</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{deliveryRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <span>{deliveredMessages} entregues</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Taxa de Abertura</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{openRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-purple-600">
              <span>{readMessages} lidas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{responseRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-amber-600">
              <span>{receivedMessages} recebidas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Falhas</p>
                <p className="text-lg font-bold">{failedMessages}</p>
                <p className="text-xs text-red-600">{failureRate}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pendentes</p>
                <p className="text-lg font-bold">{pendingMessages}</p>
                <p className="text-xs text-yellow-600">aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Horário de Pico</p>
                <p className="text-lg font-bold">{peakHourFormatted}</p>
                <p className="text-xs text-green-600">mais ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Engajamento</p>
                <p className="text-lg font-bold">{receivedMessages + sentChatMessages}</p>
                <p className="text-xs text-indigo-600">interações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Mensagens por Dia */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-blue-500" />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
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

      {/* Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
            <Zap className="h-4 w-4" />
            Insights Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Melhor horário</p>
                <p className="text-green-600 dark:text-green-400">
                  {peakHourFormatted !== "N/A" 
                    ? `Envie mensagens às ${peakHourFormatted} para maior engajamento`
                    : "Ainda não há dados suficientes"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Taxa de abertura</p>
                <p className="text-green-600 dark:text-green-400">
                  {parseFloat(openRate) > 70 
                    ? "Excelente! Suas mensagens estão sendo lidas"
                    : parseFloat(openRate) > 40
                    ? "Boa taxa, continue assim!"
                    : "Tente personalizar mais suas mensagens"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="h-3 w-3 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Engajamento</p>
                <p className="text-green-600 dark:text-green-400">
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
