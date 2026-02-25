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
import type { DecRecord } from "./columns";

const antecedentesOptions = [
    "Nada.",
    "Se le pide que haga la tarea",
    "Momento de ocio.",
    "Se le llama la atención por indisciplina en aula.",
    "Conflicto con estudiante",
    "Conflicto con profesor o asistente de la red.",
    "Otra:"
];

const conductasOptions = [
    "Agresión física:¿a quién?",
    "Autoagresión.",
    "Se escapa o se corre.",
    "Negativismo.",
    "Tira y/o rompe cosas.",
    "Escupe.",
    "Quita cosas.",
    "Otro:"
];

const consecuentesOptions = [
    "Se tranquiliza solo.",
    "Es reconducido a la actividad inicial.",
    "Es reprendido.",
    "Se realiza tiempo fuera (dentro del aula, en un lugar reservador para reflexionar, separado del grupo).",
    "Se le cambia la actividad.",
    "Se ignora.",
    "Se aplica reglamento interno: sanción formativa(alternativa).",
    "Se acuerda entre familia y escuela, reducción de jornada.",
    "Se aplica reglamento interno:sanción regular.",
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
    asignaturas: z.string().min(1, "Requerido"),
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
});

type DecFormValues = z.infer<typeof decFormSchema>;

interface DecDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record?: DecRecord | null;
    onSuccess: () => void;
}

