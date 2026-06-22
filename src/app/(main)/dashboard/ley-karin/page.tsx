import { Metadata } from "next";

import { getEstablecimientosKarin } from "@/app/actions/ley-karin-actions";

import { LeyKarinContent } from "./_components/ley-karin-content";

export const metadata: Metadata = {
  title: "Denuncias Ley Karin",
  description: "Gestión y revisión de denuncias bajo la Ley Karin",
};

export default async function LeyKarinDashboardPage() {
  const result = await getEstablecimientosKarin();
  const establecimientos = result.success && result.data ? result.data : [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <LeyKarinContent establecimientos={establecimientos} />
    </div>
  );
}
