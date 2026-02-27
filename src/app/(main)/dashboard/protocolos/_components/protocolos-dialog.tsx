"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Check, ChevronsUpDown } from "lucide-react";

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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { pb } from "@/lib/pocketbase";
import type { ProtocoloRecord } from "./protocolos-columns";

const protocoloFormSchema = z.object({
    nombre: z.string().min(1, {
        message: "El nombre es obligatorio.",
    }),
    descripcion: z.string().min(1, {
        message: "La descripción es obligatoria.",
    }),
    establecimiento: z.string().optional(),
});

type ProtocoloFormValues = z.infer<typeof protocoloFormSchema>;

interface ProtocoloDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    protocolo?: ProtocoloRecord | null;
    onSuccess: () => void;
    isAdmin: boolean;
    userEstablecimiento: string | null;
}

export function ProtocoloDialog({
    open,
    onOpenChange,
    protocolo,
    onSuccess,
    isAdmin,
    userEstablecimiento,
}: ProtocoloDialogProps) {
    const [loading, setLoading] = useState(false);
    const [establecimientos, setEstablecimientos] = useState<any[]>([]);
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        if (open) {
            // Always fetch establecimientos so the user's establishment name can be shown
            pb.collection("establecimientos")
                .getFullList({ sort: "nombre" })
                .then(setEstablecimientos)
                .catch(console.error);
        }
    }, [open]);

    const form = useForm<ProtocoloFormValues>({
        resolver: zodResolver(protocoloFormSchema),
        defaultValues: {
            nombre: "",
            descripcion: "",
            establecimiento: "",
        },
    });

    useEffect(() => {
        if (protocolo) {
            form.reset({
                nombre: protocolo.nombre,
                descripcion: protocolo.descripcion,
                establecimiento: protocolo.establecimiento || "",
            });
        } else {
            form.reset({
                nombre: "",
                descripcion: "",
                establecimiento: isAdmin ? "" : (userEstablecimiento ?? ""),
            });
        }
    }, [protocolo, form, isAdmin, userEstablecimiento]);

    const onSubmit = async (data: ProtocoloFormValues) => {
        setLoading(true);
        try {
            const payload = {
                nombre: data.nombre,
                descripcion: data.descripcion,
                establecimiento: isAdmin
                    ? (data.establecimiento || null)
                    : (userEstablecimiento || null),
            };

            if (protocolo) {
                await pb.collection("protocolos").update(protocolo.id, payload);
                toast.success("Protocolo actualizado correctamente");
            } else {
                await pb.collection("protocolos").create(payload);
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

                        {/* Establecimiento */}
                        {isAdmin ? (
                            <FormField
                                control={form.control}
                                name="establecimiento"
                                render={({ field }) => {
                                    const selected = establecimientos.find((e) => e.id === field.value);
                                    return (
                                        <FormItem>
                                            <FormLabel>Establecimiento</FormLabel>
                                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !selected && "text-muted-foreground",
                                                            )}
                                                        >
                                                            {selected ? selected.nombre : "Seleccione un establecimiento"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Buscar establecimiento..." />
                                                        <CommandList onWheel={(e) => e.stopPropagation()}>
                                                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                                            <CommandGroup>
                                                                {establecimientos.map((est) => (
                                                                    <CommandItem
                                                                        key={est.id}
                                                                        value={est.nombre}
                                                                        onSelect={() => {
                                                                            field.onChange(est.id);
                                                                            setPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", field.value === est.id ? "opacity-100" : "opacity-0")} />
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
                                    );
                                }}
                            />
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Establecimiento</p>
                                <p className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {establecimientos.find((e) => e.id === userEstablecimiento)?.nombre ?? "Sin establecimiento asignado"}
                                </p>
                            </div>
                        )}

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
