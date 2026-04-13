/** biome-ignore-all lint/suspicious/noExplicitAny: <Se llenará con el RecordModel completo de PocketBase> */
"use client";

import { useState, useTransition } from "react";

import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Info,
  Link,
  Loader2,
  type LucideIcon,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Shield,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { updateEstadoDenunciaKarin } from "@/app/actions/ley-karin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface LeyKarinDialogProps {
  denuncia: any; // Se llenará con el RecordModel completo de PocketBase
  onUpdated: () => void;
}

export function LeyKarinDialog({ denuncia, onUpdated }: LeyKarinDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleEstadoChange = (nuevoEstado: string) => {
    startTransition(async () => {
      const res = await updateEstadoDenunciaKarin(denuncia.id, nuevoEstado);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Estado actualizado correctamente");
        onUpdated(); // Refresh table data
      }
    });
  };

  const pbUrl = "https://apiconvivencia.daemlu.cl"; // o process.env.NEXT_PUBLIC_PB_URL

  const renderFiles = () => {
    let files: string[] = [];
    if (denuncia.evidencia) {
      if (Array.isArray(denuncia.evidencia)) {
        files = denuncia.evidencia;
      } else if (typeof denuncia.evidencia === "string") {
        files = [denuncia.evidencia];
      }
    }

    if (files.length === 0) {
      return (
        <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-4 text-muted-foreground">
          <Info className="h-4 w-4" />
          <p className="text-sm">No se adjuntaron archivos o evidencia.</p>
        </div>
      );
    }
    return (
      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
        {files.map((fileName: string) => (
          <a
            key={fileName}
            href={`${pbUrl}/api/files/denuncias_ley_karin/${denuncia.id}/${fileName}?download=1`}
            target="_blank"
            rel="noreferrer"
            download={fileName}
            className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-accent"
          >
            <div className="rounded-md bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
              <Paperclip className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 truncate font-medium text-sm">{fileName}</span>
            <Download className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="transition-colors hover:bg-primary/10 hover:text-primary"
          title="Ver Detalle"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-w-[1400px]">
        <DialogHeader className="relative border-b bg-slate-50 p-8 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-6 pe-12 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="font-extrabold text-3xl tracking-tight">Detalle de Denuncia</DialogTitle>
                  <DialogDescription className="font-mono text-muted-foreground text-sm">
                    ID: {denuncia.id}
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 rounded-xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center">
              <div className="flex flex-col">
                <span className="mb-1 px-1 font-bold text-[10px] text-muted-foreground uppercase">Estado Actual</span>
                <Select defaultValue={denuncia.estado} onValueChange={handleEstadoChange} disabled={isPending}>
                  <SelectTrigger className="h-11 w-[180px] font-semibold focus:ring-primary/20">
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Actualizando...</span>
                      </div>
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ingresada">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Ingresada
                      </div>
                    </SelectItem>
                    <SelectItem value="En análisis">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        En análisis
                      </div>
                    </SelectItem>
                    <SelectItem value="Cerrada">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Cerrada
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="hidden h-10 sm:block" />

              <div className="flex flex-col">
                <span className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Fecha de Ingreso</span>
                <div className="flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4 text-primary" />
                  {(() => {
                    const dateObj = denuncia.createdAt || denuncia.created;
                    if (!dateObj) return "No disponible";
                    const d = new Date(dateObj);
                    if (Number.isNaN(d.getTime())) return "Fecha desconocida";
                    return d.toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-10 p-8">
            {/* 1. Información General */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Info className="h-5 w-5" />
                <h4 className="text-lg uppercase tracking-wider">1. Información de la Materia</h4>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-transparent bg-muted/30 p-4 transition-all hover:border-border">
                  <span className="mb-2 block font-bold text-muted-foreground text-xs uppercase">Materia</span>
                  <Badge
                    variant="outline"
                    className="self-start whitespace-normal break-all border-primary/30 bg-primary/5 px-3 py-1 text-sm"
                  >
                    {denuncia.materia}
                  </Badge>
                </div>
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-transparent bg-muted/30 p-4 transition-all hover:border-border">
                  <span className="mb-2 block font-bold text-muted-foreground text-xs uppercase">Temporalidad</span>
                  <div className="flex items-center gap-2 break-all font-medium text-sm">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {denuncia.temporalidad || "No especificada"}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-transparent bg-muted/30 p-4 transition-all hover:border-border">
                  <span className="mb-2 block font-bold text-muted-foreground text-xs uppercase">
                    Anonimato Solicitado
                  </span>
                  <Badge
                    variant={denuncia.firmaAnonima ? "destructive" : "secondary"}
                    className="self-start whitespace-normal break-all text-sm"
                  >
                    {denuncia.firmaAnonima ? "SÍ (Solicitado)" : "NO"}
                  </Badge>
                </div>
              </div>
            </section>

            {/* 2. Partes Involucradas */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Users className="h-5 w-5" />
                <h4 className="text-lg uppercase tracking-wider">2. Partes Involucradas</h4>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Carta Denunciante */}
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                  <CardHeader className="border-b bg-slate-50 dark:bg-slate-900">
                    <CardTitle className="flex items-center gap-2 font-bold text-base text-slate-700 dark:text-slate-300">
                      <User className="h-4 w-4" />
                      Persona Denunciante
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    {denuncia.firmaAnonima && (
                      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <p className="font-medium text-amber-800 text-xs leading-relaxed">
                          Esta persona ha solicitado explícitamente el resguardo de su identidad en la plataforma. Se
                          deben seguir los protocolos de confidencialidad correspondientes.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                      <DataPoint icon={User} label="Nombre" value={denuncia.nombresDenunciante} />
                      <DataPoint icon={Shield} label="RUT" value={denuncia.rutDenunciante} />
                      <DataPoint icon={Mail} label="Correo" value={denuncia.correoDenunciante} />
                      <DataPoint icon={Phone} label="Teléfono" value={denuncia.telefonoDenunciante} />
                      <DataPoint
                        icon={MapPin}
                        label="Dirección"
                        value={`${denuncia.direccionDenunciante}, ${denuncia.ciudadComunaDenunciante}`}
                        colSpan={2}
                      />
                      <Separator className="col-span-2 my-2" />
                      <DataPoint icon={Briefcase} label="Cargo/Rol" value={denuncia.cargoDenunciante} />
                      <DataPoint icon={Users} label="Área" value={denuncia.areaDenunciante} />
                      <DataPoint
                        icon={User}
                        label="Jefatura"
                        value={`${denuncia.nombreJefaturaDenunciante} (${denuncia.cargoJefaturaDenunciante})`}
                        colSpan={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Carta Denunciado */}
                <Card className="overflow-hidden border-rose-200 shadow-sm">
                  <CardHeader className="border-rose-100 border-b bg-rose-50/50 dark:bg-rose-950/20">
                    <CardTitle className="flex items-center gap-2 font-bold text-base text-rose-800 dark:text-rose-400">
                      <Shield className="h-4 w-4" />
                      Persona Denunciada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                      <DataPoint
                        icon={User}
                        label="Nombre completo"
                        value={denuncia.nombresDenunciado}
                        colSpan={2}
                        color="rose"
                      />
                      <DataPoint
                        icon={Briefcase}
                        label="Cargo habitual"
                        value={denuncia.cargoDenunciado}
                        color="rose"
                      />
                      <DataPoint icon={Users} label="Área/Departamento" value={denuncia.areaDenunciado} color="rose" />
                      <Separator className="col-span-2 my-2" />
                      <DataPoint
                        icon={User}
                        label="Jefatura Directa"
                        value={denuncia.nombreJefaturaDenunciado}
                        color="rose"
                      />
                      <DataPoint
                        icon={Briefcase}
                        label="Cargo Jefatura"
                        value={denuncia.cargoJefaturaDenunciado}
                        color="rose"
                      />
                      <DataPoint
                        icon={Link}
                        label="Vínculo con Denunciante"
                        value={denuncia.vinculo}
                        color="rose"
                        colSpan={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 3. Narración */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-primary">
                <FileText className="h-5 w-5" />
                <h4 className="text-lg uppercase tracking-wider">3. Relato de los Hechos</h4>
              </div>
              <div className="whitespace-pre-wrap rounded-2xl border border-border bg-slate-50 p-8 font-medium text-base text-slate-800 leading-relaxed shadow-inner dark:bg-slate-900 dark:text-slate-200">
                {denuncia.relatoHechos}
              </div>
            </section>

            {/* 4. Testigos */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Users className="h-5 w-5" />
                <h4 className="text-lg uppercase tracking-wider">4. Testigos Declarados</h4>
              </div>
              <Card className="border-dashed bg-muted/20">
                <CardContent className="p-6">
                  {denuncia.testigos ? (
                    <div className="flex gap-4">
                      <Info className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{denuncia.testigos}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground text-sm italic">
                      <Info className="h-4 w-4" />
                      No se declararon testigos adicionales en el formulario inicial.
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* 5. Evidencia */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Paperclip className="h-5 w-5" />
                <h4 className="text-lg uppercase tracking-wider">5. Evidencia Adjunta</h4>
              </div>
              {renderFiles()}
            </section>

            {/* 6. Observaciones */}
            {denuncia.observaciones && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <Info className="h-5 w-5" />
                  <h4 className="text-lg uppercase tracking-wider">6. Observaciones Finales</h4>
                </div>
                <div className="whitespace-pre-wrap rounded-xl border border-orange-200/50 bg-orange-50/10 p-6 text-sm">
                  {denuncia.observaciones}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t bg-slate-50 p-4 dark:bg-slate-900">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cerrar Detalle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DataPoint({
  icon: Icon,
  label,
  value,
  colSpan = 1,
  color = "slate",
}: {
  icon: LucideIcon;
  label: string;
  value: string | undefined;
  colSpan?: number;
  color?: "slate" | "rose";
}) {
  return (
    <div className={cn("flex min-w-0 flex-col space-y-1.5 p-1", colSpan === 2 ? "md:col-span-2" : "md:col-span-1")}>
      <span className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-[10px] text-muted-foreground uppercase sm:text-xs">
        <Icon className={cn("h-3 w-3 shrink-0", color === "rose" ? "text-rose-500" : "text-slate-500")} />
        {label}
      </span>
      <p
        className={cn(
          "break-all font-semibold text-sm leading-tight sm:break-words",
          color === "rose" ? "text-rose-900 dark:text-rose-300" : "text-slate-900 dark:text-slate-100",
        )}
      >
        {value || <span className="font-normal text-muted-foreground italic">No informado</span>}
      </p>
    </div>
  );
}
