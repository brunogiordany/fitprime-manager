'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, Link2, CheckCircle, Calendar } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo } from 'react';

type PeriodFilter = 'all' | 'week' | 'month' | 'custom';
type StatusFilter = 'all' | 'active' | 'inactive';

export function InviteAnalyticsDashboard() {
  const { data, isLoading, error } = trpc.students.getInviteAnalytics.useQuery();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const filteredAnalytics = useMemo(() => {
    if (!data?.analytics) return [];

    let filtered = [...data.analytics];

    // Filtrar por status
    if (statusFilter === 'active') {
      filtered = filtered.filter(link => link.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(link => !link.isActive);
    }

    // Filtrar por período
    const now = new Date();
    let startDate: Date | null = null;
    let endDate = now;

    if (periodFilter === 'week') {
      startDate = subDays(now, 7);
    } else if (periodFilter === 'month') {
      startDate = subDays(now, 30);
    } else if (periodFilter === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    }

    if (startDate) {
      filtered = filtered.filter(link => {
        const createdDate = new Date(link.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
      });
    }

    return filtered;
  }, [data?.analytics, periodFilter, statusFilter, customStartDate, customEndDate]);

  const filteredSummary = useMemo(() => {
    if (!filteredAnalytics) return { totalLinks: 0, activeLinks: 0, totalStudentsRegistered: 0 };

    return {
      totalLinks: filteredAnalytics.length,
      activeLinks: filteredAnalytics.filter(l => l.isActive).length,
      totalStudentsRegistered: filteredAnalytics.reduce((sum, link) => sum + link.acceptedCount, 0),
    };
  }, [filteredAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">Erro ao carregar analytics de convites</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-500" />
                Total de Links
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLinks}</div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.activeLinks} ativo{summary.activeLinks !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Students Registered */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                Alunos Cadastrados
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStudentsRegistered}</div>
            <p className="text-xs text-slate-500 mt-1">via links de convite</p>
          </CardContent>
        </Card>

        {/* Active Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500" />
                Links Ativos
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeLinks}</div>
            <p className="text-xs text-slate-500 mt-1">prontos para usar</p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Taxa de Conversão
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalStudentsRegistered > 0 ? '100%' : '0%'}
            </div>
            <p className="text-xs text-slate-500 mt-1">alunos que se cadastraram</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Period Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Período</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={periodFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPeriodFilter('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Todos
              </Button>
              <Button
                variant={periodFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPeriodFilter('week');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Últimos 7 dias
              </Button>
              <Button
                variant={periodFilter === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPeriodFilter('month');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Últimos 30 dias
              </Button>
              <Button
                variant={periodFilter === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodFilter('custom')}
              >
                Personalizado
              </Button>
            </div>

            {/* Custom Date Range */}
            {periodFilter === 'custom' && (
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                  placeholder="Data final"
                />
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Ativos
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links Table */}
      {filteredAnalytics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Links</CardTitle>
            <CardDescription>
              {filteredAnalytics.length} link{filteredAnalytics.length !== 1 ? 's' : ''} encontrado{filteredAnalytics.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Criado em</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Válido até</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Último uso</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Cadastros</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnalytics.map((link) => (
                    <tr key={link.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            link.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                          }
                        >
                          {link.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {format(new Date(link.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {format(new Date(link.expiresAt), 'dd MMM yyyy', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {link.lastUsedAt
                          ? format(new Date(link.lastUsedAt), 'dd MMM yyyy', { locale: ptBR })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-900">
                        {link.acceptedCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-orange-600">
                          {link.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">
              {data.analytics.length === 0
                ? 'Nenhum link de convite gerado ainda. Crie um link para começar a rastrear conversões.'
                : 'Nenhum link encontrado com os filtros selecionados.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {data.analytics.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">💡 Insights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            {summary.activeLinks > 0 && (
              <p>
                ✓ Você tem <strong>{summary.activeLinks}</strong> link{summary.activeLinks !== 1 ? 's' : ''} ativo{summary.activeLinks !== 1 ? 's' : ''}.
                Compartilhe-o com seus alunos para que se registrem automaticamente.
              </p>
            )}
            {summary.totalStudentsRegistered > 0 && (
              <p>
                ✓ <strong>{summary.totalStudentsRegistered}</strong> aluno{summary.totalStudentsRegistered !== 1 ? 's' : ''} se cadastrou{summary.totalStudentsRegistered !== 1 ? 'ram' : ''} via seus links.
                Todos os cadastros foram bem-sucedidos!
              </p>
            )}
            {summary.totalLinks === 0 && (
              <p>
                → Crie seu primeiro link de convite geral para começar a rastrear conversões e automatizar o cadastro de alunos.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
