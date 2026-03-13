"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ProtocoloRecord = {
  id: string;
  collectionId: string;
  collectionName: string;
  nombre: string;
  descripcion: string;
  establecimiento: string;
  es_comunal: boolean;
  expand?: {
    establecimiento?: { id: string; nombre: string };
  };
  created: string;
  updated: string;
};

interface GetColumnsProps {
  onEdit: (record: ProtocoloRecord) => void;
  onDelete: (record: ProtocoloRecord) => void;
  isAdmin?: boolean;
}

export const getColumns = ({ onEdit, onDelete, isAdmin }: GetColumnsProps): ColumnDef<ProtocoloRecord>[] => {
  const cols: ColumnDef<ProtocoloRecord>[] = [
    /* Select */
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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

    /* Nombre */
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const nombre = row.getValue("nombre") as string;
        const truncated = nombre.length > 50 ? `${nombre.slice(0, 50)}…` : nombre;
        return (
          <div className="font-medium" title={nombre}>
            {truncated}
          </div>
        );
      },
    },

    /* Descripción */
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="line-clamp-2 max-w-[400px] text-muted-foreground">{row.getValue("descripcion")}</div>
      ),
    },
  ];

  // Always show the Establecimiento column
  cols.push({
    id: "establecimiento",
    header: "Establecimiento",
    cell: ({ row }) => {
      if (row.original.es_comunal) {
        return <div className="inline-flex items-center rounded-full border border-transparent bg-primary px-2.5 py-0.5 font-semibold text-primary-foreground text-xs transition-colors hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">Comunal</div>;
      }
      const nombre = row.original.expand?.establecimiento?.nombre;
      const truncated = nombre && nombre.length > 20 ? `${nombre.slice(0, 20)}…` : nombre;
      return (
        <div className="text-muted-foreground" title={nombre ?? undefined}>
          {truncated ?? "—"}
        </div>
      );
    },
  });

  cols.push(
    /* Fecha creación */
    {
      accessorKey: "created",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fecha creación
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{new Date(row.getValue("created")).toLocaleDateString("es-CL")}</div>
      ),
    },

    /* Actions */
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
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 focus:text-red-600">
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
  );

  return cols;
};
