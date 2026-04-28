import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { FileDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { getEstablecimientosKarin } from "@/app/actions/ley-karin-actions";

import { DenunciaForm } from "./_components/denuncia-form";

export const metadata: Metadata = {
  title: "Formulario de Denuncia - Ley Karin",
  description: "Formulario seguro y confidencial para el ingreso de denuncias bajo el marco de la Ley Karin (Ley N°21.643).",
};

export default async function LeyKarinDenunciaPage() {
  const result = await getEstablecimientosKarin();
  const establecimientos = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center space-y-4 text-center">
          <Image
            src="/img/logo_naranja.svg"
            alt="Logo DAEM"
            width={340}
            height={60}
            className="mb-8 h-auto max-h-26 w-auto max-w-lg"
            priority
          />
          <div className="space-y-2">
            <h1 className="font-bold text-3xl text-slate-900 tracking-tight md:text-4xl">
              Formulario de Denuncia Ley Karin
            </h1>
            <p className="mx-auto max-w-2xl text-slate-600 leading-relaxed">
              Este canal es estrictamente confidencial. La información proporcionada será tratada 
              bajo la normativa de la Ley N°21.643 para la prevención, investigación y sanción del acoso laboral, 
              sexual o de violencia en el trabajo.
            </p>
          </div>
          <Link
            href="/PROTOCOLO_LEY_KARIN-DECRETO_EXENTO_N_8436.pdf"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-5 py-3 font-semibold text-primary text-sm shadow-sm transition-all hover:bg-primary/10 hover:shadow-md"
          >
            <FileDown className="h-5 w-5" />
            Descargar Protocolo Ley Karin
          </Link>
          <p className="mx-auto max-w-2xl text-slate-500 text-xs leading-relaxed">
            Protocolo Ley Karin del Municipio de La Unión — Contiene los anexos para denuncias, 
            plazos y pasos a seguir en el proceso de denuncia.
          </p>
        </div>

        <Card className="w-full overflow-hidden border-none bg-white shadow-2xl shadow-slate-200/60">
          <CardContent className="p-0">
            <div className="px-6 py-8 md:p-10">
              <DenunciaForm establecimientos={establecimientos} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
