import { DashboardContent } from "./_components/dashboard-content";

export const metadata = {
  title: "Panel de Control — Convivencia Escolar",
  description: "KPIs y métricas de activaciones de protocolos y registros DEC.",
};

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-2 py-2">
      <DashboardContent />
    </div>
  );
}
