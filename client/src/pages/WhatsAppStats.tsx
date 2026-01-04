import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { BarChart3 } from "lucide-react";
import WhatsAppMetricsDashboard from "@/components/WhatsAppMetricsDashboard";

export default function WhatsAppStats() {
  // WhatsApp messages log (histórico de envios)
  const { data: whatsappMessagesLog } = trpc.messages.log.useQuery({
    limit: 500,
  });

  // Buscar automações para estatísticas
  const { data: automations } = trpc.automations.list.useQuery();

  // Calcular estatísticas de automações
  const automationStats = useMemo(() => {
    if (!automations || !whatsappMessagesLog) return undefined;

    const activeAutomations = automations.filter((a: any) => a.isActive);
    
    // Contar mensagens enviadas (todas do log são via automação ou manual)
    const totalSent = whatsappMessagesLog.length;
    const successfulSent = whatsappMessagesLog.filter((m: any) => 
      m.log.status === 'sent' || m.log.status === 'delivered' || m.log.status === 'read'
    ).length;
    
    // Alunos únicos alcançados
    const uniqueStudents = new Set(whatsappMessagesLog.map((m: any) => m.student?.id).filter(Boolean));
    
    // Estatísticas por tipo de automação
    const triggerLabels: Record<string, string> = {
      session_reminder: 'Lembrete de Sessão',
      session_confirmation: 'Confirmação de Sessão',
      payment_reminder: 'Lembrete de Pagamento',
      payment_overdue: 'Pagamento Atrasado',
      birthday: 'Aniversário',
      inactive_student: 'Aluno Inativo',
      welcome: 'Boas-vindas',
      custom: 'Personalizada',
    };

    const byType = activeAutomations.map((automation: any) => ({
      name: triggerLabels[automation.trigger] || automation.trigger,
      sent: 0, // Seria necessário rastrear por automação no backend
      successRate: 100,
    }));

    return {
      totalAutomations: activeAutomations.length,
      totalSent,
      successRate: totalSent > 0 ? Math.round((successfulSent / totalSent) * 100) : 0,
      studentsReached: uniqueStudents.size,
      byType: byType.length > 0 ? byType : undefined,
    };
  }, [automations, whatsappMessagesLog]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">WhatsApp Estatísticas</h1>
              <p className="text-sm text-muted-foreground">
                Métricas e análises de mensagens WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard de Métricas */}
        <div className="flex-1 overflow-auto p-4">
          <WhatsAppMetricsDashboard 
            messages={whatsappMessagesLog || []} 
            chatMessages={[]}
            automationStats={automationStats}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
