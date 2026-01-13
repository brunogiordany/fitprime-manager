import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { 
  Activity, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Zap,
  Eye,
  UserPlus,
  ShoppingCart,
  CreditCard
} from "lucide-react";

// Mapeamento de ícones por tipo de evento
const eventIcons: Record<string, React.ReactNode> = {
  PageView: <Eye className="w-4 h-4" />,
  ViewContent: <Eye className="w-4 h-4" />,
  Lead: <UserPlus className="w-4 h-4" />,
  CompleteRegistration: <CheckCircle className="w-4 h-4" />,
  StartTrial: <Zap className="w-4 h-4" />,
  InitiateCheckout: <ShoppingCart className="w-4 h-4" />,
  AddPaymentInfo: <CreditCard className="w-4 h-4" />,
  Purchase: <DollarSign className="w-4 h-4" />,
  Subscribe: <CheckCircle className="w-4 h-4" />,
};

// Cores por tipo de evento
const eventColors: Record<string, string> = {
  PageView: "bg-gray-500",
  ViewContent: "bg-blue-500",
  Lead: "bg-green-500",
  CompleteRegistration: "bg-emerald-500",
  StartTrial: "bg-yellow-500",
  InitiateCheckout: "bg-orange-500",
  AddPaymentInfo: "bg-purple-500",
  Purchase: "bg-red-500",
  Subscribe: "bg-pink-500",
};

