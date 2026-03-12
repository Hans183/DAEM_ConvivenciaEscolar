"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useUser } from "@/hooks/use-user";
import { getFriendlyErrorMessage } from "@/lib/pb-error-handler";
import { pb } from "@/lib/pocketbase";

import { getColumns, type ProtocoloRecord } from "./protocolos-columns";
import { ProtocoloDialog } from "./protocolos-dialog";

export function ProtocolosTable() {
  const user = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [data, setData] = useState<ProtocoloRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProtocolo, setSelectedProtocolo] = useState<ProtocoloRecord | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return; // Wait until user is loaded
    setLoading(true);
    try {
      // If the user is not an Admin, filter by their establecimiento OR communal protocols
      const filter = !isAdmin && user.establecimiento ? `(establecimiento = "${user.establecimiento}" || es_comunal = true)` : "";

      const records = await pb.collection("protocolos").getFullList({
        sort: "-created",
        expand: "establecimiento",
        ...(filter ? { filter } : {}),
      });

      setData(records as unknown as ProtocoloRecord[]);
    } catch (error) {
      if ((error as any).isAbort) return;
      console.error("Failed to fetch protocolos:", error);
      const message = getFriendlyErrorMessage(error);
      toast.error("Error al cargar protocolos", { description: message });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const handleCreate = useCallback(() => {
    setSelectedProtocolo(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((record: ProtocoloRecord) => {
    setSelectedProtocolo(record);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (record: ProtocoloRecord) => {
      if (!window.confirm("¿Está seguro de eliminar este protocolo?")) return;
      setLoading(true);
      try {
        await pb.collection("protocolos").delete(record.id);
        toast.success("Protocolo eliminado");
        fetchData();
      } catch (error) {
        console.error("Error deleting protocolo:", error);
        const message = getFriendlyErrorMessage(error);
        toast.error("Error al eliminar protocolo", { description: message });
      } finally {
        setLoading(false);
      }
    },
    [fetchData],
  );

  // Re-fetch when user loads
  useEffect(() => {
    if (user !== null) {
      fetchData();
    }
  }, [user, fetchData]);

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete, isAdmin }),
    [isAdmin, handleEdit, handleDelete],
  );

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
          onChange={(event) => table.getColumn("nombre")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Protocolo
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>
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
        isAdmin={isAdmin}
        userEstablecimiento={user?.establecimiento ?? null}
      />
    </div>
  );
}
