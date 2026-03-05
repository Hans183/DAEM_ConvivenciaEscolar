"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { ClientResponseError } from "pocketbase";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

import type { ProtocolActivation } from "./columns";

// Esquema de validación
const protocolFormSchema = z.object({
  meses: z.string({
    required_error: "Por favor seleccione un mes.",
  }),
  cantidad: z.coerce.number().min(1, {
    message: "La cantidad debe ser al menos 1.",
  }),
  protocolo: z.string().min(1, {
    message: "El ID del protocolo es requerido.",
  }),
  establecimiento: z.string().optional(),
});

type ProtocolFormValues = z.infer<typeof protocolFormSchema>;

interface ProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol?: ProtocolActivation | null;
  onSuccess: () => void;
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Define type for Protocol
type Protocol = {
  id: string;
  item?: string;
  nombre?: string;
  name?: string;
};

type Establecimiento = {
  id: string;
  nombre: string;
};

export function ProtocolDialog({ open, onOpenChange, protocol, onSuccess }: ProtocolDialogProps) {
  // useUser() reads auth state safely client-side only (avoids hydration mismatch)
  const user = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const userEstablecimiento = user?.establecimiento as string | undefined;
  // Itinerantes need to choose establishing since they don't have a single fixed one
  const isItinerante = user?.role?.toLowerCase() === "itinerante";
  const hasGlobalAccess = isAdmin || isItinerante;

  const [loading, setLoading] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Cargar lista de protocolos
  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const records = await pb.collection("protocolos").getFullList();
        setProtocols(records as unknown as Protocol[]);
      } catch (error) {
        if (!(error instanceof ClientResponseError && error.isAbort)) {
          console.error("Failed to fetch protocols:", error);
          toast.error("Error al cargar lista de protocolos");
        }
      }
    };
    fetchProtocols();
  }, []);

  // Cargar establecimientos
  useEffect(() => {
    if (open) {
      pb.collection("establecimientos")
        .getFullList({ sort: "nombre" })
        .then((r) => {
          const allEstablecimientos = r as unknown as Establecimiento[];
          
          if (isAdmin) {
            setEstablecimientos(allEstablecimientos);
          } else if (isItinerante && user?.establecimiento) {
            // Assume user.establecimiento is an array of IDs for itinerante
            const assignedIds = Array.isArray(user.establecimiento) 
              ? user.establecimiento 
              : [user.establecimiento];
              
            setEstablecimientos(allEstablecimientos.filter(e => assignedIds.includes(e.id)));
          } else {
            // Standard/other roles, just load all to find their single name
            setEstablecimientos(allEstablecimientos);
          }
        })
        .catch(console.error);
    }
  }, [open, isAdmin, isItinerante, user]);

  // Configurar formulario
  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolFormSchema),
    defaultValues: {
      meses: "",
      cantidad: 0,
      protocolo: "",
      establecimiento: "",
    },
  });

  // Resetear formulario cuando cambia el protocolo
  useEffect(() => {
    const isCurrentlyOpen = open;
    if (isCurrentlyOpen) {
      if (protocol) {
        form.reset({
          meses: protocol.meses,
          cantidad: protocol.cantidad,
          protocolo: protocol.protocolo,
          establecimiento: protocol.establecimiento || "",
        });
      } else {
        form.reset({
          meses: "",
          cantidad: 0,
          protocolo: "",
          establecimiento: hasGlobalAccess ? "" : (userEstablecimiento ?? ""),
        });
      }
    }
  }, [form, protocol, open, hasGlobalAccess, userEstablecimiento]);

  // Enviar formulario
  const onSubmit = async (data: ProtocolFormValues) => {
    setLoading(true);
    try {
      const payload = {
        meses: data.meses,
        cantidad: data.cantidad,
        protocolo: data.protocolo,
        establecimiento: hasGlobalAccess ? data.establecimiento || null : userEstablecimiento || null,
      };
      if (protocol) {
        await pb.collection("activacion_protocolos").update(protocol.id, payload);
        toast.success("Registro actualizado correctamente");
      } else {
        await pb.collection("activacion_protocolos").create(payload);
        toast.success("Registro creado correctamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Por favor verifica los datos ingresados.";
      toast.error(protocol ? "Error al actualizar registro" : "Error al crear registro", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{protocol ? "Editar Registro" : "Agregar Registro"}</DialogTitle>
          <DialogDescription>
            {protocol
              ? "Actualiza los detalles de la activación de protocolo."
              : "Crea un nuevo registro de activación de protocolo."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Mes */}
            <FormField
              control={form.control}
              name="meses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mes</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un mes" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Cantidad */}
            <FormField
              control={form.control}
              name="cantidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Protocolo */}
            <FormField
              control={form.control}
              name="protocolo"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Protocolo</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                        >
                          {field.value
                            ? (() => {
                                const selected = protocols.find((p) => p.id === field.value);
                                const name = selected
                                  ? selected.item || selected.nombre || selected.name || selected.id
                                  : "Protocolo no encontrado";
                                return name.length > 50 ? `${name.slice(0, 50)}…` : name;
                              })()
                            : "Seleccione un protocolo"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[550px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar protocolo..." />
                        <CommandList onWheel={(e) => e.stopPropagation()}>
                          <CommandEmpty>No se encontraron protocolos.</CommandEmpty>
                          <CommandGroup>
                            {protocols.map((p) => {
                              const displayValue = p.item || p.nombre || p.name || p.id;
                              return (
                                <CommandItem
                                  value={displayValue}
                                  key={p.id}
                                  onSelect={() => {
                                    form.setValue("protocolo", p.id);
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn("mr-2 h-4 w-4", p.id === field.value ? "opacity-100" : "opacity-0")}
                                  />
                                  {displayValue}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Establecimiento */}
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
                                <SelectTrigger className={cn("mb-2 w-full", !selected && "text-muted-foreground")}>
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
                  {establecimientos.find((e) => e.id === userEstablecimiento)?.nombre ?? "Sin establecimiento asignado"}
                </p>
              </div>
            )}

            {/* Botones */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <span className="mr-2 animate-spin">⏳</span>}
                {protocol ? "Guardar cambios" : "Crear registro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
