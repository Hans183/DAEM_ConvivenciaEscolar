"use client";

import * as React from "react";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/hooks/use-user";
import { pb } from "@/lib/pocketbase";

import { CrearDenunciaDialog } from "./crear-denuncia-dialog";
import { LeyKarinDialog } from "./ley-karin-dialog";

export type DenunciaKarinData = {
  id: string;
  created: string;
  createdAt: string;
  materia: string;
  nombresDenunciante: string;
  firmaAnonima: boolean;
  estado: "Ingresada" | "En análisis" | "Cerrada";
  establecimiento?: string;
  expand?: {
    establecimiento?: {
      nombre: string;
    };
  };
};

interface LeyKarinContentProps {
  establecimientos: { id: string; nombre: string }[];
}

const columns: ColumnDef<DenunciaKarinData>[] = [
  {
    accessorKey: "createdAt",
    header: "Fecha de Ingreso",
    cell: ({ row }) => {
      const dbDate = row.getValue("createdAt") as string | undefined;
      if (!dbDate) return "No disponible";
      const parsedDate = new Date(dbDate);
      if (Number.isNaN(parsedDate.getTime())) return "Fecha desconocida";
      return parsedDate.toLocaleDateString("es-CL");
    },
  },
  {
    accessorKey: "materia",
    header: "Materia",
  },
  {
    accessorKey: "nombresDenunciante",
    header: "Persona Denunciante",
    cell: ({ row }) => {
      const anonima = row.original.firmaAnonima;
      return anonima ? (
        <span className="text-muted-foreground italic">Anónima</span>
      ) : (
        row.original.nombresDenunciante
      );
    },
  },
  {
    accessorKey: "establecimiento",
    header: "Establecimiento",
    cell: ({ row }) => {
      return (
        row.original.expand?.establecimiento?.nombre || "No especificado"
      );
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string;
      return (
        <Badge variant={estado === "Cerrada" ? "secondary" : "default"}>
          {estado}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const refreshData = (table.options.meta as any)?.refreshData;
      return (
        <LeyKarinDialog
          denuncia={row.original}
          onUpdated={refreshData || (() => window.location.reload())}
        />
      );
    },
  },
];

export function LeyKarinContent({ establecimientos }: LeyKarinContentProps) {
  const user = useUser();
  const userId = user?.id ?? null;
  const [data, setData] = React.useState<DenunciaKarinData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result = await pb
        .collection("denuncias_ley_karin")
        .getList<DenunciaKarinData>(1, 500, {
          sort: "-id",
          expand: "establecimiento",
        });
      setData(result.items);
    } catch (error: any) {
      if (!error.isAbort) {
        toast.error(
          `Error de PocketBase: ${error.response?.message || error.message}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    if (userId !== null) {
      fetchData();
    }
  }, [userId, fetchData]);

  const refreshData = React.useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      refreshData,
    },
  });

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Denuncias Ley Karin
        </h2>
        <CrearDenunciaDialog
          establecimientos={establecimientos}
          onCreated={refreshData}
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Aún no hay denuncias ingresadas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
