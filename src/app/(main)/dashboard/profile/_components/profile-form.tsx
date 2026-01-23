"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { pb } from "@/lib/pocketbase";

// Schema similar to user-dialog but without 'role'
const profileFormSchema = z.object({
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
}).refine((data) => {
    if (data.password && data.password !== data.passwordConfirm) {
        return false;
    }
    return true;
}, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
    const [loading, setLoading] = useState(false);
    // userId will be fetched from authStore
    const user = pb.authStore.model;

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            passwordConfirm: "",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                password: "",
                passwordConfirm: "",
            });
        }
    }, [user?.id, user?.updated, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        setLoading(true);
        try {
            const payload: any = {
                name: data.name,
                email: data.email,
            };

            if (data.password) {
                payload.password = data.password;
                payload.passwordConfirm = data.passwordConfirm;
            }

            await pb.collection("users").update(user.id, payload);
            // Refresh auth store if needed, though update usually handles it 
            // if we were editing the current user via collection auth refresh. 
            // But pb.authStore.model is updated automatically if we listen to changes or manually refresh.
            // Let's manually refresh to be safe or re-auth, but update returns the record.
            // Actually, usually just updating the record is enough if it's the same record.

            toast.success("Perfil actualizado correctamente");

            // Optional: reset password fields
            form.setValue("password", "");
            form.setValue("passwordConfirm", "");

        } catch (error: any) {
            console.error(error);
            toast.error("Error al actualizar perfil", {
                description: error.message || "Por favor verifica los datos ingresados.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                                <Input placeholder="Tu nombre" {...field} />
                            </FormControl>
                            <FormDescription>
                                Este es tu nombre público.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input placeholder="correo@ejemplo.com" type="email" {...field} />
                            </FormControl>
                            <FormDescription>
                                Tu correo para iniciar sesión.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nueva Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Deja en blanco para no cambiar" {...field} />
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
                                    <Input type="password" placeholder="Repite la nueva contraseña" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={loading}>
                    {loading && <span className="mr-2 animate-spin">⏳</span>}
                    Guardar Cambios
                </Button>
            </form>
        </Form>
    );
}
