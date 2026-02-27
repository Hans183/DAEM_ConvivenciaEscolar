"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { AuthModel } from "pocketbase";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { createUserAction, updateUserAction } from "@/app/actions/users";

const userFormSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Por favor ingrese un correo válido.",
    }),
    password: z.string().min(8, {
        message: "La contraseña debe tener al menos 8 caracteres.",
    }).optional().or(z.literal("")),
    passwordConfirm: z.string().optional().or(z.literal("")),
    role: z.string({
        required_error: "Por favor seleccione un rol.",
    }),
    establecimiento: z.string().optional(),
}).refine((data) => {
    // If it's a new user (no ID logic handled outside, but here we assume if password is provided it must match)
    if (data.password && data.password !== data.passwordConfirm) {
        return false;
    }
    return true;
}, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: AuthModel | null;
    onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [establecimientos, setEstablecimientos] = useState<any[]>([]);

    useEffect(() => {
        const fetchEstablecimientos = async () => {
            try {
                const records = await pb.collection("establecimientos").getFullList({ sort: "nombre" });
                setEstablecimientos(records);
            } catch (error) {
                console.error("Failed to fetch establecimientos", error);
            }
        };
        if (open) {
            fetchEstablecimientos();
        }
    }, [open]);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            passwordConfirm: "",
            role: "User",
            establecimiento: "",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                role: user.role,
                establecimiento: user.establecimiento || "none",
                password: "",
                passwordConfirm: "",
            });
        } else {
            form.reset({
                name: "",
                email: "",
                password: "",
                passwordConfirm: "",
                role: "User",
                establecimiento: "none",
            });
        }
    }, [user, form]);

    const onSubmit = async (data: UserFormValues) => {
        setLoading(true);
        try {
            const establecimiento = (data.establecimiento && data.establecimiento !== "none")
                ? data.establecimiento
                : null;

            if (user) {
                const payload: any = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    establecimiento,
                    emailVisibility: true,
                };
                if (data.password) {
                    payload.password = data.password;
                    payload.passwordConfirm = data.passwordConfirm;
                }
                const result = await updateUserAction(user.id, payload);
                if (!result.success) throw new Error(result.error);
                toast.success("Usuario actualizado correctamente");
            } else {
                if (!data.password) {
                    form.setError("password", { message: "La contraseña es obligatoria para nuevos usuarios" });
                    setLoading(false);
                    return;
                }
                const result = await createUserAction({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    passwordConfirm: data.passwordConfirm ?? data.password,
                    role: data.role,
                    establecimiento,
                    emailVisibility: true,
                });
                if (!result.success) throw new Error(result.error);
                toast.success("Usuario creado y verificado correctamente");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error al guardar usuario:", error);
            toast.error(user ? "Error al actualizar usuario" : "Error al crear usuario", {
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
                    <DialogTitle>{user ? "Editar Usuario" : "Agregar Usuario"}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? "Actualiza los detalles del usuario. Deja la contraseña en blanco para mantener la actual."
                            : "Crea un nuevo usuario. Será verificado automáticamente."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="juan@ejemplo.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder={user ? "********" : "Requerido"} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="passwordConfirm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirmar Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder={user ? "********" : "Requerido"} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="User">Usuario</SelectItem>
                                            <SelectItem value="Admin">Administrador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="establecimiento"
                            render={({ field }) => {
                                const [popoverOpen, setPopoverOpen] = useState(false);
                                const selectedEst = establecimientos.find((e) => e.id === field.value);
                                return (
                                    <FormItem>
                                        <FormLabel>Establecimiento (Opcional)</FormLabel>
                                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between font-normal",
                                                            !selectedEst && "text-muted-foreground",
                                                        )}
                                                    >
                                                        {selectedEst ? selectedEst.nombre : "Seleccione un establecimiento"}
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
                                                            <CommandItem
                                                                value="none"
                                                                onSelect={() => {
                                                                    field.onChange("none");
                                                                    setPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", field.value === "none" || !field.value ? "opacity-100" : "opacity-0")} />
                                                                Sin establecimiento
                                                            </CommandItem>
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
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <span className="mr-2 animate-spin">⏳</span>}
                                {user ? "Guardar cambios" : "Crear usuario"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
