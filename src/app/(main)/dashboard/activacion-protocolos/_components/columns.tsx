"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

// Type definition based on user provided JSON
export type ProtocolActivation = {
    id: string;
    collectionId: string;
    collectionName: string;
    cantidad: number;
    meses: string;
    protocolo: string; // Relation ID
    establecimiento: string; // Relation ID
    created: string;
    updated: string;
    expand?: {
        protocolo?: {
            item?: string;
            nombre?: string;
            name?: string;
        };
        establecimiento?: {
            id: string;
            nombre: string;
        };
    };
};

interface GetColumnsProps {
    onEdit?: (record: ProtocolActivation) => void;
    onDelete?: (record: ProtocolActivation) => void;
    isAdmin?: boolean;
}
export const getColumns = ({ onEdit, onDelete, isAdmin }: GetColumnsProps): ColumnDef<ProtocolActivation>[] => {
    const cols: ColumnDef<ProtocolActivation>[] = [
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
            accessorKey: "meses",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Mes
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("meses")}</div>,
        },
        {
            accessorKey: "cantidad",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Cantidad
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-medium">{row.getValue("cantidad")}</div>,
        },
        {
            accessorKey: "protocolo",
            header: "Protocolo",
            cell: ({ row }) => {
                const expandProxy = row.original.expand?.protocolo;
                const proto = Array.isArray(expandProxy) ? expandProxy[0] : expandProxy;
                const name = proto?.item || proto?.nombre || proto?.name || row.getValue("protocolo");
                return <div className="font-medium">{name}</div>;
            },
        },
        {
            id: "establecimiento",
            header: "Establecimiento",
            cell: ({ row }) => {
                const nombre = row.original.expand?.establecimiento?.nombre;
                return <div className="text-muted-foreground">{nombre ?? "—"}</div>;
            },
        },
        {
            accessorKey: "created",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Fecha Creación
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="text-muted-foreground">
                    {new Date(row.getValue("created")).toLocaleDateString("es-CL")}
                </div>
            ),
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
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
                                Copiar ID
                            </DropdownMenuItem>
                            {isAdmin && onEdit && onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onEdit(item)}>
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDelete(item)}
                                        className="text-red-600 focus:text-red-600"
                                    >
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
    return cols;
};

// Legacy export for backwards compat
export const columns = getColumns({});
