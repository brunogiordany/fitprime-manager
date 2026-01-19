import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  Activity,
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  Send,
  Users,
  Tag,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos de atividade com labels e ícones
const activityTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  whatsapp_sent: { label: "WhatsApp Enviado", icon: MessageSquare, color: "bg-green-100 text-green-800" },
  whatsapp_received: { label: "WhatsApp Recebido", icon: MessageSquare, color: "bg-blue-100 text-blue-800" },
  whatsapp_failed: { label: "WhatsApp Falhou", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  whatsapp_bulk_sent: { label: "Envio em Massa", icon: Users, color: "bg-purple-100 text-purple-800" },
  email_sent: { label: "Email Enviado", icon: Mail, color: "bg-green-100 text-green-800" },
  email_failed: { label: "Email Falhou", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  email_opened: { label: "Email Aberto", icon: Eye, color: "bg-blue-100 text-blue-800" },
  email_clicked: { label: "Link Clicado", icon: TrendingUp, color: "bg-indigo-100 text-indigo-800" },
  lead_created: { label: "Lead Criado", icon: User, color: "bg-emerald-100 text-emerald-800" },
  lead_updated: { label: "Lead Atualizado", icon: User, color: "bg-yellow-100 text-yellow-800" },
  lead_converted: { label: "Lead Convertido", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  lead_tag_added: { label: "Tag Adicionada", icon: Tag, color: "bg-blue-100 text-blue-800" },
  lead_tag_removed: { label: "Tag Removida", icon: Tag, color: "bg-gray-100 text-gray-800" },
  funnel_stage_changed: { label: "Estágio Alterado", icon: TrendingUp, color: "bg-orange-100 text-orange-800" },
  automation_triggered: { label: "Automação Disparada", icon: Activity, color: "bg-purple-100 text-purple-800" },
  user_login: { label: "Login", icon: User, color: "bg-gray-100 text-gray-800" },
  user_action: { label: "Ação do Usuário", icon: Activity, color: "bg-gray-100 text-gray-800" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  success: { label: "Sucesso", color: "bg-green-100 text-green-800" },
  failed: { label: "Falhou", color: "bg-red-100 text-red-800" },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
};

export default function AdminActivityLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Query para listar logs
  const { data: logsData, isLoading, refetch } = trpc.activityLogs.list.useQuery({
    page,
    limit: 50,
    search: search || undefined,
    activityType: activityType !== "all" ? activityType as any : undefined,
    status: status !== "all" ? status as any : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Query para estatísticas
  const { data: statsData } = trpc.activityLogs.getStats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Query para exportar
  const { refetch: exportLogs } = trpc.activityLogs.export.useQuery(
    {
      activityType: activityType !== "all" ? activityType as any : undefined,
      status: status !== "all" ? status as any : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await exportLogs();
    if (result.data) {
      const { headers, rows } = result.data;
      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activity_logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActivityType("all");
    setStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const logs = logsData?.logs || [];
  const totalPages = logsData?.totalPages || 1;
  const total = logsData?.total || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              Log de Atividades
            </h1>
            <p className="text-gray-500 mt-1">
              Rastreie todas as ações de envio de mensagens e emails
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold">{statsData?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">WhatsApp Enviados</p>
                  <p className="text-xl font-bold">{statsData?.whatsapp?.sent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">WhatsApp Falhas</p>
                  <p className="text-xl font-bold">{statsData?.whatsapp?.failed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Emails Enviados</p>
                  <p className="text-xl font-bold">{statsData?.email?.sent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-gray-500">Emails Abertos</p>
                  <p className="text-xl font-bold">{statsData?.email?.opened || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">Envios em Massa</p>
                  <p className="text-xl font-bold">{statsData?.whatsapp?.bulk || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, telefone, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="whatsapp_sent">WhatsApp Enviado</SelectItem>
                  <SelectItem value="whatsapp_failed">WhatsApp Falhou</SelectItem>
                  <SelectItem value="whatsapp_bulk_sent">Envio em Massa</SelectItem>
                  <SelectItem value="email_sent">Email Enviado</SelectItem>
                  <SelectItem value="email_failed">Email Falhou</SelectItem>
                  <SelectItem value="email_opened">Email Aberto</SelectItem>
                  <SelectItem value="lead_created">Lead Criado</SelectItem>
                  <SelectItem value="lead_converted">Lead Convertido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>

              {(search || activityType !== "all" || status !== "all" || startDate || endDate) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="flex gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-xs text-gray-500">Data Início</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Data Fim</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Atividades ({total} registros)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Carregando...</p>
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Activity className="w-12 h-12 mx-auto text-gray-300" />
                        <p className="text-gray-500 mt-2">Nenhuma atividade encontrada</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log: any) => {
                      const typeConfig = activityTypeConfig[log.activityType] || {
                        label: log.activityType,
                        icon: Activity,
                        color: "bg-gray-100 text-gray-800",
                      };
                      const TypeIcon = typeConfig.icon;
                      const statusCfg = statusConfig[log.status] || statusConfig.success;

                      return (
                        <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">
                                  {log.createdAt ? format(new Date(log.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {log.createdAt ? format(new Date(log.createdAt), "HH:mm:ss") : "-"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${typeConfig.color} flex items-center gap-1 w-fit`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium max-w-[200px] truncate" title={log.title}>
                              {log.title}
                            </p>
                            {log.description && (
                              <p className="text-xs text-gray-500 max-w-[200px] truncate" title={log.description}>
                                {log.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.leadName ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{log.leadName}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {log.leadPhone && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {log.leadPhone}
                                </div>
                              )}
                              {log.leadEmail && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  {log.leadEmail}
                                </div>
                              )}
                              {!log.leadPhone && !log.leadEmail && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusCfg.color}>
                              {statusCfg.label}
                            </Badge>
                            {log.errorMessage && (
                              <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={log.errorMessage}>
                                {log.errorMessage}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Detalhes da Atividade
              </DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Tipo</label>
                    <p className="font-medium">
                      {activityTypeConfig[selectedLog.activityType]?.label || selectedLog.activityType}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <Badge className={statusConfig[selectedLog.status]?.color || "bg-gray-100"}>
                      {statusConfig[selectedLog.status]?.label || selectedLog.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Data/Hora</label>
                    <p className="font-medium">
                      {selectedLog.createdAt
                        ? format(new Date(selectedLog.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">ID Externo</label>
                    <p className="font-medium text-sm">{selectedLog.externalId || "-"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Título</label>
                  <p className="font-medium">{selectedLog.title}</p>
                </div>

                {selectedLog.description && (
                  <div>
                    <label className="text-xs text-gray-500">Descrição</label>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {selectedLog.description}
                    </p>
                  </div>
                )}

                {(selectedLog.leadName || selectedLog.leadPhone || selectedLog.leadEmail) && (
                  <div className="border-t pt-4">
                    <label className="text-xs text-gray-500 block mb-2">Lead</label>
                    <div className="flex items-center gap-4">
                      {selectedLog.leadName && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{selectedLog.leadName}</span>
                        </div>
                      )}
                      {selectedLog.leadPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedLog.leadPhone}</span>
                        </div>
                      )}
                      {selectedLog.leadEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{selectedLog.leadEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div className="border-t pt-4">
                    <label className="text-xs text-red-500 block mb-2">Erro</label>
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {selectedLog.errorMessage}
                    </p>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div className="border-t pt-4">
                    <label className="text-xs text-gray-500 block mb-2">Metadados</label>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-auto max-h-[200px]">
                      {JSON.stringify(
                        typeof selectedLog.metadata === "string"
                          ? JSON.parse(selectedLog.metadata)
                          : selectedLog.metadata,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
