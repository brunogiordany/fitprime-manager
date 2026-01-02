import { AlertCircle, TrendingUp, DollarSign, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export function ExtraChargesPanel() {
  const { data: report, isLoading } = trpc.extraCharges.getReport.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alunos Excedentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  const hasExtraStudents = report.extraStudents > 0;

  return (
    <div className="space-y-4">
      {/* Card Principal */}
      <Card className={hasExtraStudents ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Alunos Excedentes
              </CardTitle>
              <CardDescription>
                Plano: {report.planName} ({report.studentLimit} alunos inclusos)
              </CardDescription>
            </div>
            {hasExtraStudents && (
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {report.extraStudents} extras
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Resumo em Cards Pequenos */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Alunos Ativos</div>
              <div className="text-2xl font-bold">{report.currentStudents}</div>
              <div className="text-xs text-gray-500">de {report.studentLimit}</div>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Excedentes</div>
              <div className={`text-2xl font-bold ${hasExtraStudents ? "text-red-600" : "text-green-600"}`}>
                {report.extraStudents}
              </div>
              <div className="text-xs text-gray-500">alunos</div>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Preço/Extra</div>
              <div className="text-2xl font-bold text-blue-600">
                R$ {report.extraStudentPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">/aluno</div>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Acumulado</div>
              <div className={`text-2xl font-bold ${report.accumulatedCharge > 0 ? "text-orange-600" : "text-green-600"}`}>
                R$ {report.accumulatedCharge.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">próx. fatura</div>
            </div>
          </div>

          {/* Alerta se houver excedentes */}
          {hasExtraStudents && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 ml-2">
                <strong>Atenção:</strong> Você tem {report.extraStudents} aluno(s) acima do limite do seu plano.
                Será cobrado <strong>R$ {report.totalExtraCharge.toFixed(2)}</strong> na próxima renovação.
              </AlertDescription>
            </Alert>
          )}

          {/* Recomendação de Upgrade */}
          {report.shouldRecommendUpgrade && report.upgradeSuggestion && (
            <Alert className="border-blue-300 bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 ml-2">
                <strong>💡 Sugestão de Upgrade:</strong> Fazendo upgrade para o plano{" "}
                <strong>{report.upgradeSuggestion.nextPlanName}</strong>, você economizaria{" "}
                <strong>R$ {report.upgradeSuggestion.savings.toFixed(2)}/mês</strong> (
                {report.upgradeSuggestion.savingsPercentage}% de economia).
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo Formatado */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {report.summary}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            {report.shouldRecommendUpgrade && report.upgradeSuggestion && (
              <Button className="flex-1" variant="default">
                <TrendingUp className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              Ver Histórico
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como Funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            • Seu plano <strong>{report.planName}</strong> inclui até <strong>{report.studentLimit} alunos</strong>
          </p>
          <p>
            • Alunos acima deste limite custam <strong>R$ {report.extraStudentPrice.toFixed(2)} cada</strong>
          </p>
          <p>
            • As cobranças extras são <strong>acumuladas</strong> e cobradas na próxima renovação
          </p>
          <p>
            • Você pode fazer upgrade a qualquer momento para incluir mais alunos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
