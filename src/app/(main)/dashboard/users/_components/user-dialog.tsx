"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createUserAction, type UpdateUserPayload, type UserRecord, updateUserAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFriendlyErrorMessage } from "@/lib/pb-error-handler";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

const userFormSchema = z
  .object({
    name: z.string().min(2, {
      message: "El nombre debe tener al menos 2 caracteres.",
    }),
    email: z.string().email({
      message: "Por favor ingrese un correo válido.",
    }),
    password: z
      .string()
      .min(8, {
        message: "La contraseña debe tener al menos 8 caracteres.",
      })
      .optional()
      .or(z.literal("")),
    passwordConfirm: z.string().optional().or(z.literal("")),
    role: z.string({
      required_error: "Por favor seleccione un rol.",
    }),
    establecimiento: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // If it's a new user (no ID logic handled outside, but here we assume if password is provided it must match)
      if (data.password && data.password !== data.passwordConfirm) {
        return false;
      }
      return true;
    },
    {
      message: "Las contraseñas no coinciden",
      path: ["passwordConfirm"],
    },
  );

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRecord | null;
  onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [establecimientos, setEstablecimientos] = useState<{ id: string; nombre: string }[]>([]);
  const [estComboboxOpen, setEstComboboxOpen] = useState(false);

  useEffect(() => {
    const fetchEstablecimientos = async () => {
      try {
        const records = await pb
          .collection("establecimientos")
          .getFullList<{ id: string; nombre: string }>({ sort: "nombre" });
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
      establecimiento: [],
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        establecimiento: Array.isArray(user.establecimiento)
          ? user.establecimiento
          : user.establecimiento
            ? [user.establecimiento]
            : [],
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
        establecimiento: [],
      });
    }
  }, [user, form]);

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    try {
      const establecimiento =
        Array.isArray(data.establecimiento) && data.establecimiento.length > 0 ? data.establecimiento : null;

      if (user) {
        const payload: UpdateUserPayload = {
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
        form.reset({
          name: "",
          email: "",
          password: "",
          passwordConfirm: "",
          role: "User",
          establecimiento: [],
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err);
      console.error("Error al guardar usuario:", err);
      toast.error(user ? "Error al actualizar usuario" : "Error al crear usuario", {
        description: message,
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
                      <SelectItem value="Itinerante">Itinerante</SelectItem>
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
                const role = form.watch("role");
                const isItinerante = role === "Itinerante";
                const valueArray = Array.isArray(field.value) ? field.value : [];

                let displayText = "Seleccione establecimiento(s)";
                if (valueArray.length > 0) {
                  if (valueArray.length === 1) {
                    const est = establecimientos.find((e) => e.id === valueArray[0]);
                    displayText = est ? est.nombre : "1 seleccionado";
                  } else {
                    displayText = `${valueArray.length} establecimientos seleccionados`;
                  }
                }

                return (
                  <FormItem>
                    <FormLabel>Establecimiento (Opcional)</FormLabel>
                    <Popover open={estComboboxOpen} onOpenChange={setEstComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal",
                              valueArray.length === 0 && "text-muted-foreground",
                            )}
                          >
                            <span className="truncate">{displayText}</span>
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
                                  field.onChange([]);
                                  setEstComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", valueArray.length === 0 ? "opacity-100" : "opacity-0")}
                                />
                                Sin establecimiento
                              </CommandItem>
                              {establecimientos.map((est) => {
                                const isSelected = valueArray.includes(est.id);
                                return (
                                  <CommandItem
                                    key={est.id}
                                    value={est.nombre}
                                    onSelect={() => {
                                      if (isItinerante) {
                                        if (isSelected) {
                                          field.onChange(valueArray.filter((v) => v !== est.id));
                                        } else {
                                          field.onChange([...valueArray, est.id]);
                                        }
                                      } else {
                                        field.onChange([est.id]);
                                        setEstComboboxOpen(false);
                                      }
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                    {est.nombre}
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
