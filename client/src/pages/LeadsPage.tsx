import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  GitMerge,
  AlertTriangle,
  Send,
  MailX,
  MailCheck,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: number;
  visitorId: string;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
  leadCity: string | null;
  studentsCount: string | null;
  revenue: string | null;
  priority: string | null;
  managementPain: number | null;
  timePain: number | null;
  retentionPain: number | null;
  billingPain: number | null;
  recommendedProfile: string | null;
  recommendedPlan: string | null;
  totalScore: number | null;
  isQualified: boolean;
  disqualificationReason: string | null;
  converted: boolean;
  conversionType: string | null;
  convertedAt: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  landingPage: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  createdAt: string;
  completedAt: string | null;
  // Campos de personal vinculado
  personalId: number | null;
  personalStatus: string | null;
  personalName: string | null;
  // Campos de merge
  mergedIntoId: number | null;
  mergedAt: string | null;
  // Campos de status de email
  emailStatus: string | null;
  emailSentAt: string | null;
  emailSendId: number | null;
}

const studentsLabels: Record<string, string> = {
  "1-5": "1-5 alunos",
  "6-15": "6-15 alunos",
  "16-30": "16-30 alunos",
  "31-50": "31-50 alunos",
  "51-100": "51-100 alunos",
  "100+": "100+ alunos",
  "5": "1-5 alunos",
  "15": "6-15 alunos",
  "30": "16-30 alunos",
  "50": "31-50 alunos",
  "100": "51-100 alunos",
};

const revenueLabels: Record<string, string> = {
  "no_income": "Sem renda",
  "2k": "Até R$ 2k",
  "5k": "R$ 2k-5k",
  "10k": "R$ 5k-10k",
  "10k+": "Mais de R$ 10k",
  "15k+": "Mais de R$ 15k",
  "2000": "Até R$ 2k",
  "5000": "R$ 2k-5k",
  "10000": "R$ 5k-10k",
  "15000": "Mais de R$ 10k",
};

