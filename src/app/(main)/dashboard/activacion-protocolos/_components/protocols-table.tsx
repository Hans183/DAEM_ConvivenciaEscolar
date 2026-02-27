"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useUser } from "@/hooks/use-user";
import { getColumns, type ProtocolActivation } from "./columns";
import { ProtocolDialog } from "./protocol-dialog";

export function ProtocolsTable() {
    const user = useUser();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const [data, setData] = useState<ProtocolActivation[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState<ProtocolActivation | null>(null);

    const handleCreate = () => {
        setSelectedProtocol(null);
        setDialogOpen(true);
    };

    const handleEdit = (record: ProtocolActivation) => {
        setSelectedProtocol(record);
        setDialogOpen(true);
    };

    const handleDelete = async (record: ProtocolActivation) => {
        if (!window.confirm("¿Está seguro de eliminar este registro?")) return;
        setLoading(true);
        try {
            await pb.collection("activacion_protocolos").delete(record.id);
            toast.success("Registro eliminado");
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Error al eliminar registro");
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const filter = !isAdmin && user.establecimiento
                ? `establecimiento = "${user.establecimiento}"`
                : "";

            const records = await pb.collection("activacion_protocolos").getFullList({
                sort: "-created",
                expand: "protocolo,establecimiento",
                ...(filter ? { filter } : {}),
            });
            setData(records as unknown as ProtocolActivation[]);
        } catch (error: any) {
            if (error.isAbort) return;
            console.error("Failed to fetch protocol activations:", error);
            toast.error("Error al cargar activaciones de protocolos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user !== null) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const columns = useMemo(
        () => getColumns({ onEdit: handleEdit, onDelete: handleDelete, isAdmin }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isAdmin]
    );

    const table = useDataTableInstance({ columns, data });

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Registro
                </Button>
            </div>
            <div className="rounded-md border">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>
                ) : (
                    <DataTable table={table} columns={columns} />
                )}
            </div>
            <DataTablePagination table={table} />

            <ProtocolDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                protocol={selectedProtocol}
                onSuccess={fetchData}
            />
        </div>
    );
}
