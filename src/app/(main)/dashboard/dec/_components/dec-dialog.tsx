"use client";

import { useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

import type { DecRecord } from "./columns";

const antecedentesOptions = [
  "Nada.",
  "Se le pide que haga la tarea.",
  "Momento de ocio.",
  "Se le llama la atención por indisciplina en aula.",
  "Conflicto con estudiante",
  "Conflicto con profesor  o asistente de la red.",
  "Otra:",
];

const conductasOptions = [
  "Agresión física: ¿a quién?",
  "Autoagresión.",
  "Se escapa o corre.",
  "Negativismo.",
  "Tira y/o rompe cosas.",
  "Escupe.",
  "Quita cosas.",
  "Otro:",
];

const cursosOptions = [
  "Nivel Medio Menor A",
  "Nivel Medio Mayor A",
  "Nivel de Transición 1 A",
  "Nivel de Transición 2 A",
  "1er nivel de Transición (Pre-kinder) A",
  "1er nivel de Transición (Pre-kinder) B",
  "2° nivel de Transición (Kinder) A",
  "2° nivel de Transición (Kinder) B",
  "1° Básico A",
  "1° Básico B",
  "2° Básico A",
  "2° Básico B",
  "3° Básico A",
  "3° Básico B",
  "4° Básico A",
  "5° Básico A",
  "5° Básico B",
  "6° Básico A",
  "6° Básico B",
  "7° Básico A",
  "7° Básico B",
  "7° Básico C",
  "8° Básico A",
  "8° Básico B",
  "8° Básico C",
  "1° Medio A",
  "1° Medio B",
  "1° Medio C",
  "1° Medio D",
  "1° Medio E",
  "1° Medio F",
  "2° Medio A",
  "2° Medio B",
  "2° Medio C",
  "2° Medio D",
  "2° Media E",
  "3° Medio A",
  "3° Medio B",
  "3° Medio D",
  "3° Medio E",
  "4° Media A",
  "4° Medio B",
  "4° Medio C",
  "4° Medio D",
  "3° Medio A Enseñanza Media Técnico-Profesional Comercial niños",
  "3° Medio B Enseñanza Media Técnico-Profesional Comercial niños",
  "4° Medio A Enseñanza Media Técnico-Profesional Comercial niños",
  "4° Medio B Enseñanza Media Técnico-Profesional Comercial niños",
  "3° Medio C Enseñanza Media Técnico-Profesional Industrial niños",
  "4° Medio C Enseñanza Media Técnico-Profesional Industrial niños",
  "3° Medio B Enseñanza Media Técnico-Profesional Industrial niños",
  "4° Medio B Enseñanza Media Técnico-Profesional Industrial niños",
  "3° Medio A Enseñanza Media Técnico-Profesional Técnica niños",
  "4° Medio A Enseñanza Media Técnico-Profesional Técnica niños",
  "Laboral 1 A",
  "Laboral 2 A",
  "Laboral 3 A",
];

const consecuentesOptions = [
  "Se tranquiliza solo.",
  "Es reconducido  a la actividad inicial.",
  "Es reprendido.",
  "Se realiza tiempo fuera (dentro del aula, en un lugar reservado para reflexionar, separado del grupo).",
  "Se le cambia la actividad.",
  "Se ignora.",
  "Se aplica reglamento interno: sanción formativa(alternativa).",
  "Se acuerda entre familia  y escuela, reducción de jornada.",
  "Se aplica reglamento interno: sanción regular.",
  "Se solicita presencia de apoderado en establecimiento.",
  "Se solicita apoyo de centro asistencial.",
  "Se solicita retirar al estudiante del establecimiento educacional.",
  "Otro:",
];

const decFormSchema = z.object({
  dia: z.string().min(1, "La fecha es requerida"),
  nombre_estudiante: z.string().min(1, "Requerido"),
  edad_estudiante: z.coerce.number().min(1, "Requerido"),
  curso_estudiante: z.string().min(1, "Requerido"),
  profe_jefe_estudiante: z.string().min(1, "Requerido"),
  nombre_apoderado: z.string().min(1, "Requerido"),
  fono_apoderado: z.string().min(1, "Requerido"),
  encargado_pi: z.string().optional(),
  acompanante_interno_pi: z.string().optional(),
  acompanante_externo_pi: z.string().optional(),
  ea_docente: z.string().optional(),
  ea_asistente: z.string().optional(),
  ea_edu_pie: z.string().optional(),
  hora: z.string().min(1, "Requerido"),
  hora_otro: z.string().optional(),
  asignaturas: z.string().min(1, "Requerido"),
  asignatura_otra: z.string().optional(),
  antecedentes: z.any().transform((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string")
      return val
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    return [];
  }),
  ConflictoConEstudiante_antecedentes: z.string().optional(),
  ConflictoConProfesor_antecedentes: z.string().optional(),
  otra_antecedentes: z.string().optional(),
  conductas: z.any().transform((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string")
      return val
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    return [];
  }),
  Agresion_fisica_conductas: z.string().optional(),
  otro_conductas: z.string().optional(),
  descripcion_conductas: z.string().optional(),
  duracion_conductas: z.string().optional(),
  consecuentes: z.any().transform((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string")
      return val
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    return [];
  }),
  otro_consecuentes: z.string().optional(),
  funciona_medida: z.boolean().default(false),
  propuesta_mejora: z.string().optional(),
  establecimiento: z.string().optional(),
  nivel_dec: z.string().min(1, "Debe seleccionar un nivel"),
}).superRefine((data, ctx) => {
  if (data.nivel_dec === "Nivel 1") {
    if (!data.ea_docente?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["ea_docente"] });
    }
    if (!data.ea_asistente?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["ea_asistente"] });
    }
    if (!data.ea_edu_pie?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["ea_edu_pie"] });
    }
  } else if (data.nivel_dec === "Nivel 2" || data.nivel_dec === "Nivel 3") {
    if (!data.encargado_pi?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["encargado_pi"] });
    }
    if (!data.acompanante_interno_pi?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["acompanante_interno_pi"] });
    }
    if (data.nivel_dec === "Nivel 3" && !data.acompanante_externo_pi?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["acompanante_externo_pi"] });
    }
  }
});

