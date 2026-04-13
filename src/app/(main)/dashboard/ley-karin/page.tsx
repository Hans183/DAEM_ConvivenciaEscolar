import { Metadata } from "next";
import { LeyKarinTable } from "./_components/ley-karin-table";

export const metadata: Metadata = {
  title: "Denuncias Ley Karin",
  description: "Gestión y revisión de denuncias bajo la Ley Karin",
};

export default function LeyKarinDashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Denuncias Ley Karin</h2>
      </div>
      
      <div className="space-y-4">
        {/* Aquí irán las tarjetas de métricas más adelante si es necesario */}
        <LeyKarinTable />
      </div>
    </div>
  );
}
