/**
 * FitPrime Manager - Componente de Sugestão de Upgrade
 * 
 * Exibe sugestão de upgrade quando o personal está pagando mais por alunos extras
 * do que pagaria em um plano superior
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradeSuggestionProps {
  onUpgrade?: () => void;
}

export default function UpgradeSuggestion({ onUpgrade }: UpgradeSuggestionProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const { data: usageSummary, isLoading: loadingUsage } = trpc.subscription.usageSummary.useQuery();
  const { data: upgradeSuggestion, isLoading: loadingSuggestion } = trpc.subscription.upgradeSuggestion.useQuery();
  
  const updatePlanMutation = trpc.subscription.updatePlan.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsUpgrading(false);
      onUpgrade?.();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsUpgrading(false);
    },
  });

  if (loadingUsage || loadingSuggestion) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!usageSummary) return null;

  const handleUpgrade = async () => {
    if (!upgradeSuggestion?.suggestedPlan) return;
    
    setIsUpgrading(true);
    updatePlanMutation.mutate({
      planId: upgradeSuggestion.suggestedPlan.id,
      country: 'BR',
    });
  };

  // Card de uso atual
  const UsageCard = () => (
    <Card className={`border-l-4 ${
      usageSummary.statusType === 'warning' ? 'border-l-yellow-500' :
      'border-l-emerald-500'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Uso do Plano
          </CardTitle>
          <Badge variant={
            usageSummary.statusType === 'warning' ? 'secondary' :
            'default'
          }>
            {usageSummary.planName}
          </Badge>
        </div>
        <CardDescription>{usageSummary.statusMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {usageSummary.currentStudents} de {usageSummary.studentLimit} alunos
              </span>
              <span className={`font-medium ${
                usageSummary.usagePercentage > 100 ? 'text-red-600' :
                usageSummary.usagePercentage >= 90 ? 'text-yellow-600' :
                'text-emerald-600'
              }`}>
                {usageSummary.usagePercentage}%
              </span>
            </div>
            <Progress 
              value={Math.min(usageSummary.usagePercentage, 100)} 
              className={`h-2 ${
                usageSummary.usagePercentage > 100 ? '[&>div]:bg-red-500' :
                usageSummary.usagePercentage >= 90 ? '[&>div]:bg-yellow-500' :
                '[&>div]:bg-emerald-500'
              }`}
            />
          </div>

          {/* Resumo de custos */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-muted-foreground">Plano</p>
              <p className="text-lg font-bold text-emerald-600">
                R$ {(usageSummary.totalMonthlyCost - usageSummary.extraCost).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Extras ({usageSummary.extraStudents} alunos)
              </p>
              <p className={`text-lg font-bold ${usageSummary.extraCost > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                R$ {usageSummary.extraCost.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">Total mensal</span>
            <span className="text-xl font-bold text-emerald-600">
              R$ {usageSummary.totalMonthlyCost.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Card de sugestão de upgrade
  const UpgradeCard = () => {
    if (!upgradeSuggestion?.shouldUpgrade || !upgradeSuggestion.suggestedPlan) {
      return null;
    }

    return (
      <Card className="border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400">
              Economize fazendo upgrade!
            </CardTitle>
          </div>
          <CardDescription className="text-emerald-600 dark:text-emerald-300">
            {upgradeSuggestion.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Comparativo */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Você paga hoje</p>
                <p className="text-lg font-bold text-red-600 line-through">
                  R$ {upgradeSuggestion.currentCost.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {upgradeSuggestion.currentPlan?.name}
                </p>
              </div>
              
              <ArrowRight className="h-6 w-6 text-emerald-600 shrink-0" />
              
              <div className="flex-1 text-center p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg border-2 border-emerald-500">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Com upgrade</p>
                <p className="text-lg font-bold text-emerald-600">
                  R$ {upgradeSuggestion.newCost.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {upgradeSuggestion.suggestedPlan?.name}
                </p>
              </div>
            </div>

            {/* Economia */}
            <div className="flex items-center justify-center gap-2 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                Economia de R$ {upgradeSuggestion.savings.toFixed(2).replace('.', ',')}/mês
              </span>
            </div>

            {/* Benefícios do novo plano */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Benefícios do plano {upgradeSuggestion.suggestedPlan?.name}:
              </p>
              <ul className="space-y-1">
                {upgradeSuggestion.suggestedPlan?.features.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão de upgrade */}
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processando...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Fazer upgrade para {upgradeSuggestion.suggestedPlan?.name}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <UsageCard />
      <UpgradeCard />
    </div>
  );
}

/**
 * Versão compacta para exibir no header ou sidebar
 */
export function UpgradeBanner() {
  const { data: usageSummary } = trpc.subscription.usageSummary.useQuery();

  if (!usageSummary || usageSummary.statusType === 'success') {
    return null;
  }

  return (
    <div className={`px-4 py-2 text-sm flex items-center justify-between ${
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    }`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>
          {usageSummary.extraStudents > 0 
            ? `${usageSummary.extraStudents} aluno(s) extra(s) - R$ ${usageSummary.extraCost.toFixed(2).replace('.', ',')}/mês`
            : 'Limite de alunos atingido'
          }
        </span>
      </div>
      <Button variant="link" size="sm" className="text-current">
        Ver planos
      </Button>
    </div>
  );
}
