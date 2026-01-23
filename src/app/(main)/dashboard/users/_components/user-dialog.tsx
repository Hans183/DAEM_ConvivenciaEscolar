"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { AuthModel } from "pocketbase";

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

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            passwordConfirm: "",
            role: "User",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                role: user.role,
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
            });
        }
    }, [user, form]);

    const onSubmit = async (data: UserFormValues) => {
        setLoading(true);
        try {
            const payload: any = {
                name: data.name,
                email: data.email,
                role: data.role,
            };

            if (data.password) {
                payload.password = data.password;
                payload.passwordConfirm = data.passwordConfirm;
            }

            if (user) {
                await pb.collection("users").update(user.id, payload);
                toast.success("Usuario actualizado correctamente");
            } else {
                // Create new user
                // Ensure verified is true as per requirement
                payload.verified = true;
                // Password is required for new users
                if (!data.password) {
                    form.setError("password", { message: "La contraseña es obligatoria para nuevos usuarios" });
                    setLoading(false);
                    return;
                }

                await pb.collection("users").create(payload);
                toast.success("Usuario creado correctamente");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
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
