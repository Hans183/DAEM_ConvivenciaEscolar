"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { columns, type EstablecimientoActivation } from "./establecimientos-columns";
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

    const table = useDataTableInstance({
        columns,
        data,
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
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
