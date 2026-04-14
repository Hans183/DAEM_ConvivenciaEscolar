"use client";
import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { submitDenunciaKarin } from "@/app/actions/ley-karin-actions";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { formatRut } from "@/lib/rut-utils";
import { cn } from "@/lib/utils";

import { type DenunciaKarinFormValues, denunciaKarinSchema } from "../schema";

export function DenunciaForm({ establecimientos = [] }: { establecimientos?: { id: string, nombre: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const { executeRecaptcha, isReady } = useRecaptcha();

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
      cargoJefaturaDenunciante: "",
      
      nombresDenunciado: "",
      cargoDenunciado: "",
      areaDenunciado: "",
      nombreJefaturaDenunciado: "",
      cargoJefaturaDenunciado: "",
      
      vinculo: "",
      relatoHechos: "",
      temporalidad: "",
      testigos: "",
      observaciones: "",
      firmaAnonima: false,
    },
  });

  function onSubmit(values: DenunciaKarinFormValues) {
    startTransition(async () => {
      try {
        // 1. Get reCAPTCHA token before building FormData
        const recaptchaToken = await executeRecaptcha("denuncia_karin");

        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== "evidencia") {
            formData.append(key, value.toString());
          }
        });

        // Appendar archivos de evidencia
        if (values.evidencia && values.evidencia.length > 0) {
          for (let i = 0; i < values.evidencia.length; i++) {
            formData.append("evidencia", values.evidencia[i]);
          }
        }

        // 2. Append reCAPTCHA token (removed server-side before saving to PocketBase)
        formData.append("recaptchaToken", recaptchaToken);
        
        // Enviamos el formData completo al server action
        const res = await submitDenunciaKarin(formData);
        
        if (res.error) {
          toast.error(res.error);
        } else {
          setIsSuccess(true);
          toast.success("Denuncia recibida correctamente.");
        }
      } catch (_error) {
        toast.error("Ocurrió un error inesperado al enviar la denuncia.");
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Éxito</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="font-bold text-2xl">¡Denuncia Enviada!</h2>
        <p className="max-w-md text-muted-foreground">
          Tu formulario ha sido ingresado al sistema de manera segura. Hemos
          enviado un correo electrónico con el acuse de recibo y los pasos a
          seguir.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-4"
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        
        {/* SECCIÓN 1 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-bold text-slate-800 text-xl">
              1. Materia de la Denuncia
            </h3>
          </div>

          <FormField
            control={form.control}
            name="materia"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel className="font-semibold text-slate-700">
                  Tipo de situación a informar
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 border-slate-300 bg-white focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Acoso Sexual">Acoso Sexual</SelectItem>
                    <SelectItem value="Acoso Laboral">Acoso Laboral</SelectItem>
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

        <Separator className="bg-slate-200" />

        {/* SECCIÓN 2: Denunciante */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-bold text-slate-800 text-xl">
              2. Identificación de quien Denuncia
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nombresDenunciante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Nombre completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Cédula de Identidad (RUT)
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
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
                  <FormLabel className="font-semibold text-slate-700">
                    Correo electrónico
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
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
                  <FormLabel className="font-semibold text-slate-700">
                    Teléfono de contacto
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
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
                  <FormLabel className="font-semibold text-slate-700">
                    Dirección particular
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Ciudad y Comuna
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      placeholder="Ej. La Unión, Región de Los Ríos"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cargoDenunciante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Cargo que desempeña
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Área de desempeño
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Establecimiento
                  </FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full h-11 justify-between border-slate-300 bg-white font-normal hover:bg-white focus:border-primary focus:ring-primary/20",
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
                          <CommandEmpty>No se encontró ningún establecimiento.</CommandEmpty>
                          <CommandGroup>
                            {establecimientos.map((est) => (
                              <CommandItem
                                value={est.nombre}
                                key={est.id}
                                onSelect={() => {
                                  form.setValue("establecimiento", est.id, { shouldValidate: true })
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
                  <FormLabel className="font-semibold text-slate-700">
                    Nombre Jefatura Directa
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Cargo Jefatura Directa
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* SECCIÓN 3: Denunciado */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-bold text-slate-800 text-xl">
              3. Identificación de la Persona Denunciada
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nombresDenunciado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Nombre completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Cargo
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Área de desempeño
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">

            <FormField
              control={form.control}
              name="nombreJefaturaDenunciado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Nombre Jefatura Directa (Opcional si se desconoce)
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
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
                  <FormLabel className="font-semibold text-slate-700">
                    Cargo Jefatura Directa
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* SECCIÓN 4: Relato */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-bold text-slate-800 text-xl">
              4. Relación y Relato de los Hechos
            </h3>
          </div>

          <FormField
            control={form.control}
            name="vinculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">
                  Vínculo con el/la denunciado/a
                </FormLabel>
                <FormDescription>
                  Ej: Jefatura directa, compañero, usuario externo, etc.
                </FormDescription>
                <FormControl>
                  <Input
                    className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temporalidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">
                  Temporalidad
                </FormLabel>
                <FormDescription>
                  ¿Hace cuánto tiempo considera que es objeto de estas acciones?
                </FormDescription>
                <FormControl>
                  <Input
                    className="h-11 border-slate-300 bg-white focus-visible:ring-primary/20"
                    {...field}
                  />
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
                <FormLabel className="font-semibold text-slate-700">
                  Narración circunstanciada
                </FormLabel>
                <FormDescription>
                  Describa detallada y cronológicamente lo ocurrido (incluya
                  lugares, fechas y detalles específicos).
                </FormDescription>
                <FormControl>
                  <Textarea
                    className="min-h-[150px] border-slate-300 bg-white focus-visible:ring-primary/20"
                    {...field}
                  />
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
                <FormLabel className="font-semibold text-slate-700">
                  Testigos (Opcional)
                </FormLabel>
                <FormDescription>
                  Individualización de personas que presenciaron o tengan
                  información.
                </FormDescription>
                <FormControl>
                  <Textarea
                    className="min-h-[100px] border-slate-300 bg-white focus-visible:ring-primary/20"
                    {...field}
                  />
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
                <FormLabel className="font-semibold text-slate-700">
                  Archivos Adjuntos / Evidencia (Opcional)
                </FormLabel>
                <FormDescription>
                  Si posees correos, imágenes o documentos, por favor
                  adjúntalos aquí.
                </FormDescription>
                <FormControl>
                  <div className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-slate-300 border-dashed bg-slate-50 p-6 transition-colors hover:bg-slate-100">
                    <Input
                      type="file"
                      multiple
                      className="cursor-pointer file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
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

        <Separator className="bg-slate-200" />

        {/* SECCIÓN 5: Cierre */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-bold text-slate-800 text-xl">
              5. Cierre y Formalización
            </h3>
          </div>

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">
                  Observaciones adicionales (Opcional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[100px] border-slate-300 bg-white focus-visible:ring-primary/20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firmaAnonima"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border-2 border-slate-200 bg-slate-50/50 p-5 shadow-sm transition-colors hover:bg-slate-50">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="space-y-1.5 leading-none">
                  <FormLabel className="font-bold text-base text-slate-800">
                    Solicito anonimato / reserva de identidad
                  </FormLabel>
                  <FormDescription className="text-slate-600">
                    Entiendo que la ley me protege y solicito formalmente el
                    resguardo de mi identidad durante el proceso.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center pt-8 md:justify-end">
          <Button
            type="submit"
            disabled={isPending || !isReady}
            className="h-14 w-full px-10 font-bold text-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] md:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Enviando denuncia...
              </>
            ) : !isReady ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Cargando...
              </>
            ) : (
              "Ingresar Denuncia"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}