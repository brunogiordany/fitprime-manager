'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Link2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InviteAnalyticsDashboard() {
  const { data, isLoading, error } = trpc.students.getInviteAnalytics.useQuery();

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

  const { analytics, summary } = data;

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

      {/* Links Table */}
      {analytics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Links</CardTitle>
            <CardDescription>
              Detalhes de cada link de convite gerado
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
                  {analytics.map((link) => (
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
              Nenhum link de convite gerado ainda. Crie um link para começar a rastrear conversões.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {analytics.length > 0 && (
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
            {summary.totalLinks > 1 && (
              <p>
                ℹ️ Você pode ter múltiplos links ativos simultaneamente. Cada link pode ser usado por quantos alunos quiser.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
