"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { getColumns, type EstablecimientoActivation } from "./establecimientos-columns";
import { EstablecimientoDialog } from "./establecimientos-dialog";

export function EstablecimientosTable() {
    const [data, setData] = useState<EstablecimientoActivation[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstablecimiento, setSelectedEstablecimiento] =
        useState<EstablecimientoActivation | null>(null);
    const handleCreate = () => {
        setSelectedEstablecimiento(null);
        setDialogOpen(true);
    };

    const handleEdit = (record: EstablecimientoActivation) => {
        setSelectedEstablecimiento(record);
        setDialogOpen(true);
    };

    const handleDelete = async (record: EstablecimientoActivation) => {
        if (!window.confirm("¿Está seguro de eliminar este establecimiento?")) return;
        setLoading(true);
        try {
            await pb.collection("establecimientos").delete(record.id);
            toast.success("Establecimiento eliminado");
            fetchData();
        } catch (error) {
            console.error("Error deleting establecimiento:", error);
            toast.error("Error al eliminar establecimiento");
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const records = await pb
                .collection("establecimientos")
                .getFullList({
                    sort: "-created",
                });

            setData(records as unknown as EstablecimientoActivation[]);
        } catch (error: any) {
            if (error.isAbort) return;
            console.error("Failed to fetch establecimientos:", error);
            toast.error("Error al cargar establecimientos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = getColumns({ onEdit: handleEdit, onDelete: handleDelete });

    const table = useDataTableInstance({
        columns,
        data,
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Buscar establecimiento por nombre..."
                    value={(table.getColumn("nombre")?.getFilterValue() as string) || ""}
                    onChange={(event) =>
                        table.getColumn("nombre")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Establecimiento
                </Button>
            </div>

            <div className="rounded-md border">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Cargando datos...
                    </div>
                ) : (
                    <DataTable table={table} columns={columns} />
                )}
            </div>

            <DataTablePagination table={table} />

            <EstablecimientoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                establecimiento={selectedEstablecimiento}
                onSuccess={fetchData}
            />
        </div>
    );
}
