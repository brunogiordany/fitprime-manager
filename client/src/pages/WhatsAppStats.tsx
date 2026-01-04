import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { BarChart3 } from "lucide-react";
import WhatsAppMetricsDashboard from "@/components/WhatsAppMetricsDashboard";

export default function WhatsAppStats() {
  // WhatsApp messages log (histórico de envios)
  const { data: whatsappMessagesLog } = trpc.messages.log.useQuery({
    limit: 100,
  });

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
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
