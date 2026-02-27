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
import { getColumns, type DecRecord } from "./columns";
import { DecDialog } from "./dec-dialog";

export function DecTable() {
    const user = useUser();
    const isAdmin = user?.role?.toLowerCase() === "admin";
    const [data, setData] = useState<DecRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<DecRecord | null>(null);

    const handleCreate = () => {
        setSelectedRecord(null);
        setDialogOpen(true);
    };

    const handleEdit = (record: DecRecord) => {
        setSelectedRecord(record);
        setDialogOpen(true);
    };

    const handleDelete = async (record: DecRecord) => {
        if (!confirm("¿Está seguro de eliminar este registro?")) return;

        try {
            await pb.collection("DEC").delete(record.id);
            toast.success("Registro eliminado correctamente");
            fetchData();
        } catch (error: any) {
            console.error("Failed to delete DEC record:", error);
            toast.error("Error al eliminar el registro");
        }
    };

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const filter = !isAdmin && user.establecimiento
                ? `establecimiento = "${user.establecimiento}"`
                : "";

            const records = await pb.collection("DEC").getFullList({
                sort: "-created",
                expand: "establecimiento",
                ...(filter ? { filter } : {}),
            });
            setData(records as unknown as DecRecord[]);
        } catch (error: any) {
            if (error.isAbort) return;
            console.error("Failed to fetch DEC records:", error);
            toast.error("Error al cargar registros DEC");
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

    const table = useDataTableInstance({
        columns,
        data,
    });

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

            <DecDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                record={selectedRecord}
                onSuccess={fetchData}
            />
        </div>
    );
}
