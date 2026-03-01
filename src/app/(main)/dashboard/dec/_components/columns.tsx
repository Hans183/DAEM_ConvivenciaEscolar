"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, FileDown, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { generateDecPDF } from "./dec-pdf";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DecRecord = {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    dia: string;
    nombre_estudiante: string;
    edad_estudiante: number;
    curso_estudiante: string;
    profe_jefe_estudiante: string;
    nombre_apoderado: string;
    fono_apoderado: string;
    encargado_pi: string;
    acompanante_interno_pi: string;
    acompanante_externo_pi: string;
    hora: string;
    hora_otro?: string;
    asignaturas: string;
    asignatura_otra?: string;
    antecedentes: string[];
    ConflictoConEstudiante_antecedentes?: string;
    ConflictoConProfesor_antecedentes?: string;
    otra_antecedentes?: string;
    conductas: string[];
    Agresion_fisica_conductas?: string;
    otro_conductas?: string;
    descripcion_conductas?: string;
    duracion_conductas?: string;
    consecuentes: string[];
    otro_consecuentes?: string;
    funciona_medida: boolean;
    propuesta_mejora?: string;
    establecimiento?: string;
    nivel_dec?: string;
    expand?: {
        establecimiento?: { id: string; nombre: string };
    };
};

interface ColumnsProps {
    onEdit: (record: DecRecord) => void;
    onDelete: (record: DecRecord) => void;
    isAdmin?: boolean;
}

export const getColumns = ({ onEdit, onDelete, isAdmin }: ColumnsProps): ColumnDef<DecRecord>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Seleccionar todo"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Seleccionar fila"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "dia",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Fecha
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const dateStr = row.getValue("dia") as string;
            if (!dateStr) return <div>-</div>;
            return <div>{new Date(dateStr).toLocaleDateString("es-CL")}</div>;
        },
    },
    {
        accessorKey: "nombre_estudiante",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Estudiante
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue("nombre_estudiante")}</div>,
    },
    {
        accessorKey: "curso_estudiante",
        header: "Curso",
        cell: ({ row }) => <div>{row.getValue("curso_estudiante")}</div>,
    },
    {
        accessorKey: "nombre_apoderado",
        header: "Apoderado",
        cell: ({ row }) => <div>{row.getValue("nombre_apoderado")}</div>,
    },
    ...(isAdmin ? [{
        accessorKey: "establecimiento",
        header: "Establecimiento",
        cell: ({ row }: { row: { original: DecRecord } }) => {
            const nombre = row.original.expand?.establecimiento?.nombre;
            return <div>{nombre ?? "-"}</div>;
        },
    } as ColumnDef<DecRecord>] : []),
    {
        accessorKey: "nivel_dec",
        header: "Nivel",
        cell: ({ row }) => {
            const nivel = row.original.nivel_dec;
            if (!nivel) return <div className="text-muted-foreground">-</div>;
            const color =
                nivel === "Nivel 1" ? "bg-green-100 text-green-800 border-green-300"
                    : nivel === "Nivel 2" ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-red-100 text-red-800 border-red-300";
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
                    {nivel}
                </span>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const item = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => generateDecPDF(item)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Descargar PDF
                        </DropdownMenuItem>
                        {isAdmin && (
                            <>
                                <DropdownMenuItem
                                    onClick={() => onDelete(item)}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
