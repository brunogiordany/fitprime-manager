import { DashboardLayout } from "@/components/DashboardLayout";
import { ExtraChargesPanel } from "@/components/ExtraChargesPanel";

export default function ExtraChargesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alunos Excedentes</h1>
          <p className="text-gray-600 mt-2">
            Monitore e gerencie cobranças por alunos acima do limite do seu plano
          </p>
        </div>

        <ExtraChargesPanel />
      </div>
    </DashboardLayout>
  );
}