type DecFormValues = z.infer<typeof decFormSchema>;

interface DecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: DecRecord | null;
  onSuccess: () => void;
}

type Establecimiento = {
  id: string;
  nombre: string;
};

export function DecDialog({ open, onOpenChange, record, onSuccess }: DecDialogProps) {
  // Read from pb.authStore.record (same stable reference as .model, renamed in newer PB versions)
  // We extract only primitive scalars so they can safely be used as effect dependencies.
  const currentUser = pb.authStore.record;
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";
  const isItinerante = currentUser?.role?.toLowerCase() === "itinerante";
  const hasGlobalAccess = isAdmin || isItinerante;
  // Serialize establecimiento to a stable string for dep-array comparisons
  const establecimientoKey = JSON.stringify(currentUser?.establecimiento ?? null);
  const userEstablecimiento: string | null = typeof currentUser?.establecimiento === "string"
    ? currentUser.establecimiento
    : null;

  const [loading, setLoading] = useState(false);
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [antecedentesOpen, setAntecedentesOpen] = useState(false);
  const [conductasOpen, setConductasOpen] = useState(false);
  const [consecuentesOpen, setConsecuentesOpen] = useState(false);

  // Cargar establecimientos
  useEffect(() => {
    if (!open) return;
    pb.collection("establecimientos")
      .getFullList({ sort: "nombre" })
      .then((r) => {
        const allEstablecimientos = r as unknown as Establecimiento[];
        // Parse the serialized key back into the value we need
        const rawEst = JSON.parse(establecimientoKey) as string | string[] | null;

        if (isAdmin) {
          setEstablecimientos(allEstablecimientos);
        } else if (isItinerante && rawEst) {
          const assignedIds = Array.isArray(rawEst) ? rawEst : [rawEst];
          setEstablecimientos(allEstablecimientos.filter((e) => assignedIds.includes(e.id)));
        } else {
          setEstablecimientos(allEstablecimientos);
        }
      })
      .catch(console.error);
  }, [open, isAdmin, isItinerante, establecimientoKey]);

  const form = useForm<DecFormValues>({
    resolver: zodResolver(decFormSchema),
    defaultValues: {
      dia: new Date().toISOString().slice(0, 16),
      nombre_estudiante: "",
      edad_estudiante: 0,
      curso_estudiante: "",
      profe_jefe_estudiante: "",
      nombre_apoderado: "",
      fono_apoderado: "",
      encargado_pi: "",
      acompanante_interno_pi: "",
      acompanante_externo_pi: "",
      ea_docente: "",
      ea_asistente: "",
      ea_edu_pie: "",
      hora: "",
      hora_otro: "",
      asignaturas: "",
      asignatura_otra: "",
      antecedentes: [],
      ConflictoConEstudiante_antecedentes: "",
      ConflictoConProfesor_antecedentes: "",
      otra_antecedentes: "",
      conductas: [],
      Agresion_fisica_conductas: "",
      otro_conductas: "",
      descripcion_conductas: "",
      duracion_conductas: "",
      consecuentes: [],
      otro_consecuentes: "",
      funciona_medida: false,
      propuesta_mejora: "",
      establecimiento: "",
      nivel_dec: "",
    },
  });
  const { reset } = form;

  // Tracks the last open+recordId combination we already reset for, to prevent
  // the effect from re-running when only a non-meaningful dependency re-evaluates.
  const lastResetKey = useRef<string>("");

  useEffect(() => {
    if (!open) {
      lastResetKey.current = "";
      return;
    }

    // Build a stable key: open flag + record id (or "new" for create mode)
    const resetKey = `${open ? "open" : "closed"}::${record?.id ?? "new"}`;
    if (lastResetKey.current === resetKey) return;
    lastResetKey.current = resetKey;

    if (record) {
      reset({
        ...record,
        dia: record.dia ? new Date(record.dia).toISOString().slice(0, 16) : "",
        antecedentes: Array.isArray(record.antecedentes) ? record.antecedentes : [],
        conductas: Array.isArray(record.conductas) ? record.conductas : [],
        consecuentes: Array.isArray(record.consecuentes) ? record.consecuentes : [],
        establecimiento: record.establecimiento || "",
        nivel_dec: record.nivel_dec || "",
        encargado_pi: record.encargado_pi || "",
        acompanante_interno_pi: record.acompanante_interno_pi || "",
        acompanante_externo_pi: record.acompanante_externo_pi || "",
        ea_docente: record.ea_docente || "",
        ea_asistente: record.ea_asistente || "",
        ea_edu_pie: record.ea_edu_pie || "",
      });
    } else {
      reset({
        dia: new Date().toISOString().slice(0, 16),
        nombre_estudiante: "",
        edad_estudiante: 0,
        curso_estudiante: "",
        profe_jefe_estudiante: "",
        nombre_apoderado: "",
        fono_apoderado: "",
        encargado_pi: "",
        acompanante_interno_pi: "",
        acompanante_externo_pi: "",
        ea_docente: "",
        ea_asistente: "",
        ea_edu_pie: "",
        hora: "",
        hora_otro: "",
        asignaturas: "",
        asignatura_otra: "",
        antecedentes: [],
        ConflictoConEstudiante_antecedentes: "",
        ConflictoConProfesor_antecedentes: "",
        otra_antecedentes: "",
        conductas: [],
        Agresion_fisica_conductas: "",
        otro_conductas: "",
        descripcion_conductas: "",
        duracion_conductas: "",
        consecuentes: [],
        otro_consecuentes: "",
        funciona_medida: false,
        propuesta_mejora: "",
        establecimiento: hasGlobalAccess ? "" : (userEstablecimiento ?? ""),
        nivel_dec: "",
      });
    }
  }, [record, open, hasGlobalAccess, userEstablecimiento, reset]);

  const onSubmit = async (data: DecFormValues) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        dia: new Date(data.dia).toISOString(),
        establecimiento: hasGlobalAccess ? data.establecimiento || null : userEstablecimiento || null,
      };

      if (record) {
        await pb.collection("DEC").update(record.id, submitData);
        toast.success("Registro actualizado correctamente");
      } else {
        await pb.collection("DEC").create(submitData);
        toast.success("Registro creado correctamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: unknown } };
      console.error("Full error object:", error);
      console.error("Response data:", error.response?.data);

      let errorMessage = error.message || "Por favor verifica los datos ingresados.";
      if (error.response?.data) {
        errorMessage = `Error PB: ${JSON.stringify(error.response.data)}`;
      }

      toast.error(record ? "Error al actualizar registro" : "Error al crear registro", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    if (open) {
      setStep(1); // Reset step when opening
    }
  }, [open]);

  const nextStep = () => {
    // Partial validation here if needed, or simply proceed
    setStep(Math.min(step + 1, totalSteps));
  };

  const prevStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] flex-col p-0 sm:max-w-[700px]">
        <DialogHeader className="border-b px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{record ? "Editar DEC" : "Nuevo DEC"}</DialogTitle>
              <DialogDescription>
                {record
                  ? "Actualiza los detalles del Documento de Entrevista y Compromiso."
                  : "Crea un nuevo Documento de Entrevista y Compromiso."}
              </DialogDescription>
            </div>
            <div className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground text-sm">
              Paso {step} de {totalSteps}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-6">
                {/* PASO 1: Datos Generales y Personal */}
                {step === 1 && (
                  <div className="fade-in slide-in-from-right-4 animate-in space-y-6 duration-300">
                    <div className="space-y-2">
                      <h3 className="border-b pb-2 font-medium text-lg">Datos Generales</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {hasGlobalAccess ? (
                          <FormField
                            control={form.control}
                            name="establecimiento"
                            render={({ field }) => {
                              const selected = establecimientos.find((e) => e.id === field.value);
                              return (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Establecimiento</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className={cn("w-full", !selected && "text-muted-foreground")}>
                                        <SelectValue placeholder="Seleccione un establecimiento" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {establecimientos.map((est) => (
                                        <SelectItem key={est.id} value={est.id}>
                                          {est.nombre.length > 50 ? `${est.nombre.substring(0, 50)}...` : est.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        ) : (
                          <div className="space-y-1">
                            <p className="font-medium text-sm">Establecimiento</p>
                            <p className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-muted-foreground text-sm">
                              {(() => {
                                const nombre = establecimientos.find((e) => e.id === userEstablecimiento)?.nombre;
                                if (!nombre) return "Sin establecimiento asignado";
                                return nombre.length > 40 ? `${nombre.substring(0, 40)}...` : nombre;
                              })()}
                            </p>
                          </div>
                        )}
                        <FormField
                          control={form.control}
                          name="dia"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha y Hora (Día)</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hora"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bloque/Hora</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un bloque" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="8:00 - 9:30">8:00 - 9:30</SelectItem>
                                  <SelectItem value="Recreo 1">Recreo 1</SelectItem>
                                  <SelectItem value="09:45-11:20">09:45 - 11:20</SelectItem>
                                  <SelectItem value="Recreo 2">Recreo 2</SelectItem>
                                  <SelectItem value="11:30-13:00">11:30 - 13:00</SelectItem>
                                  <SelectItem value="Colacion">Colación</SelectItem>
                                  <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="asignaturas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Asignatura(s)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una asignatura" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Lenguaje">Lenguaje</SelectItem>
                                  <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                                  <SelectItem value="Cs. Naturales">Cs. Naturales</SelectItem>
                                  <SelectItem value="Historia y Cs Sociales">Historia y Cs Sociales</SelectItem>
                                  <SelectItem value="Inglés">Inglés</SelectItem>
                                  <SelectItem value="Artes Visuales">Artes Visuales</SelectItem>
                                  <SelectItem value="Música">Música</SelectItem>
                                  <SelectItem value="Educación Física">Educación Física</SelectItem>
                                  <SelectItem value="Religión">Religión</SelectItem>
                                  <SelectItem value="Tecnología">Tecnología</SelectItem>
                                  <SelectItem value="Lengua Indígena">Lengua Indígena</SelectItem>
                                  <SelectItem value="Otra:">Otra:</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Campos condicionales: siempre al final, col-span-2 */}
                        {form.watch("hora") === "Otro" && (
                          <FormField
                            control={form.control}
                            name="hora_otro"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Especificar bloque/hora</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingrese el bloque u hora" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {form.watch("asignaturas") === "Otra:" && (
                          <FormField
                            control={form.control}
                            name="asignatura_otra"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Especificar asignatura</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingrese la asignatura" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="border-b pb-2 font-medium text-lg">Nivel DEC</h3>
                      <FormField
                        control={form.control}
                        name="nivel_dec"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel de intensidad de la DEC:</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el nivel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Nivel 1">
                                  Nivel 1:(Puede regularse dentro de la sala, intensidad baja)
                                </SelectItem>
                                <SelectItem value="Nivel 2">
                                  Nivel 2:(Ausencia de autocontrol, intensidad media,P.E:fuga, rabieta o gritos no
                                  dirigidos)
                                </SelectItem>
                                <SelectItem value="Nivel 3">
                                  Nivel 3:(Descontrol con riesgo para si mismo y terceros)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="border-b pb-2 font-medium text-lg">Personal a Cargo</h3>

                      {!form.watch("nivel_dec") && (
                        <div className="rounded-md bg-muted p-4 text-center text-muted-foreground text-sm">
                          Seleccione el <strong>Nivel DEC</strong> para visualizar los campos de personal a cargo correspondientes.
                        </div>
                      )}

                      {form.watch("nivel_dec") === "Nivel 1" && (
                        <div className="space-y-4 rounded-md border p-4">
                          <h4 className="font-semibold text-sm">Equipo de Aula</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="ea_docente"
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel>Docente</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="ea_asistente"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Asistente</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="ea_edu_pie"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ed. Diferencial P.I.E.</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      {(form.watch("nivel_dec") === "Nivel 2" || form.watch("nivel_dec") === "Nivel 3") && (
                        <div className="space-y-4 rounded-md border p-4">
                          <h4 className="font-semibold text-sm">Equipo Multidisciplinario</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="encargado_pi"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Encargado(a)</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="acompanante_interno_pi"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Acompañante Interno</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {form.watch("nivel_dec") === "Nivel 3" && (
                              <FormField
                                control={form.control}
                                name="acompanante_externo_pi"
                                render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel>Acompañante Externo</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PASO 2: Estudiante, Apoderado y Antecedentes */}
                {step === 2 && (
                  <div className="fade-in slide-in-from-right-4 animate-in space-y-6 duration-300">
                    <div className="space-y-2">
                      <h3 className="border-b pb-2 font-medium text-lg">Antecedentes del Estudiante</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="nombre_estudiante"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Estudiante</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="edad_estudiante"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Edad</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="curso_estudiante"
                          render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                              <FormLabel>Curso</FormLabel>
                              <Popover modal={true}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value
                                        ? cursosOptions.find((curso) => curso === field.value)
                                        : "Seleccione un curso"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                  <Command
                                    filter={(value, search) => {
                                      const normalize = (str: string) =>
                                        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                      if (normalize(value).includes(normalize(search))) return 1;
                                      return 0;
                                    }}
                                  >
                                    <CommandInput placeholder="Buscar curso..." />
                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                      <CommandEmpty>No se encontró el curso.</CommandEmpty>
                                      <CommandGroup>
                                        {cursosOptions.map((curso) => (
                                          <CommandItem
                                            value={curso}
                                            key={curso}
                                            onSelect={() => {
                                              form.setValue("curso_estudiante", curso, { shouldValidate: true });
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                curso === field.value ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            {curso}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="profe_jefe_estudiante"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profesor Jefe</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nombre_apoderado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Apoderado</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fono_apoderado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono Apoderado</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="fade-in slide-in-from-right-4 animate-in space-y-2 duration-300">
                      <div className="space-y-2">
                        <h3 className="border-b pb-2 font-medium text-lg">Gatillante de la DEC</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="antecedentes"
                            render={({ field }) => {
                              const selected: string[] = Array.isArray(field.value) ? field.value : [];
                              return (
                                <FormItem className="flex flex-col">
                                  <FormLabel>¿Qué estaba haciendo el estudiante?</FormLabel>
                                  <Popover open={antecedentesOpen} onOpenChange={setAntecedentesOpen}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          role="combobox"
                                          className={cn(
                                            "h-auto min-h-10 w-full flex-wrap justify-start gap-1 py-2",
                                            selected.length === 0 && "text-muted-foreground",
                                          )}
                                        >
                                          {selected.length === 0 ? (
                                            <span>Seleccione antecedentes...</span>
                                          ) : (
                                            selected.map((item) => (
                                              <Badge
                                                key={item}
                                                variant="secondary"
                                                className="text-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  field.onChange(selected.filter((v) => v !== item));
                                                }}
                                              >
                                                {item.length > 30 ? `${item.slice(0, 30)}…` : item}
                                                <X className="ml-1 h-3 w-3 cursor-pointer" />
                                              </Badge>
                                            ))
                                          )}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[620px] p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Buscar antecedente..." />
                                        <CommandList onWheel={(e) => e.stopPropagation()}>
                                          <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                                          <CommandGroup>
                                            {antecedentesOptions.map((item) => (
                                              <CommandItem
                                                key={item}
                                                value={item}
                                                onSelect={() => {
                                                  const next = selected.includes(item)
                                                    ? selected.filter((v) => v !== item)
                                                    : [...selected, item];
                                                  field.onChange(next);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selected.includes(item) ? "opacity-100" : "opacity-0",
                                                  )}
                                                />
                                                {item}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          {(form.watch("antecedentes") ?? []).includes("Otra:") && (
                            <FormField
                              control={form.control}
                              name="otra_antecedentes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Especificar otro antecedente</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ingrese el antecedente" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: Conductas */}
                {step === 3 && (
                  <div className="fade-in slide-in-from-right-4 animate-in space-y-6 duration-300">
                    <div className="space-y-4">
                      <h3 className="border-b pb-2 font-medium text-lg">Conductas</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="conductas"
                          render={({ field }) => {
                            const selected: string[] = Array.isArray(field.value) ? field.value : [];
                            return (
                              <FormItem className="flex flex-col">
                                <FormLabel>¿Como responde a lo que se le pide?</FormLabel>
                                <Popover open={conductasOpen} onOpenChange={setConductasOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "h-auto min-h-10 w-full flex-wrap justify-start gap-1 py-2",
                                          selected.length === 0 && "text-muted-foreground",
                                        )}
                                      >
                                        {selected.length === 0 ? (
                                          <span>Seleccione conductas...</span>
                                        ) : (
                                          selected.map((item) => (
                                            <Badge
                                              key={item}
                                              variant="secondary"
                                              className="text-xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                field.onChange(selected.filter((v) => v !== item));
                                              }}
                                            >
                                              {item.length > 30 ? `${item.slice(0, 30)}…` : item}
                                              <X className="ml-1 h-3 w-3 cursor-pointer" />
                                            </Badge>
                                          ))
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[620px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Buscar conducta..." />
                                      <CommandList onWheel={(e) => e.stopPropagation()}>
                                        <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                                        <CommandGroup>
                                          {conductasOptions.map((item) => (
                                            <CommandItem
                                              key={item}
                                              value={item}
                                              onSelect={() => {
                                                const next = selected.includes(item)
                                                  ? selected.filter((v) => v !== item)
                                                  : [...selected, item];
                                                field.onChange(next);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  selected.includes(item) ? "opacity-100" : "opacity-0",
                                                )}
                                              />
                                              {item}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        {(form.watch("conductas") ?? []).includes("Otro:") && (
                          <FormField
                            control={form.control}
                            name="otro_conductas"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Especificar otra conducta</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingrese la conducta" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {(form.watch("conductas") ?? []).includes("Agresión física:¿a quién?") && (
                          <FormField
                            control={form.control}
                            name="Agresion_fisica_conductas"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>¿A quién agredió?</FormLabel>
                                <FormControl>
                                  <Input placeholder="Especifique a quién" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                          <FormField
                            control={form.control}
                            name="duracion_conductas"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duración de la conducta</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione duración" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="10 a 30 Minutos">10 a 30 Minutos</SelectItem>
                                    <SelectItem value="30 a 60 Minutos">30 a 60 Minutos</SelectItem>
                                    <SelectItem value="Mas de 1 hora">Más de 1 hora</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="descripcion_conductas"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Descripción Adicional</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 4: Consecuentes */}
                {step === 4 && (
                  <div className="fade-in slide-in-from-right-4 animate-in space-y-6 duration-300">
                    <div className="space-y-4">
                      <h3 className="border-b pb-2 font-medium text-lg">Consecuencias y Medidas</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="consecuentes"
                          render={({ field }) => {
                            const selected: string[] = Array.isArray(field.value) ? field.value : [];
                            return (
                              <FormItem className="flex flex-col">
                                <FormLabel>Seleccione los Consecuentes</FormLabel>
                                <Popover open={consecuentesOpen} onOpenChange={setConsecuentesOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "h-auto min-h-10 w-full flex-wrap justify-start gap-1 py-2",
                                          selected.length === 0 && "text-muted-foreground",
                                        )}
                                      >
                                        {selected.length === 0 ? (
                                          <span>Seleccione consecuentes...</span>
                                        ) : (
                                          selected.map((item) => (
                                            <Badge
                                              key={item}
                                              variant="secondary"
                                              className="text-xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                field.onChange(selected.filter((v) => v !== item));
                                              }}
                                            >
                                              {item.length > 30 ? `${item.slice(0, 30)}…` : item}
                                              <X className="ml-1 h-3 w-3 cursor-pointer" />
                                            </Badge>
                                          ))
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[620px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Buscar consecuente..." />
                                      <CommandList onWheel={(e) => e.stopPropagation()}>
                                        <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                                        <CommandGroup>
                                          {consecuentesOptions.map((item) => (
                                            <CommandItem
                                              key={item}
                                              value={item}
                                              onSelect={() => {
                                                const next = selected.includes(item)
                                                  ? selected.filter((v) => v !== item)
                                                  : [...selected, item];
                                                field.onChange(next);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  selected.includes(item) ? "opacity-100" : "opacity-0",
                                                )}
                                              />
                                              {item}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        {(form.watch("consecuentes") ?? []).includes("Otro:") && (
                          <FormField
                            control={form.control}
                            name="otro_consecuentes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Especificar otro consecuente</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingrese el consecuente" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={form.control}
                          name="funciona_medida"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold text-base">¿Funciona la Medida tomada?</FormLabel>
                              <div className="flex gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() => field.onChange(true)}
                                  className={cn(
                                    "flex-1 rounded-lg border-2 py-3 font-semibold text-sm transition-all duration-200",
                                    field.value === true
                                      ? "border-green-500 bg-green-500 text-white shadow-md"
                                      : "border-border bg-background text-muted-foreground hover:border-green-400 hover:text-green-600",
                                  )}
                                >
                                  ✓ Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => field.onChange(false)}
                                  className={cn(
                                    "flex-1 rounded-lg border-2 py-3 font-semibold text-sm transition-all duration-200",
                                    field.value === false
                                      ? "border-red-500 bg-red-500 text-white shadow-md"
                                      : "border-border bg-background text-muted-foreground hover:border-red-400 hover:text-red-600",
                                  )}
                                >
                                  ✗ No
                                </button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="propuesta_mejora"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Propuesta de Mejora</FormLabel>
                              <FormControl>
                                <Textarea className="min-h-[80px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto border-t bg-muted/20 p-6">
              <div className="flex w-full items-center justify-between">
                {/* Zona Botón Cancelar/Anterior */}
                <div>
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} disabled={loading}>
                      Paso Anterior
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                      Cancelar
                    </Button>
                  )}
                </div>

                {/* Puntos indicadores opcionales de progreso */}
                <div className="flex hidden gap-1.5 px-4 sm:flex">
                  {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepIndex) => (
                    <div
                      key={`step-indicator-${stepIndex}`}
                      className={`h-2 rounded-full transition-all ${
                        step === stepIndex
                          ? "w-6 bg-primary"
                          : step > stepIndex
                            ? "w-2 bg-primary/60"
                            : "w-2 bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Zona Botón Siguiente/Guardar */}
                <div>
                  {step < totalSteps ? (
                    <Button type="button" onClick={nextStep} disabled={loading}>
                      Siguiente Paso
                    </Button>
                  ) : (
                    <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                      {loading && <span className="mr-2 animate-spin">⏳</span>}
                      {record ? "Guardar cambios" : "Crear registro DEC"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
