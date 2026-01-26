"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { number, z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { pb } from "@/lib/pocketbase";
import type { EstablecimientoActivation} from "./establecimientos-columns";

const establecimientoFormSchema = z.object({
  nombre: z.string().min(1, {
    message: "El nombre es obligatorio.",
  }),
  rbd: z.string().min(1, {
    message: "El código es obligatorio.",
  }),
  direccion: z.string().min(1, {
    message: "La dirección es obligatoria.",
  }),
});

type EstablecimientoFormValues = z.infer<
  typeof establecimientoFormSchema
>;

interface EstablecimientoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establecimiento?: EstablecimientoActivation | null;
  onSuccess: () => void;
}

export function EstablecimientoDialog({
  open,
  onOpenChange,
  establecimiento,
  onSuccess,
}: EstablecimientoDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<EstablecimientoFormValues>({
    resolver: zodResolver(establecimientoFormSchema),
    defaultValues: {
      nombre: "",
      rbd: "",
      direccion: "",
    },
  });

  useEffect(() => {
    if (establecimiento) {
      form.reset({
        nombre: establecimiento.nombre,
        rbd: String(establecimiento.rbd),
        direccion: establecimiento.direccion,
      });
    } else {
      form.reset({
        nombre: "",
        rbd: "",
        direccion: "",
      });
    }
  }, [establecimiento, form]);

  const onSubmit = async (data: EstablecimientoFormValues) => {
    setLoading(true);
    try {
      if (establecimiento) {
        await pb
          .collection("establecimientos")
          .update(establecimiento.id, data);
        toast.success("Establecimiento actualizado correctamente");
      } else {
        await pb.collection("establecimientos").create(data);
        toast.success("Establecimiento creado correctamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(
        establecimiento
          ? "Error al actualizar establecimiento"
          : "Error al crear establecimiento",
        {
          description:
            error.message || "Por favor verifica los datos ingresados.",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {establecimiento ? "Editar Establecimiento" : "Agregar Establecimiento"}
          </DialogTitle>
          <DialogDescription>
            {establecimiento
              ? "Actualiza los datos del establecimiento."
              : "Crea un nuevo establecimiento."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del establecimiento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código */}
            <FormField
  control={form.control}
  name="rbd" 
  render={({ field }) => (
    <FormItem>
      <FormLabel>RBD</FormLabel>
      <FormControl>
        <Input 
  type="number" 
  {...field} 
  value={field.value ?? ''} 
  onChange={(e) => field.onChange(e.target.value)} 
/>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


            {/* Dirección */}
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <span className="mr-2 animate-spin">⏳</span>}
                {establecimiento ? "Guardar cambios" : "Crear establecimiento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
