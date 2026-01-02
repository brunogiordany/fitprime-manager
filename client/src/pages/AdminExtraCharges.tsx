import DashboardLayout from "@/components/DashboardLayout";
import { AdminExtraChargesPanel } from "@/components/AdminExtraChargesPanel";

export default function AdminExtraChargesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobranças Extras - Admin</h1>
          <p className="text-gray-600 mt-2">
            Visualize e gerencie todas as cobranças extras de alunos excedentes
          </p>
        </div>

        <AdminExtraChargesPanel />
      </div>
    </DashboardLayout>
  );
}