export default function AdminPixelDashboard() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [eventFilter, setEventFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.tracking.getEventStats.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Buscar eventos
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = trpc.tracking.listEvents.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
    eventName: eventFilter || undefined,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Exportar CSV
  const handleExportCSV = () => {
    if (!eventsData?.events) return;

    const headers = [
      "ID",
      "Evento",
      "Fonte",
      "Email",
      "Telefone",
      "Nome",
      "Valor",
      "URL",
      "API Enviado",
      "Data",
    ];

    const rows = eventsData.events.map((event) => [
      event.id,
      event.eventName,
      event.eventSource,
      event.userEmail || "",
      event.userPhone || "",
      event.userName || "",
      event.value || "",
      event.sourceUrl || "",
      event.apiSent ? "Sim" : "Não",
      new Date(event.createdAt).toLocaleString("pt-BR"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pixel-events-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    refetchStats();
    refetchEvents();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              Dashboard de Eventos do Pixel
            </h1>
            <p className="text-slate-400 mt-1">
              Monitore eventos do Meta Pixel e taxa de sucesso da Conversions API
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos os eventos</option>
                <option value="PageView">PageView</option>
                <option value="ViewContent">ViewContent</option>
                <option value="Lead">Lead</option>
                <option value="CompleteRegistration">CompleteRegistration</option>
                <option value="StartTrial">StartTrial</option>
                <option value="InitiateCheckout">InitiateCheckout</option>
                <option value="AddPaymentInfo">AddPaymentInfo</option>
                <option value="Purchase">Purchase</option>
                <option value="Subscribe">Subscribe</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total de Eventos */}
          <div className="bg-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Eventos</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? "..." : (stats?.total || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Taxa de Sucesso da API */}
          <div className="bg-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Taxa de Sucesso API</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? "..." : `${stats?.apiSuccessRate || 0}%`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.apiSuccess || 0} / {stats?.apiTotal || 0} enviados
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                (stats?.apiSuccessRate || 0) >= 90 ? "bg-green-500/20" : 
                (stats?.apiSuccessRate || 0) >= 70 ? "bg-yellow-500/20" : "bg-red-500/20"
              }`}>
                {(stats?.apiSuccessRate || 0) >= 90 ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
            </div>
          </div>

          {/* Valor Total de Purchase */}
          <div className="bg-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Valor de Compras</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? "..." : `R$ ${Number(stats?.purchaseValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Eventos de Conversão */}
          <div className="bg-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Conversões (Lead+Purchase)</p>
                <p className="text-3xl font-bold mt-1">
                  {statsLoading ? "..." : (
                    (stats?.eventsByType?.find((e: any) => e.eventName === "Lead")?.count || 0) +
                    (stats?.eventsByType?.find((e: any) => e.eventName === "Purchase")?.count || 0)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Eventos por Tipo */}
          <div className="bg-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Eventos por Tipo</h3>
            <div className="space-y-3">
              {stats?.eventsByType?.map((event: any) => {
                const maxCount = Math.max(...(stats?.eventsByType?.map((e: any) => Number(e.count)) || [1]));
                const percentage = (Number(event.count) / maxCount) * 100;
                return (
                  <div key={event.eventName} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${eventColors[event.eventName] || "bg-gray-500"}`}>
                      {eventIcons[event.eventName] || <Activity className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{event.eventName}</span>
                        <span className="text-slate-400">{Number(event.count).toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${eventColors[event.eventName] || "bg-gray-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!stats?.eventsByType || stats.eventsByType.length === 0) && (
                <p className="text-slate-400 text-center py-4">Nenhum evento registrado</p>
              )}
            </div>
          </div>

          {/* Eventos por Fonte */}
          <div className="bg-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Eventos por Fonte</h3>
            <div className="grid grid-cols-3 gap-4">
              {stats?.eventsBySource?.map((source: any) => (
                <div key={source.eventSource} className="bg-slate-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{Number(source.count).toLocaleString()}</p>
                  <p className="text-slate-400 text-sm capitalize">{source.eventSource}</p>
                </div>
              ))}
              {(!stats?.eventsBySource || stats.eventsBySource.length === 0) && (
                <p className="text-slate-400 text-center py-4 col-span-3">Nenhum evento registrado</p>
              )}
            </div>

            {/* Gráfico de Tendência */}
            <h4 className="text-sm font-medium text-slate-400 mt-6 mb-3">Tendência (últimos 30 dias)</h4>
            <div className="h-32 flex items-end gap-1">
              {stats?.eventsByDay?.map((day: any, index: number) => {
                const maxCount = Math.max(...(stats?.eventsByDay?.map((d: any) => Number(d.count)) || [1]));
                const height = (Number(day.count) / maxCount) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 bg-emerald-500 rounded-t hover:bg-emerald-400 transition cursor-pointer group relative"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${day.date}: ${day.count} eventos`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {day.date}: {day.count}
                    </div>
                  </div>
                );
              })}
              {(!stats?.eventsByDay || stats.eventsByDay.length === 0) && (
                <p className="text-slate-400 text-center py-4 w-full">Sem dados de tendência</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Eventos */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold">Últimos Eventos</h3>
            <p className="text-slate-400 text-sm">
              {eventsData?.total || 0} eventos encontrados
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Evento</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Fonte</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Usuário</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Valor</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">API</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {eventsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Carregando eventos...
                    </td>
                  </tr>
                ) : eventsData?.events?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Nenhum evento encontrado
                    </td>
                  </tr>
                ) : (
                  eventsData?.events?.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${eventColors[event.eventName] || "bg-gray-500"}`}>
                            {eventIcons[event.eventName] || <Activity className="w-4 h-4" />}
                          </div>
                          <span className="font-medium">{event.eventName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.eventSource === "api" ? "bg-blue-500/20 text-blue-400" :
                          event.eventSource === "webhook" ? "bg-purple-500/20 text-purple-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {event.eventSource}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {event.userName && <p className="font-medium">{event.userName}</p>}
                          {event.userEmail && <p className="text-slate-400 text-xs">{event.userEmail}</p>}
                          {!event.userName && !event.userEmail && <span className="text-slate-500">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {event.value ? (
                          <span className="text-emerald-400 font-medium">
                            R$ {Number(event.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {event.apiSent ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(event.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {eventsData && eventsData.total > pageSize && (
            <div className="p-4 border-t border-slate-700 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Mostrando {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, eventsData.total)} de {eventsData.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={(currentPage + 1) * pageSize >= eventsData.total}
                  className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
