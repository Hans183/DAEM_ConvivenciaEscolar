"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRecaptcha } from "@/hooks/use-recaptcha";
import { getFriendlyErrorMessage } from "@/lib/pb-error-handler";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { executeRecaptcha, isReady } = useRecaptcha();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      // 1. Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha("login");

      // 2. Call the API Route which verifies reCAPTCHA server-side then logs in
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          recaptchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Error al iniciar sesión", {
          description: result.error || "Por favor verifica tus credenciales e intenta de nuevo.",
        });
        return;
      }

      // 3. Apply the cookie returned from the server (same as original flow)
      if (result.cookie) {
        document.cookie = result.cookie;
      }

      toast.success("¡Sesión iniciada correctamente!");
      window.location.href = "/dashboard";
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      toast.error("Error al iniciar sesión", {
        description: message || "Por favor verifica tus credenciales e intenta de nuevo.",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-4"
                />
              </FormControl>
              <FormLabel htmlFor="login-remember" className="ml-1 font-medium text-muted-foreground text-sm">
                Recordarme por 30 días
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isSubmitting || !isReady}>
          {isSubmitting ? "Iniciando sesión..." : !isReady ? "Cargando..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}
