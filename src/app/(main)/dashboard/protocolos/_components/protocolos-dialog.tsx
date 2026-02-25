"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pb } from "@/lib/pocketbase";
import type { ProtocoloRecord } from "./protocolos-columns";

const protocoloFormSchema = z.object({
    nombre: z.string().min(1, {
        message: "El nombre es obligatorio.",
    }),
    descripcion: z.string().min(1, {
        message: "La descripción es obligatoria.",
    }),
});

type ProtocoloFormValues = z.infer<typeof protocoloFormSchema>;

interface ProtocoloDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    protocolo?: ProtocoloRecord | null;
    onSuccess: () => void;
}

export function ProtocoloDialog({
    open,
    onOpenChange,
    protocolo,
    onSuccess,
}: ProtocoloDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ProtocoloFormValues>({
        resolver: zodResolver(protocoloFormSchema),
        defaultValues: {
            nombre: "",
            descripcion: "",
        },
    });

    useEffect(() => {
        if (protocolo) {
            form.reset({
                nombre: protocolo.nombre,
                descripcion: protocolo.descripcion,
            });
        } else {
            form.reset({
                nombre: "",
                descripcion: "",
            });
        }
    }, [protocolo, form]);

    const onSubmit = async (data: ProtocoloFormValues) => {
        setLoading(true);
        try {
            if (protocolo) {
                await pb.collection("protocolos").update(protocolo.id, data);
                toast.success("Protocolo actualizado correctamente");
            } else {
                await pb.collection("protocolos").create(data);
                toast.success("Protocolo creado correctamente");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(
                protocolo
                    ? "Error al actualizar protocolo"
                    : "Error al crear protocolo",
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {protocolo ? "Editar Protocolo" : "Agregar Protocolo"}
                    </DialogTitle>
                    <DialogDescription>
                        {protocolo
                            ? "Actualiza los datos del protocolo."
                            : "Crea un nuevo protocolo rellenando este formulario."}
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
                                        <Input placeholder="Nombre del protocolo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Descripción */}
                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Agrega una descripción para este protocolo..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
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
                                {protocolo ? "Guardar cambios" : "Crear protocolo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
