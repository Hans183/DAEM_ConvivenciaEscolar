"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import type { DecRecord } from "./columns";

const antecedentesOptions = [
    "Nada.",
    "Se le pide que haga la tarea.",
    "Momento de ocio.",
    "Se le llama la atención por indisciplina en aula.",
    "Conflicto con estudiante",
    "Conflicto con profesor  o asistente de la red.",
    "Otra:"
];

const conductasOptions = [
    "Agresión física: ¿a quién?",
    "Autoagresión.",
    "Se escapa o corre.",
    "Negativismo.",
    "Tira y/o rompe cosas.",
    "Escupe.",
    "Quita cosas.",
    "Otro:"
];

const consecuentesOptions = [
    "Se tranquiliza solo.",
    "Es reconducido  a la actividad inicial.",
    "Es reprendido.",
    "Se realiza tiempo fuera (dentro del aula, en un lugar reservado para reflexionar, separado del grupo).",
    "Se le cambia la actividad.",
    "Se ignora.",
    "Se aplica reglamento interno: sanción formativa(alternativa).",
    "Se acuerda entre familia  y escuela, reducción de jornada.",
    "Se aplica reglamento interno: sanción regular.",
    "Se solicita presencia de apoderado en establecimiento.",
    "Se solicita apoyo de centro asistencial.",
    "Se solicita retirar al estudiante del establecimiento educacional.",
    "Otro:"
];

// Helper for arrays: comma-separated string to array
const commaSeparatedString = z.string().optional().transform((val) => {
    if (!val) return [];
    return val.split(",").map((v) => v.trim()).filter(Boolean);
});

const decFormSchema = z.object({
    dia: z.string().min(1, "La fecha es requerida"),
    nombre_estudiante: z.string().min(1, "Requerido"),
    edad_estudiante: z.coerce.number().min(1, "Requerido"),
    curso_estudiante: z.string().min(1, "Requerido"),
    profe_jefe_estudiante: z.string().min(1, "Requerido"),
    nombre_apoderado: z.string().min(1, "Requerido"),
    fono_apoderado: z.string().min(1, "Requerido"),
    encargado_pi: z.string().min(1, "Requerido"),
    acompanante_interno_pi: z.string().min(1, "Requerido"),
    acompanante_externo_pi: z.string().min(1, "Requerido"),
    hora: z.string().min(1, "Requerido"),
    hora_otro: z.string().optional(),
    asignaturas: z.string().min(1, "Requerido"),
    asignatura_otra: z.string().optional(),
    antecedentes: z.any().transform((val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === "string") return val.split(",").map((v) => v.trim()).filter(Boolean);
        return [];
    }),
    ConflictoConEstudiante_antecedentes: z.string().optional(),
    ConflictoConProfesor_antecedentes: z.string().optional(),
    otra_antecedentes: z.string().optional(),
    conductas: z.any().transform((val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === "string") return val.split(",").map((v) => v.trim()).filter(Boolean);
        return [];
    }),
    Agresion_fisica_conductas: z.string().optional(),
    otro_conductas: z.string().optional(),
    descripcion_conductas: z.string().optional(),
    duracion_conductas: z.string().optional(),
    consecuentes: z.any().transform((val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === "string") return val.split(",").map((v) => v.trim()).filter(Boolean);
        return [];
    }),
    otro_consecuentes: z.string().optional(),
    funciona_medida: z.boolean().default(false),
    propuesta_mejora: z.string().optional(),
    establecimiento: z.string().optional(),
    nivel_dec: z.string().optional(),
});

type DecFormValues = z.infer<typeof decFormSchema>;

interface DecDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record?: DecRecord | null;
    onSuccess: () => void;
}

type Establecimiento = {
    id: string;
    nombre: string;
};