export function DecDialog({ open, onOpenChange, record, onSuccess }: DecDialogProps) {
    const [loading, setLoading] = useState(false);

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
            asignaturas: "",
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
                asignaturas: "",
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
            });
        }
    }, [record, form, open]);

    const onSubmit = async (data: DecFormValues) => {
        setLoading(true);
        // Ensure date is properly formatted for pb if needed (usually ISO format works)
        try {
            const submitData = {
                ...data,
                dia: new Date(data.dia).toISOString()
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

            // Extract PocketBase detailed validation errors if present
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
    const totalSteps = 5;

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
                <DialogHeader className="px-6 py-4 border-b">
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
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6">
                                {/* PASO 1: Datos Generales y Personal */}
                                {step === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium border-b pb-2">Datos Generales</h3>
                                            <div className="grid grid-cols-2 gap-4">
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
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccione un bloque" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="8:00 - 9:30">8:00 - 9:30</SelectItem>
                                                                <SelectItem value="Recreo 1">Recreo 1</SelectItem>
                                                                <SelectItem value="09:45 - 11:20">09:45 - 11:20</SelectItem>
                                                                <SelectItem value="Recreo 2">Recreo 2</SelectItem>
                                                                <SelectItem value="11:30 - 13:00">11:30 - 13:00</SelectItem>
                                                                <SelectItem value="Colación">Colación</SelectItem>
                                                                <SelectItem value="Otro">Otro</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="asignaturas" render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel>Asignatura(s)</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                                                <SelectItem value="Eduacion Física">Eduacion Física</SelectItem>
                                                                <SelectItem value="Religión">Religión</SelectItem>
                                                                <SelectItem value="Tecnología">Tecnología</SelectItem>
                                                                <SelectItem value="Lengua Indígena">Lengua Indígena</SelectItem>
                                                                <SelectItem value="Otra:">Otra:</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
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

                                {/* PASO 2: Estudiante y Apoderado */}
                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
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
                                    </div>
                                )}

                                {/* PASO 3: Antecedentes */}
                                {step === 3 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium border-b pb-2">Antecedentes</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <FormField control={form.control} name="antecedentes" render={() => (
                                                    <FormItem>
                                                        <div className="mb-4">
                                                            <FormLabel className="text-base">Seleccione los Antecedentes</FormLabel>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {antecedentesOptions.map((item) => (
                                                                <FormField
                                                                    key={item}
                                                                    control={form.control}
                                                                    name="antecedentes"
                                                                    render={({ field }) => {
                                                                        const isChecked = Array.isArray(field.value) ? field.value.includes(item) : false;
                                                                        return (
                                                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded hover:bg-muted/50 transition-colors">
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={isChecked}
                                                                                        onCheckedChange={(checked) => {
                                                                                            const currentValues = Array.isArray(field.value) ? field.value : [];
                                                                                            if (checked) {
                                                                                                field.onChange([...currentValues, item]);
                                                                                            } else {
                                                                                                field.onChange(currentValues.filter((val) => val !== item));
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormLabel className="font-normal text-sm cursor-pointer w-full leading-snug m-0">
                                                                                    {item}
                                                                                </FormLabel>
                                                                            </FormItem>
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                    <FormField control={form.control} name="ConflictoConEstudiante_antecedentes" render={({ field }) => (
                                                        <FormItem><FormLabel>Detalles Estudiante(s) (Si aplica)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="ConflictoConProfesor_antecedentes" render={({ field }) => (
                                                        <FormItem><FormLabel>Detalles Profesor (Si aplica)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="otra_antecedentes" render={({ field }) => (
                                                        <FormItem className="col-span-2"><FormLabel>Especificar otro antecedente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 4: Conductas */}
                                {step === 4 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium border-b pb-2">Conductas</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <FormField control={form.control} name="conductas" render={() => (
                                                    <FormItem>
                                                        <div className="mb-4">
                                                            <FormLabel className="text-base">Seleccione las Conductas</FormLabel>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {conductasOptions.map((item) => (
                                                                <FormField
                                                                    key={item}
                                                                    control={form.control}
                                                                    name="conductas"
                                                                    render={({ field }) => {
                                                                        const isChecked = Array.isArray(field.value) ? field.value.includes(item) : false;
                                                                        return (
                                                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded hover:bg-muted/50 transition-colors">
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={isChecked}
                                                                                        onCheckedChange={(checked) => {
                                                                                            const currentValues = Array.isArray(field.value) ? field.value : [];
                                                                                            if (checked) {
                                                                                                field.onChange([...currentValues, item]);
                                                                                            } else {
                                                                                                field.onChange(currentValues.filter((val) => val !== item));
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormLabel className="font-normal text-sm cursor-pointer w-full leading-snug m-0">
                                                                                    {item}
                                                                                </FormLabel>
                                                                            </FormItem>
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                    <FormField control={form.control} name="Agresion_fisica_conductas" render={({ field }) => (
                                                        <FormItem><FormLabel>Detalles Agresión Física (Si aplica)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="duracion_conductas" render={({ field }) => (
                                                        <FormItem><FormLabel>Duración de la conducta</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="descripcion_conductas" render={({ field }) => (
                                                        <FormItem className="col-span-2"><FormLabel>Descripción Adicional</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="otro_conductas" render={({ field }) => (
                                                        <FormItem className="col-span-2"><FormLabel>Otras Conductas</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PASO 5: Consecuentes */}
                                {step === 5 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium border-b pb-2">Consecuencias y Medidas</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <FormField control={form.control} name="consecuentes" render={() => (
                                                    <FormItem>
                                                        <div className="mb-4">
                                                            <FormLabel className="text-base">Seleccione los Consecuentes</FormLabel>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {consecuentesOptions.map((item) => (
                                                                <FormField
                                                                    key={item}
                                                                    control={form.control}
                                                                    name="consecuentes"
                                                                    render={({ field }) => {
                                                                        const isChecked = Array.isArray(field.value) ? field.value.includes(item) : false;
                                                                        return (
                                                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded hover:bg-muted/50 transition-colors">
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={isChecked}
                                                                                        onCheckedChange={(checked) => {
                                                                                            const currentValues = Array.isArray(field.value) ? field.value : [];
                                                                                            if (checked) {
                                                                                                field.onChange([...currentValues, item]);
                                                                                            } else {
                                                                                                field.onChange(currentValues.filter((val) => val !== item));
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormLabel className="font-normal text-sm cursor-pointer w-full leading-snug m-0">
                                                                                    {item}
                                                                                </FormLabel>
                                                                            </FormItem>
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="otro_consecuentes" render={({ field }) => (
                                                    <FormItem><FormLabel>Otros Consecuentes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="funciona_medida" render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="font-semibold text-base cursor-pointer">¿Funciona la Medida tomada?</FormLabel>
                                                        </div>
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
                                        <Button type="submit" disabled={loading}>
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