const priorityLabels: Record<string, string> = {
  "management": "Gestão",
  "time": "Tempo",
  "retention": "Retenção",
  "billing": "Cobranças",
};

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isQualified, setIsQualified] = useState<"all" | "qualified" | "disqualified">("all");
  const [converted, setConverted] = useState<"all" | "converted" | "not_converted">("all");
  const [utmSource, setUtmSource] = useState<string>("");
  const [utmCampaign, setUtmCampaign] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = useState<{ identifier: string; type: "email" | "phone" } | null>(null);

  // Buscar leads
  const { data: leadsData, isLoading, refetch } = trpc.quiz.listLeads.useQuery({
    page,
    limit: 25,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    isQualified,
    converted,
    utmSource: utmSource || undefined,
    utmCampaign: utmCampaign || undefined,
  });

  // Buscar opções de filtro
  const { data: filterOptions } = trpc.quiz.getFilterOptions.useQuery();

  // Buscar estatísticas do funil
  const { data: funnelStats } = trpc.quiz.getFunnelStats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Buscar leads duplicados
  const { data: duplicatesData, refetch: refetchDuplicates } = trpc.quiz.getDuplicateLeads.useQuery(
    undefined,
    { enabled: showDuplicates }
  );

  // Buscar detalhes de um grupo de duplicados
  const { data: duplicateDetails } = trpc.quiz.getDuplicateDetails.useQuery(
    { identifier: selectedDuplicate?.identifier || "", type: selectedDuplicate?.type || "email" },
    { enabled: !!selectedDuplicate }
  );

  // Mutation para mesclar leads
  const mergeMutation = trpc.quiz.mergeLeads.useMutation({
    onSuccess: () => {
      refetch();
      refetchDuplicates();
      setSelectedDuplicate(null);
    },
  });

  // Mutation para mesclar todos automaticamente
  const autoMergeMutation = trpc.quiz.autoMergeAllDuplicates.useMutation({
    onSuccess: (data) => {
      refetch();
      refetchDuplicates();
      alert(`${data.totalMerged} lead(s) mesclado(s) em ${data.groupsMerged} grupo(s)`);
    },
  });

  // Mutation para reenviar email
  const resendEmailMutation = trpc.quiz.resendEmail.useMutation({
    onSuccess: (data) => {
      refetch();
      alert(data.message);
    },
    onError: (error) => {
      alert(`Erro ao reenviar email: ${error.message}`);
    },
  });

  // Mutation para reenviar todos os emails que falharam
  const resendFailedMutation = trpc.quiz.resendFailedEmails.useMutation({
    onSuccess: (data) => {
      refetch();
      alert(data.message);
    },
    onError: (error) => {
      alert(`Erro ao reenviar emails: ${error.message}`);
    },
  });

  // Exportar leads
  const { data: exportData, refetch: exportLeads } = trpc.quiz.exportLeads.useQuery(
    {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isQualified,
      converted,
      utmSource: utmSource || undefined,
    },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await exportLeads();
    if (result.data) {
      const leads = result.data as any[];
      const headers = [
        "ID", "Nome", "Email", "Telefone", "Cidade",
        "Alunos", "Faturamento", "Prioridade",
        "Qualificado", "Convertido",
        "UTM Source", "UTM Medium", "UTM Campaign",
        "Landing Page", "Dispositivo", "Data"
      ];
      
      const rows = leads.map((lead: any) => [
        lead.id,
        lead.leadName || "",
        lead.leadEmail || "",
        lead.leadPhone || "",
        lead.leadCity || "",
        studentsLabels[lead.studentsCount || ""] || lead.studentsCount || "",
        revenueLabels[lead.revenue || ""] || lead.revenue || "",
        priorityLabels[lead.priority || ""] || lead.priority || "",
        lead.isQualified ? "Sim" : "Não",
        lead.converted ? "Sim" : "Não",
        lead.utmSource || "",
        lead.utmMedium || "",
        lead.utmCampaign || "",
        lead.landingPage || "",
        lead.deviceType || "",
        lead.createdAt ? format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm") : "",
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setIsQualified("all");
    setConverted("all");
    setUtmSource("");
    setUtmCampaign("");
    setPage(1);
  };

  const leads = (leadsData?.leads || []) as Lead[];
  const totalPages = leadsData?.totalPages || 1;
  const total = leadsData?.total || 0;

  return (
    <AdminLayout
      title="Gestão de Leads"
      description="Visualize e gerencie todos os leads capturados pelo quiz"
      activeTab="leads"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-emerald-500" />
              Gestão de Leads
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visualize e gerencie todos os leads capturados pelo quiz
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showDuplicates ? "default" : "outline"}
              onClick={() => setShowDuplicates(!showDuplicates)}
              className={showDuplicates ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              <GitMerge className="w-4 h-4 mr-2" />
              {showDuplicates ? "Ocultar Duplicados" : "Ver Duplicados"}
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total de Leads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {funnelStats?.funnel?.total || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Qualificados</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {funnelStats?.funnel?.qualified || 0}
                  </p>
                  <p className="text-xs text-gray-400">
                    {funnelStats?.conversionRates?.qualificationRate || 0}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Convertidos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {funnelStats?.funnel?.converted || 0}
                  </p>
                  <p className="text-xs text-gray-400">
                    {funnelStats?.conversionRates?.conversionRate || 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Desqualificados</p>
                  <p className="text-2xl font-bold text-red-600">
                    {funnelStats?.funnel?.disqualified || 0}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Leads Duplicados */}
        {showDuplicates && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Leads Duplicados
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchDuplicates()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  {(duplicatesData as any)?.duplicates?.length > 0 && (
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => autoMergeMutation.mutate()}
                      disabled={autoMergeMutation.isPending}
                    >
                      <GitMerge className="w-4 h-4 mr-2" />
                      {autoMergeMutation.isPending ? "Mesclando..." : "Mesclar Todos"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!(duplicatesData as any)?.duplicates?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-medium">Nenhum lead duplicado encontrado!</p>
                  <p className="text-sm">Todos os leads estão únicos no sistema.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Encontrados {(duplicatesData as any)?.duplicates?.length || 0} grupos de leads duplicados.
                    Clique em um grupo para ver detalhes e mesclar.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {((duplicatesData as any)?.duplicates || []).map((dup: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer hover:border-amber-400 transition-colors"
                        onClick={() => setSelectedDuplicate({ identifier: dup.identifier, type: dup.type })}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={dup.type === "email" ? "default" : "secondary"}>
                            {dup.type === "email" ? <Mail className="w-3 h-3 mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
                            {dup.type === "email" ? "Email" : "Telefone"}
                          </Badge>
                          <span className="text-sm font-medium text-amber-600">{dup.count}x</span>
                        </div>
                        <p className="text-sm font-medium truncate">{dup.identifier}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Primeiro: {dup.firstDate ? format(new Date(dup.firstDate), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Detalhes de Duplicados */}
        <Dialog open={!!selectedDuplicate} onOpenChange={() => setSelectedDuplicate(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-amber-600" />
                Mesclar Leads Duplicados
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Os seguintes leads serão mesclados. O lead mais antigo será mantido como principal
                e os dados dos outros serão incorporados.
              </p>
              
              {(duplicateDetails as any)?.leads?.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((duplicateDetails as any)?.leads || []).map((lead: any, idx: number) => (
                        <TableRow key={lead.id} className={idx === 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}>
                          <TableCell>
                            {lead.id}
                            {idx === 0 && <Badge className="ml-2 bg-emerald-600">Principal</Badge>}
                          </TableCell>
                          <TableCell>{lead.leadName || "-"}</TableCell>
                          <TableCell>{lead.leadEmail || "-"}</TableCell>
                          <TableCell>{lead.leadPhone || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {lead.isQualified ? (
                              <Badge className="bg-emerald-600">Qualificado</Badge>
                            ) : (
                              <Badge variant="destructive">Desqualificado</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedDuplicate(null)}>
                      Cancelar
                    </Button>
                    <Button
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => {
                        const leads = ((duplicateDetails as any)?.leads || []);
                        if (leads.length > 1) {
                          const primaryId = leads[0].id;
                          const secondaryIds = leads.slice(1).map((l: any) => l.id);
                          mergeMutation.mutate({ primaryId, secondaryIds });
                        }
                      }}
                      disabled={mergeMutation.isPending}
                    >
                      <GitMerge className="w-4 h-4 mr-2" />
                      {mergeMutation.isPending ? "Mesclando..." : "Confirmar Mesclagem"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Ocultar" : "Mostrar"} filtros avançados
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Busca e filtros básicos */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome, email ou telefone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
              </div>

              {/* Filtros avançados */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-gray-500">Qualificação</Label>
                    <Select value={isQualified} onValueChange={(v: any) => setIsQualified(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="qualified">Qualificados</SelectItem>
                        <SelectItem value="disqualified">Desqualificados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">Conversão</Label>
                    <Select value={converted} onValueChange={(v: any) => setConverted(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="converted">Convertidos</SelectItem>
                        <SelectItem value="not_converted">Não Convertidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">UTM Source</Label>
                    <Select value={utmSource} onValueChange={setUtmSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {filterOptions?.sources?.map((source: string) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">UTM Campaign</Label>
                    <Select value={utmCampaign} onValueChange={setUtmCampaign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {filterOptions?.campaigns?.map((campaign: string) => (
                          <SelectItem key={campaign} value={campaign}>
                            {campaign}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Botão limpar filtros */}
              {(search || startDate || endDate || isQualified !== "all" || converted !== "all" || utmSource || utmCampaign) && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Leads */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Carregando leads...</p>
                      </TableCell>
                    </TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-gray-300" />
                        <p className="text-gray-500 mt-2">Nenhum lead encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {lead.leadName || "Anônimo"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {lead.leadCity && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {lead.leadCity}
                                </span>
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lead.leadEmail && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.leadEmail}
                              </p>
                            )}
                            {lead.leadPhone && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.leadPhone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {studentsLabels[lead.studentsCount || ""] || lead.studentsCount || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {revenueLabels[lead.revenue || ""] || lead.revenue || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={lead.isQualified ? "default" : "secondary"}
                              className={lead.isQualified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}
                            >
                              {lead.isQualified ? "Qualificado" : "Desqualificado"}
                            </Badge>
                            {lead.personalId && (
                              <Badge className="bg-blue-100 text-blue-700">
                                ✓ Cadastrado
                              </Badge>
                            )}
                            {lead.converted && !lead.personalId && (
                              <Badge className="bg-purple-100 text-purple-700">
                                Convertido
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {lead.emailStatus === 'sent' ? (
                              <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                                <MailCheck className="w-3 h-3" />
                                Enviado
                              </Badge>
                            ) : lead.emailStatus === 'failed' || lead.emailStatus === 'bounced' ? (
                              <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                                <MailX className="w-3 h-3" />
                                Falhou
                              </Badge>
                            ) : lead.emailStatus === 'pending' ? (
                              <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pendente
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Não enviado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lead.utmSource && (
                              <Badge variant="outline" className="text-xs">
                                {lead.utmSource}
                              </Badge>
                            )}
                            {lead.deviceType && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" />
                                {lead.deviceType}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {lead.createdAt
                              ? format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {lead.leadEmail && lead.emailStatus !== 'sent' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resendEmailMutation.mutate({ leadId: lead.id })}
                                disabled={resendEmailMutation.isPending}
                                title="Reenviar email"
                              >
                                <Send className="w-4 h-4 text-blue-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Mostrando {leads.length} de {total} leads
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Lead */}
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Detalhes do Lead
              </DialogTitle>
            </DialogHeader>
            
            {selectedLead && (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Nome</Label>
                    <p className="font-medium">{selectedLead.leadName || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="font-medium">{selectedLead.leadEmail || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Telefone</Label>
                    <p className="font-medium">{selectedLead.leadPhone || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Cidade</Label>
                    <p className="font-medium">{selectedLead.leadCity || "Não informado"}</p>
                  </div>
                </div>

                {/* Perfil do Lead */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Perfil do Lead</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Quantidade de Alunos</Label>
                      <p className="font-medium">
                        {studentsLabels[selectedLead.studentsCount || ""] || selectedLead.studentsCount || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Faturamento</Label>
                      <p className="font-medium">
                        {revenueLabels[selectedLead.revenue || ""] || selectedLead.revenue || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Maior Dor</Label>
                      <p className="font-medium">
                        {priorityLabels[selectedLead.priority || ""] || selectedLead.priority || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Plano Recomendado</Label>
                      <p className="font-medium">{selectedLead.recommendedPlan || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Pontuação de Dores */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Pontuação de Dores</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedLead.managementPain || 0}</p>
                      <p className="text-xs text-gray-500">Gestão</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{selectedLead.timePain || 0}</p>
                      <p className="text-xs text-gray-500">Tempo</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{selectedLead.retentionPain || 0}</p>
                      <p className="text-xs text-gray-500">Retenção</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{selectedLead.billingPain || 0}</p>
                      <p className="text-xs text-gray-500">Cobranças</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Status</h4>
                  <div className="flex gap-2">
                    <Badge
                      className={selectedLead.isQualified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}
                    >
                      {selectedLead.isQualified ? "Qualificado" : "Desqualificado"}
                    </Badge>
                    {selectedLead.converted && (
                      <Badge className="bg-purple-100 text-purple-700">
                        Convertido
                      </Badge>
                    )}
                  </div>
                  {selectedLead.disqualificationReason && (
                    <p className="text-sm text-gray-500 mt-2">
                      Motivo: {selectedLead.disqualificationReason}
                    </p>
                  )}
                </div>

                {/* Origem/UTM */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Origem do Lead</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">UTM Source</Label>
                      <p className="font-medium">{selectedLead.utmSource || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">UTM Medium</Label>
                      <p className="font-medium">{selectedLead.utmMedium || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">UTM Campaign</Label>
                      <p className="font-medium">{selectedLead.utmCampaign || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Landing Page</Label>
                      <p className="font-medium text-xs break-all">{selectedLead.landingPage || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Dispositivo */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Dispositivo</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Tipo</Label>
                      <p className="font-medium">{selectedLead.deviceType || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Navegador</Label>
                      <p className="font-medium">{selectedLead.browser || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Sistema</Label>
                      <p className="font-medium">{selectedLead.os || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Data de Criação</Label>
                      <p className="font-medium">
                        {selectedLead.createdAt
                          ? format(new Date(selectedLead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : "-"}
                      </p>
                    </div>
                    {selectedLead.convertedAt && (
                      <div>
                        <Label className="text-xs text-gray-500">Data de Conversão</Label>
                        <p className="font-medium">
                          {format(new Date(selectedLead.convertedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
