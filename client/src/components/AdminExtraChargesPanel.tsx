import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Users, Download, Filter } from "lucide-react";

export function AdminExtraChargesPanel() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Queries
  const { data: charges, isLoading: chargesLoading } = trpc.admin.extraCharges.listCharges.useQuery({
    limit,
    offset,
    startDate,
    endDate,
  });

  const { data: stats, isLoading: statsLoading } = trpc.admin.extraCharges.getStats.useQuery({
    startDate,
    endDate,
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Chamar a query manualmente
      const response = await fetch("/api/trpc/admin.extraCharges.exportReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      const data = await response.json();
      if (data.result?.data) {
        const blob = new Blob([data.result.data.csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", data.result.data.filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (statsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => { setStartDate(undefined); setEndDate(undefined); }} variant="outline" className="flex-1">
                Limpar
              </Button>
              <Button onClick={handleExport} className="flex-1" disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exportando..." : "Exportar CSV"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Cobranças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCharges}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.uniquePersonals} personals únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Total Cobrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">R$ {stats.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Período selecionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Média por Cobrança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">R$ {stats.averageCharge.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Por transação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Personals com Extras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.uniquePersonals}</div>
              <p className="text-xs text-gray-500 mt-1">Únicos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cobranças por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Cobranças por Mês</CardTitle>
              <CardDescription>Valor total cobrado em cada mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.chargesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#10b981"
                    name="Valor Total"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="chargesCount"
                    stroke="#3b82f6"
                    name="Quantidade"
                    strokeWidth={2}
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 10 Personals */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Personals</CardTitle>
              <CardDescription>Maiores valores cobrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topPersonals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="personalName" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  <Bar dataKey="totalAmount" fill="#10b981" name="Total Cobrado" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
          <CardDescription>Todas as cobranças extras processadas</CardDescription>
        </CardHeader>
        <CardContent>
          {chargesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : charges && charges.charges.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Personal</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Alunos Extras</TableHead>
                    <TableHead className="text-right">Valor Cobrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges?.charges?.map((charge: any) => (
                    <TableRow key={charge.id}>
                      <TableCell className="text-sm">
                        {new Date(charge.createdAt).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{charge.personalName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{charge.planName}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{charge.extraStudents}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {charge.chargeAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {offset + 1} a {Math.min(offset + limit, charges?.total || 0)} de {charges?.total || 0}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= charges.total}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma cobrança encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
