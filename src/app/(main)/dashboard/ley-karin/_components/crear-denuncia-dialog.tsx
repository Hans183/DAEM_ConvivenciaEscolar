"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { submitDenunciaKarinDashboard } from "@/app/actions/ley-karin-actions";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatRut } from "@/lib/rut-utils";
import { cn } from "@/lib/utils";

import {
  type DenunciaKarinFormValues,
  denunciaKarinSchema,
} from "@/app/(external)/ley-karin/denuncia/schema";

interface CrearDenunciaDialogProps {
  establecimientos: { id: string; nombre: string }[];
  onCreated: () => void;
}

export function CrearDenunciaDialog({
  establecimientos,
  onCreated,
}: CrearDenunciaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DenunciaKarinFormValues>({
    resolver: zodResolver(denunciaKarinSchema),
    defaultValues: {
      materia: undefined,
      nombresDenunciante: "",
      rutDenunciante: "",
      direccionDenunciante: "",
      ciudadComunaDenunciante: "",
      telefonoDenunciante: "",
      correoDenunciante: "",
      cargoDenunciante: "",
      areaDenunciante: "",
      establecimiento: "",
      nombreJefaturaDenunciante: "",
      cargoJefaturaDenunciante: undefined,

      nombresDenunciado: "",
      cargoDenunciado: "",
      areaDenunciado: "",
      nombreJefaturaDenunciado: "",
      cargoJefaturaDenunciado: undefined,

      vinculo: undefined,
      relatoHechos: "",
      temporalidad: "",
      testigos: "",
      observaciones: "",
    },
  });

  function onSubmit(values: DenunciaKarinFormValues) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== "evidencia") {
            formData.append(key, value.toString());
          }
        });

        // Append evidence files
        if (values.evidencia && values.evidencia.length > 0) {
          for (let i = 0; i < values.evidencia.length; i++) {
            formData.append("evidencia", values.evidencia[i]);
          }
        }

        const res = await submitDenunciaKarinDashboard(formData);

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Denuncia ingresada correctamente.");
          form.reset();
          setOpen(false);
          onCreated();
        }
      } catch (_error) {
        toast.error("Ocurrió un error inesperado al enviar la denuncia.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Denuncia
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-w-[900px]">
        <DialogHeader className="border-b bg-slate-50 px-8 py-6 dark:bg-slate-900">
          <DialogTitle className="font-extrabold text-2xl tracking-tight">
            Ingresar Nueva Denuncia Ley Karin
          </DialogTitle>
          <DialogDescription>
            Complete todos los campos requeridos del formulario de denuncia.
            La información será tratada con estricta confidencialidad.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-10"
              >
                {/* SECCIÓN 1: Materia */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-1 rounded-full bg-primary" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      1. Materia de la Denuncia
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="materia"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                          Tipo de situación a informar
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Acoso Sexual">
                              Acoso Sexual
                            </SelectItem>
                            <SelectItem value="Acoso Laboral">
                              Acoso Laboral
                            </SelectItem>
                            <SelectItem value="Violencia en el Trabajo">
                              Violencia en el Trabajo
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* SECCIÓN 2: Denunciante */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-1 rounded-full bg-primary" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      2. Identificación de quien Denuncia
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nombresDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Nombre completo
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rutDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Cédula de Identidad (RUT)
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-10"
                              placeholder="12.345.678-9"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatRut(e.target.value);
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="correoDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Correo electrónico
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-10"
                              type="email"
                              placeholder="correo@ejemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefonoDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Teléfono de contacto
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-10"
                              placeholder="+56 9 1234 5678"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="direccionDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Dirección particular
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ciudadComunaDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Ciudad y Comuna
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-10"
                              placeholder="Ej. La Unión, Región de Los Ríos"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cargoDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Cargo que desempeña
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="areaDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Área de desempeño
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="establecimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Establecimiento
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full h-10 justify-between font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? establecimientos.find(
                                        (est) => est.id === field.value
                                      )?.nombre
                                    : "Selecciona un establecimiento"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar establecimiento..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No se encontró ningún establecimiento.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {establecimientos.map((est) => (
                                      <CommandItem
                                        value={est.nombre}
                                        key={est.id}
                                        onSelect={() => {
                                          form.setValue(
                                            "establecimiento",
                                            est.id,
                                            { shouldValidate: true }
                                          );
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            est.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {est.nombre}
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
                      name="nombreJefaturaDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Nombre Jefatura Directa
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoJefaturaDenunciante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Cargo Jefatura Directa
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Selecciona un cargo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Docente">Docente</SelectItem>
                              <SelectItem value="Directivo">
                                Directivo
                              </SelectItem>
                              <SelectItem value="Apoderado">
                                Apoderado
                              </SelectItem>
                              <SelectItem value="Asistente">
                                Asistente
                              </SelectItem>
                              <SelectItem value="Estudiante">
                                Estudiante
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN 3: Denunciado */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-1 rounded-full bg-primary" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      3. Identificación de la Persona Denunciada
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nombresDenunciado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Nombre completo
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoDenunciado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Cargo
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="areaDenunciado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Área de desempeño
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nombreJefaturaDenunciado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Nombre Jefatura Directa (Opcional si se desconoce)
                          </FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoJefaturaDenunciado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                            Cargo Jefatura Directa
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Selecciona un cargo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Docente">Docente</SelectItem>
                              <SelectItem value="Directivo">
                                Directivo
                              </SelectItem>
                              <SelectItem value="Apoderado">
                                Apoderado
                              </SelectItem>
                              <SelectItem value="Asistente">
                                Asistente
                              </SelectItem>
                              <SelectItem value="Estudiante">
                                Estudiante
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN 4: Relato */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-1 rounded-full bg-primary" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      4. Relación y Relato de los Hechos
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="vinculo"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                          Vínculo con el/la denunciado/a
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecciona el vínculo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Docente">Docente</SelectItem>
                            <SelectItem value="Directivo">Directivo</SelectItem>
                            <SelectItem value="Apoderado">
                              Apoderado
                            </SelectItem>
                            <SelectItem value="Asistente">Asistente</SelectItem>
                            <SelectItem value="Estudiante">
                              Estudiante
                            </SelectItem>
                            <SelectItem value="Externo">Externo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="temporalidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                          Temporalidad
                        </FormLabel>
                        <FormDescription>
                          ¿Hace cuánto tiempo considera que es objeto de estas
                          acciones?
                        </FormDescription>
                        <FormControl>
                          <Input className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relatoHechos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                          Narración circunstanciada
                        </FormLabel>
                        <FormDescription>
                          Describa detallada y cronológicamente lo ocurrido
                          (incluya lugares, fechas y detalles específicos).
                        </FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="testigos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                          Testigos (Opcional)
                        </FormLabel>
                        <FormDescription>
                          Individualización de personas que presenciaron o tengan
                          información.
                        </FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[80px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evidencia"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                          Archivos Adjuntos / Evidencia (Opcional)
                        </FormLabel>
                        <FormDescription>
                          Si posees correos, imágenes o documentos, por favor
                          adjúntalos aquí.
                        </FormDescription>
                        <FormControl>
                          <div className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors hover:bg-accent/50">
                            <Input
                              type="file"
                              multiple
                              className="cursor-pointer file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-1.5 file:text-primary-foreground file:text-sm"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                              value={undefined}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* SECCIÓN 5: Cierre */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-1 rounded-full bg-primary" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      5. Cierre y Formalización
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                          Observaciones adicionales (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[80px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Declaración de Confidencialidad
                    </h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      De conformidad con lo establecido en la Ley N°21.643 (Ley
                      Karin), toda la información proporcionada en este
                      formulario será tratada con estricta confidencialidad.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="min-w-[180px] gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Ingresar Denuncia"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
