"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { columns, type ProtocolActivation } from "./columns";
import { ProtocolDialog } from "./protocol-dialog";

export function ProtocolsTable() {
    const [data, setData] = useState<ProtocolActivation[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState<ProtocolActivation | null>(null);

    const handleCreate = () => {
        setSelectedProtocol(null);
        setDialogOpen(true);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const records = await pb.collection("activacion_protocolos").getFullList({
                sort: "-created",
                expand: "protocolo",
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