export function DecDialog({ open, onOpenChange, record, onSuccess }: DecDialogProps) {
    // Auth state
    const currentUser = pb.authStore.model;
    const isAdmin = currentUser?.role?.toLowerCase() === "admin";
    const userEstablecimiento: string | null = currentUser?.establecimiento ?? null;

    const [loading, setLoading] = useState(false);
    const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
    const [estComboboxOpen, setEstComboboxOpen] = useState(false);
    const [antecedentesOpen, setAntecedentesOpen] = useState(false);
    const [conductasOpen, setConductasOpen] = useState(false);
    const [consecuentesOpen, setConsecuentesOpen] = useState(false);

    // Cargar establecimientos siempre (para mostrar el nombre en modo lectura)
    useEffect(() => {
        if (open) {
            pb.collection("establecimientos")
                .getFullList({ sort: "nombre" })
                .then((r) => setEstablecimientos(r as unknown as Establecimiento[]))
                .catch(console.error);
        }
    }, [open]);

    const form = useForm<any>({
        resolver: zodResolver(decFormSchema),
        defaultValues: {
            dia: new Date().toISOString().slice(0, 16),
            nombre_estudiante: "",
            edad_estudiante: 0,
            curso_estudiante: "",
            profe_jefe_estudiante: "",
            nombre_apoderado: "",
            fono_apoderado: "",
            encargado_pi: "",
            acompanante_interno_pi: "",
            acompanante_externo_pi: "",
            hora: "",
            hora_otro: "",
            asignaturas: "",
            asignatura_otra: "",
            antecedentes: [],
            ConflictoConEstudiante_antecedentes: "",
            ConflictoConProfesor_antecedentes: "",
            otra_antecedentes: "",
            conductas: [],
            Agresion_fisica_conductas: "",
            otro_conductas: "",
            descripcion_conductas: "",
            duracion_conductas: "",
            consecuentes: [],
            otro_consecuentes: "",
            funciona_medida: false,
            propuesta_mejora: "",
            establecimiento: "",
            nivel_dec: "",
        },
    });

    useEffect(() => {
        if (record) {
            form.reset({
                ...record,
                dia: record.dia ? new Date(record.dia).toISOString().slice(0, 16) : "",
                antecedentes: Array.isArray(record.antecedentes) ? record.antecedentes : [],
                conductas: Array.isArray(record.conductas) ? record.conductas : [],
                consecuentes: Array.isArray(record.consecuentes) ? record.consecuentes : [],
                establecimiento: record.establecimiento || "",
                nivel_dec: record.nivel_dec || "",
            });
        } else {
            form.reset({
                dia: new Date().toISOString().slice(0, 16),
                nombre_estudiante: "",
                edad_estudiante: 0,
                curso_estudiante: "",
                profe_jefe_estudiante: "",
                nombre_apoderado: "",
                fono_apoderado: "",
                encargado_pi: "",
                acompanante_interno_pi: "",
                acompanante_externo_pi: "",
                hora: "",
                hora_otro: "",
                asignaturas: "",
                asignatura_otra: "",
                antecedentes: [],
                ConflictoConEstudiante_antecedentes: "",
                ConflictoConProfesor_antecedentes: "",
                otra_antecedentes: "",
                conductas: [],
                Agresion_fisica_conductas: "",
                otro_conductas: "",
                descripcion_conductas: "",
                duracion_conductas: "",
                consecuentes: [],
                otro_consecuentes: "",
                funciona_medida: false,
                propuesta_mejora: "",
                establecimiento: isAdmin ? "" : (userEstablecimiento ?? ""),
                nivel_dec: "",
            });
        }
    }, [record, form, open, isAdmin, userEstablecimiento]);

    const onSubmit = async (data: DecFormValues) => {
        setLoading(true);
        try {
            const submitData = {
                ...data,
                dia: new Date(data.dia).toISOString(),
                establecimiento: isAdmin
                    ? (data.establecimiento || null)
                    : (userEstablecimiento || null),
            };

            if (record) {
                await pb.collection("DEC").update(record.id, submitData);
                toast.success("Registro actualizado correctamente");
            } else {
                await pb.collection("DEC").create(submitData);
                toast.success("Registro creado correctamente");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Full error object:", error);
            console.error("Response data:", error.response?.data);

            let errorMessage = error.message || "Por favor verifica los datos ingresados.";
            if (error.response?.data) {
                errorMessage = "Error PB: " + JSON.stringify(error.response.data);
            }

            toast.error(record ? "Error al actualizar registro" : "Error al crear registro", {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const [step, setStep] = useState(1);
    const totalSteps = 4;

    useEffect(() => {
        if (open) {
            setStep(1); // Reset step when opening
        }
    }, [open]);

    const nextStep = () => {
        // Partial validation here if needed, or simply proceed
        setStep(Math.min(step + 1, totalSteps));
    };

    const prevStep = () => {
        setStep(Math.max(step - 1, 1));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-6 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle>{record ? "Editar DEC" : "Nuevo DEC"}</DialogTitle>
                            <DialogDescription>
                                {record
                                    ? "Actualiza los detalles del Documento de Entrevista y Compromiso."
                                    : "Crea un nuevo Documento de Entrevista y Compromiso."}
                            </DialogDescription>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            Paso {step} de {totalSteps}
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6">
                            <div className="space-y-6">
                                {/* PASO 1: Datos Generales y Personal */}
                                {step === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium border-b pb-2">Datos Generales</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Campo Establecimiento */}
                                                {isAdmin ? (
                                                    <FormField
                                                        control={form.control}
                                                        name="establecimiento"
                                                        render={({ field }) => {
                                                            const selected = establecimientos.find((e) => e.id === field.value);
                                                            return (
                                                                <FormItem className="flex flex-col">
                                                                    <FormLabel>Establecimiento</FormLabel>
                                                                    <Popover open={estComboboxOpen} onOpenChange={setEstComboboxOpen}>
                                                                        <PopoverTrigger asChild>
                                                                            <FormControl>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    role="combobox"
                                                                                    className={cn(
                                                                                        "w-full justify-between",
                                                                                        !selected && "text-muted-foreground"
                                                                                    )}
                                                                                >
                                                                                    {selected ? selected.nombre : "Seleccione un establecimiento"}
                                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                </Button>
                                                                            </FormControl>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-[600px] p-0" align="start">
                                                                            <Command>
                                                                                <CommandInput placeholder="Buscar establecimiento..." />
                                                                                <CommandList onWheel={(e) => e.stopPropagation()}>
                                                                                    <CommandEmpty>No se encontraron establecimientos.</CommandEmpty>
                                                                                    <CommandGroup>
                                                                                        {establecimientos.map((est) => (
                                                                                            <CommandItem
                                                                                                key={est.id}
                                                                                                value={est.nombre}
                                                                                                onSelect={() => {
                                                                                                    form.setValue("establecimiento", est.id);
                                                                                                    setEstComboboxOpen(false);
                                                                                                }}
                                                                                            >
                                                                                                <Check
                                                                                                    className={cn(
                                                                                                        "mr-2 h-4 w-4",
                                                                                                        est.id === field.value ? "opacity-100" : "opacity-0"
                                                                                                    )}
                                                                                                />
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
                                                <FormField control={form.control} name="dia" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Fecha y Hora (Día)</FormLabel>
                                                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="hora" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bloque/Hora</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccione un bloque" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="8:00 - 9:30">8:00 - 9:30</SelectItem>
                                                                <SelectItem value="Recreo 1">Recreo 1</SelectItem>
                                                                <SelectItem value="09:45-11:20">09:45 - 11:20</SelectItem>
                                                                <SelectItem value="Recreo 2">Recreo 2</SelectItem>
                                                                <SelectItem value="11:30-13:00">11:30 - 13:00</SelectItem>
                                                                <SelectItem value="Colacion">Colación</SelectItem>
                                                                <SelectItem value="Otro">Otro</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="asignaturas" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Asignatura(s)</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccione una asignatura" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Lenguaje">Lenguaje</SelectItem>
                                                                <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                                                                <SelectItem value="Cs. Naturales">Cs. Naturales</SelectItem>
                                                                <SelectItem value="Historia y Cs Sociales">Historia y Cs Sociales</SelectItem>
                                                                <SelectItem value="Inglés">Inglés</SelectItem>
                                                                <SelectItem value="Artes Visuales">Artes Visuales</SelectItem>
                                                                <SelectItem value="Música">Música</SelectItem>
                                                                <SelectItem value="Educación Física">Educación Física</SelectItem>
                                                                <SelectItem value="Religión">Religión</SelectItem>
                                                                <SelectItem value="Tecnología">Tecnología</SelectItem>
                                                                <SelectItem value="Lengua Indígena">Lengua Indígena</SelectItem>
                                                                <SelectItem value="Otra:">Otra:</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                {/* Campos condicionales: siempre al final, col-span-2 */}
                                                {form.watch("hora") === "Otro" && (
                                                    <FormField control={form.control} name="hora_otro" render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel>Especificar bloque/hora</FormLabel>
                                                            <FormControl><Input placeholder="Ingrese el bloque u hora" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                )}
                                                {form.watch("asignaturas") === "Otra:" && (
                                                    <FormField control={form.control} name="asignatura_otra" render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel>Especificar asignatura</FormLabel>
                                                            <FormControl><Input placeholder="Ingrese la asignatura" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium border-b pb-2">Nivel DEC</h3>
                                            <FormField control={form.control} name="nivel_dec" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nivel de intensidad de la DEC:</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccione el nivel" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Nivel 1">Nivel 1:(Puede regularse dentro de la sala, intensidad baja)</SelectItem>
                                                            <SelectItem value="Nivel 2">Nivel 2:(Ausencia de autocontrol, intensidad media,P.E:fuga, rabieta o gritos no dirigidos)</SelectItem>
                                                            <SelectItem value="Nivel 3">Nivel 3:(Descontrol con riesgo para si mismo y terceros)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium border-b pb-2">Personal a Cargo</h3>

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="encargado_pi" render={({ field }) => (
                                                    <FormItem><FormLabel>Encargado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="acompanante_interno_pi" render={({ field }) => (
                                                    <FormItem><FormLabel>Acompañante Interno</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="acompanante_externo_pi" render={({ field }) => (
                                                    <FormItem className="col-span-2"><FormLabel>Acompañante Externo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 2: Estudiante, Apoderado y Antecedentes */}
                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium border-b pb-2">Estudiante y Apoderado</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="nombre_estudiante" render={({ field }) => (
                                                    <FormItem><FormLabel>Nombre Estudiante</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="edad_estudiante" render={({ field }) => (
                                                    <FormItem><FormLabel>Edad</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="curso_estudiante" render={({ field }) => (
                                                    <FormItem><FormLabel>Curso</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="profe_jefe_estudiante" render={({ field }) => (
                                                    <FormItem><FormLabel>Profesor Jefe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="nombre_apoderado" render={({ field }) => (
                                                    <FormItem><FormLabel>Nombre Apoderado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="fono_apoderado" render={({ field }) => (
                                                    <FormItem><FormLabel>Teléfono Apoderado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                        </div>


                                        <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-medium border-b pb-2">Gatillante de la DEC</h3>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <FormField control={form.control} name="antecedentes" render={({ field }) => {
                                                        const selected: string[] = Array.isArray(field.value) ? field.value : [];
                                                        return (
                                                            <FormItem className="flex flex-col">
                                                                <FormLabel>¿Qué estaba haciendo el estudiante?</FormLabel>
                                                                <Popover open={antecedentesOpen} onOpenChange={setAntecedentesOpen}>
                                                                    <PopoverTrigger asChild>
                                                                        <FormControl>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                role="combobox"
                                                                                className={cn("w-full min-h-10 h-auto justify-start flex-wrap gap-1 py-2", selected.length === 0 && "text-muted-foreground")}
                                                                            >
                                                                                {selected.length === 0 ? (
                                                                                    <span>Seleccione antecedentes...</span>
                                                                                ) : (
                                                                                    selected.map((item) => (
                                                                                        <Badge
                                                                                            key={item}
                                                                                            variant="secondary"
                                                                                            className="text-xs"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                field.onChange(selected.filter((v) => v !== item));
                                                                                            }}
                                                                                        >
                                                                                            {item.length > 30 ? item.slice(0, 30) + "…" : item}
                                                                                            <X className="ml-1 h-3 w-3 cursor-pointer" />
                                                                                        </Badge>
                                                                                    ))
                                                                                )}
                                                                            </Button>
                                                                        </FormControl>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[620px] p-0" align="start">
                                                                        <Command>
                                                                            <CommandInput placeholder="Buscar antecedente..." />
                                                                            <CommandList onWheel={(e) => e.stopPropagation()}>
                                                                                <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {antecedentesOptions.map((item) => (
                                                                                        <CommandItem
                                                                                            key={item}
                                                                                            value={item}
                                                                                            onSelect={() => {
                                                                                                const next = selected.includes(item)
                                                                                                    ? selected.filter((v) => v !== item)
                                                                                                    : [...selected, item];
                                                                                                field.onChange(next);
                                                                                            }}
                                                                                        >
                                                                                            <Check className={cn("mr-2 h-4 w-4", selected.includes(item) ? "opacity-100" : "opacity-0")} />
                                                                                            {item}
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
                                                    }} />
                                                    {(form.watch("antecedentes") ?? []).includes("Otra:") && (
                                                        <FormField control={form.control} name="otra_antecedentes" render={({ field }) => (
                                                            <FormItem><FormLabel>Especificar otro antecedente</FormLabel><FormControl><Input placeholder="Ingrese el antecedente" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    )}
                                                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                        <FormField control={form.control} name="ConflictoConEstudiante_antecedentes" render={({ field }) => (
                                                            <FormItem><FormLabel>Detalles Estudiante(s) (Si aplica)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="ConflictoConProfesor_antecedentes" render={({ field }) => (
                                                            <FormItem><FormLabel>Detalles Profesor (Si aplica)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 3: Conductas */}
                                {step === 3 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium border-b pb-2">Conductas</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <FormField control={form.control} name="conductas" render={({ field }) => {
                                                    const selected: string[] = Array.isArray(field.value) ? field.value : [];
                                                    return (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>¿Como responde a lo que se le pide?</FormLabel>
                                                            <Popover open={conductasOpen} onOpenChange={setConductasOpen}>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            className={cn("w-full min-h-10 h-auto justify-start flex-wrap gap-1 py-2", selected.length === 0 && "text-muted-foreground")}
                                                                        >
                                                                            {selected.length === 0 ? (
                                                                                <span>Seleccione conductas...</span>
                                                                            ) : (
                                                                                selected.map((item) => (
                                                                                    <Badge
                                                                                        key={item}
                                                                                        variant="secondary"
                                                                                        className="text-xs"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            field.onChange(selected.filter((v) => v !== item));
                                                                                        }}
                                                                                    >
                                                                                        {item.length > 30 ? item.slice(0, 30) + "…" : item}
                                                                                        <X className="ml-1 h-3 w-3 cursor-pointer" />
                                                                                    </Badge>
                                                                                ))
                                                                            )}
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[620px] p-0" align="start">
                                                                    <Command>
                                                                        <CommandInput placeholder="Buscar conducta..." />
                                                                        <CommandList onWheel={(e) => e.stopPropagation()}>
                                                                            <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {conductasOptions.map((item) => (
                                                                                    <CommandItem
                                                                                        key={item}
                                                                                        value={item}
                                                                                        onSelect={() => {
                                                                                            const next = selected.includes(item)
                                                                                                ? selected.filter((v) => v !== item)
                                                                                                : [...selected, item];
                                                                                            field.onChange(next);
                                                                                        }}
                                                                                    >
                                                                                        <Check className={cn("mr-2 h-4 w-4", selected.includes(item) ? "opacity-100" : "opacity-0")} />
                                                                                        {item}
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
                                                }} />
                                                {(form.watch("conductas") ?? []).includes("Otro:") && (
                                                    <FormField control={form.control} name="otro_conductas" render={({ field }) => (
                                                        <FormItem><FormLabel>Especificar otra conducta</FormLabel><FormControl><Input placeholder="Ingrese la conducta" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                )}
                                                {(form.watch("conductas") ?? []).includes("Agresión física:¿a quién?") && (
                                                    <FormField control={form.control} name="Agresion_fisica_conductas" render={({ field }) => (
                                                        <FormItem><FormLabel>¿A quién agredió?</FormLabel><FormControl><Input placeholder="Especifique a quién" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                )}
                                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                    <FormField control={form.control} name="duracion_conductas" render={({ field }) => (
                                                        <FormItem><FormLabel>Duración de la conducta</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione duración" /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="10 a 30 Minutos">10 a 30 Minutos</SelectItem>
                                                                    <SelectItem value="30 a 60 Minutos">30 a 60 Minutos</SelectItem>
                                                                    <SelectItem value="Mas de 1 hora">Más de 1 hora</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="descripcion_conductas" render={({ field }) => (
                                                        <FormItem className="col-span-2"><FormLabel>Descripción Adicional</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 4: Consecuentes */}
                                {step === 4 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium border-b pb-2">Consecuencias y Medidas</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <FormField control={form.control} name="consecuentes" render={({ field }) => {
                                                    const selected: string[] = Array.isArray(field.value) ? field.value : [];
                                                    return (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>Seleccione los Consecuentes</FormLabel>
                                                            <Popover open={consecuentesOpen} onOpenChange={setConsecuentesOpen}>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            className={cn("w-full min-h-10 h-auto justify-start flex-wrap gap-1 py-2", selected.length === 0 && "text-muted-foreground")}
                                                                        >
                                                                            {selected.length === 0 ? (
                                                                                <span>Seleccione consecuentes...</span>
                                                                            ) : (
                                                                                selected.map((item) => (
                                                                                    <Badge
                                                                                        key={item}
                                                                                        variant="secondary"
                                                                                        className="text-xs"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            field.onChange(selected.filter((v) => v !== item));
                                                                                        }}
                                                                                    >
                                                                                        {item.length > 30 ? item.slice(0, 30) + "…" : item}
                                                                                        <X className="ml-1 h-3 w-3 cursor-pointer" />
                                                                                    </Badge>
                                                                                ))
                                                                            )}
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[620px] p-0" align="start">
                                                                    <Command>
                                                                        <CommandInput placeholder="Buscar consecuente..." />
                                                                        <CommandList onWheel={(e) => e.stopPropagation()}>
                                                                            <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {consecuentesOptions.map((item) => (
                                                                                    <CommandItem
                                                                                        key={item}
                                                                                        value={item}
                                                                                        onSelect={() => {
                                                                                            const next = selected.includes(item)
                                                                                                ? selected.filter((v) => v !== item)
                                                                                                : [...selected, item];
                                                                                            field.onChange(next);
                                                                                        }}
                                                                                    >
                                                                                        <Check className={cn("mr-2 h-4 w-4", selected.includes(item) ? "opacity-100" : "opacity-0")} />
                                                                                        {item}
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
                                                }} />
                                                {(form.watch("consecuentes") ?? []).includes("Otro:") && (
                                                    <FormField control={form.control} name="otro_consecuentes" render={({ field }) => (
                                                        <FormItem><FormLabel>Especificar otro consecuente</FormLabel><FormControl><Input placeholder="Ingrese el consecuente" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                )}
                                                <FormField control={form.control} name="funciona_medida" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-base font-semibold">¿Funciona la Medida tomada?</FormLabel>
                                                        <div className="flex gap-3 pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => field.onChange(true)}
                                                                className={cn(
                                                                    "flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all duration-200",
                                                                    field.value === true
                                                                        ? "border-green-500 bg-green-500 text-white shadow-md"
                                                                        : "border-border bg-background text-muted-foreground hover:border-green-400 hover:text-green-600"
                                                                )}
                                                            >
                                                                ✓ Sí
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => field.onChange(false)}
                                                                className={cn(
                                                                    "flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all duration-200",
                                                                    field.value === false
                                                                        ? "border-red-500 bg-red-500 text-white shadow-md"
                                                                        : "border-border bg-background text-muted-foreground hover:border-red-400 hover:text-red-600"
                                                                )}
                                                            >
                                                                ✗ No
                                                            </button>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="propuesta_mejora" render={({ field }) => (
                                                    <FormItem><FormLabel>Propuesta de Mejora</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className="p-6 border-t bg-muted/20 mt-auto">
                            <div className="flex justify-between w-full items-center">
                                {/* Zona Botón Cancelar/Anterior */}
                                <div>
                                    {step > 1 ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={prevStep}
                                            disabled={loading}
                                        >
                                            Paso Anterior
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => onOpenChange(false)}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                </div>

                                {/* Puntos indicadores opcionales de progreso */}
                                <div className="flex gap-1.5 px-4 hidden sm:flex">
                                    {Array.from({ length: totalSteps }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-2 rounded-full transition-all ${step === i + 1
                                                ? 'w-6 bg-primary'
                                                : step > i + 1
                                                    ? 'w-2 bg-primary/60'
                                                    : 'w-2 bg-muted-foreground/20'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Zona Botón Siguiente/Guardar */}
                                <div>
                                    {step < totalSteps ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={loading}
                                        >
                                            Siguiente Paso
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={form.handleSubmit(onSubmit)}
                                            disabled={loading}
                                        >
                                            {loading && <span className="mr-2 animate-spin">⏳</span>}
                                            {record ? "Guardar cambios" : "Crear registro DEC"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
