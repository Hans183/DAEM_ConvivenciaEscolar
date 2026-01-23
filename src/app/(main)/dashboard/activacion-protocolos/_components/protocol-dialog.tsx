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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { pb } from "@/lib/pocketbase";
import type { ProtocolActivation } from "./columns";

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
});

type ProtocolFormValues = z.infer<typeof protocolFormSchema>;

interface ProtocolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    protocol?: ProtocolActivation | null;
    onSuccess: () => void;
}

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Define type for Protocol
type Protocol = {
    id: string;
    item?: string;
    nombre?: string;
    name?: string;
};

export function ProtocolDialog({ open, onOpenChange, protocol, onSuccess }: ProtocolDialogProps) {
    const [loading, setLoading] = useState(false);
    const [protocols, setProtocols] = useState<Protocol[]>([]);

    useEffect(() => {
        const fetchProtocols = async () => {
            try {
                // Removed sort to prevent 400 error if field doesn't exist
                const records = await pb.collection("protocolos").getFullList();
                console.log("Protocolos fetched:", records); // Debug: Check this in console to see correct field name
                setProtocols(records as unknown as Protocol[]);
            } catch (error) {
                console.error("Failed to fetch protocols:", error);
                toast.error("Error al cargar lista de protocolos");
            }
        };
        fetchProtocols();
    }, []);

    const form = useForm<ProtocolFormValues>({
        resolver: zodResolver(protocolFormSchema),
        defaultValues: {
            meses: "",
            cantidad: 0,
            protocolo: "",
        },
    });

    useEffect(() => {
        if (protocol) {
            form.reset({
                meses: protocol.meses,
                cantidad: protocol.cantidad,
                protocolo: protocol.protocolo,
            });
        } else {
            form.reset({
                meses: "",
                cantidad: 0,
                protocolo: "",
            });
        }
    }, [protocol, form]);

    const onSubmit = async (data: ProtocolFormValues) => {
        setLoading(true);
        try {
            if (protocol) {
                await pb.collection("activacion_protocolos").update(protocol.id, data);
                toast.success("Registro actualizado correctamente");
            } else {
                await pb.collection("activacion_protocolos").create(data);
                toast.success("Registro creado correctamente");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(protocol ? "Error al actualizar registro" : "Error al crear registro", {
                description: error.message || "Por favor verifica los datos ingresados.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
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
                        <FormField
                            control={form.control}
                            name="cantidad"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cantidad</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="protocolo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Protocolo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un protocolo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {protocols.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.item || p.nombre || p.name || p.id}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
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
