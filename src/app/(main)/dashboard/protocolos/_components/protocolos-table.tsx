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
import { getColumns, type ProtocoloRecord } from "./protocolos-columns";
import { ProtocoloDialog } from "./protocolos-dialog";

export function ProtocolosTable() {
    const [data, setData] = useState<ProtocoloRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProtocolo, setSelectedProtocolo] =
        useState<ProtocoloRecord | null>(null);

    const handleCreate = () => {
        setSelectedProtocolo(null);
        setDialogOpen(true);
    };

    const handleEdit = (record: ProtocoloRecord) => {
        setSelectedProtocolo(record);
        setDialogOpen(true);
    };

    const handleDelete = async (record: ProtocoloRecord) => {
        if (!window.confirm("¿Está seguro de eliminar este protocolo?")) return;
        setLoading(true);
        try {
            await pb.collection("protocolos").delete(record.id);
            toast.success("Protocolo eliminado");
            fetchData();
        } catch (error) {
            console.error("Error deleting protocolo:", error);
            toast.error("Error al eliminar protocolo");
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const records = await pb
                .collection("protocolos")
                .getFullList({
                    sort: "-created",
                });

            setData(records as unknown as ProtocoloRecord[]);
        } catch (error: any) {
            if (error.isAbort) return;
            console.error("Failed to fetch protocolos:", error);
            toast.error("Error al cargar protocolos");
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
                    placeholder="Buscar protocolo por nombre..."
                    value={(table.getColumn("nombre")?.getFilterValue() as string) || ""}
                    onChange={(event) =>
                        table.getColumn("nombre")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Protocolo
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Cargando datos...
                    </div>
                ) : (
                    <DataTable table={table} columns={columns} />
                )}
            </div>

            <DataTablePagination table={table} />

            <ProtocoloDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                protocolo={selectedProtocolo}
                onSuccess={fetchData}
            />
        </div>
    );
}
