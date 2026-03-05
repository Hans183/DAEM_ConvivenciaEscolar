"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useUser } from "@/hooks/use-user";
import { pb } from "@/lib/pocketbase";

import { type DecRecord, getColumns } from "./columns";
import { DecDialog } from "./dec-dialog";

export function DecTable() {
  const user = useUser();
  const userId = user?.id ?? null;
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isItinerante = user?.role?.toLowerCase() === "itinerante";
  // Serialize establecimiento to a stable string for use as a dependency
  const establecimientoKey = JSON.stringify(user?.establecimiento ?? null);
  const searchParams = useSearchParams();
  const [data, setData] = useState<DecRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DecRecord | null>(null);
  const handledDecId = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let filter = "";
      // Parse establecimiento back from the stable key
      const establecimiento = JSON.parse(establecimientoKey) as string | string[] | null;
      if (isItinerante && establecimiento) {
        const estArray = Array.isArray(establecimiento)
          ? establecimiento
          : [establecimiento];

        if (estArray.length > 0) {
          filter = estArray.map((id) => `establecimiento = "${id}"`).join(" || ");
        }
      } else if (!isAdmin && establecimiento) {
        filter = `establecimiento = "${establecimiento}"`;
      }

      const records = await pb.collection("DEC").getFullList({
        sort: "-created",
        expand: "establecimiento",
        ...(filter ? { filter } : {}),
      });
      setData(records as unknown as DecRecord[]);
    } catch (err: unknown) {
      const error = err as { isAbort?: boolean };
      if (error.isAbort) return;
      console.error("Failed to fetch DEC records:", error);
      toast.error("Error al cargar registros DEC");
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, isItinerante, establecimientoKey]);

  const handleCreate = useCallback(() => {
    setSelectedRecord(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((record: DecRecord) => {
    setSelectedRecord(record);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (record: DecRecord) => {
    if (!confirm("¿Está seguro de eliminar este registro?")) return;

    try {
      await pb.collection("DEC").delete(record.id);
      toast.success("Registro eliminado correctamente");
      fetchData();
    } catch (err: unknown) {
      const error = err as { isAbort?: boolean };
      console.error("Failed to delete DEC record:", error);
      toast.error("Error al eliminar el registro");
    }
  }, [fetchData]);

  useEffect(() => {
    if (userId !== null) {
      fetchData();
    }
  }, [userId, fetchData]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Handle specific search params sync
  useEffect(() => {
    const decId = searchParams.get("decId");
    
    if (!decId) {
      handledDecId.current = null;
    } else if (data.length > 0 && handledDecId.current !== decId) {
      const record = data.find((r) => r.id === decId);
      if (record) {
        handledDecId.current = decId;
        handleEdit(record);
        
        // Use history.replaceState to remove decId without triggering
        // a searchParams re-render loop in Next.js
        const params = new URLSearchParams(window.location.search);
        params.delete("decId");
        const queryStr = params.toString();
        const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [data, searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Internal handlers are stable
  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete, isAdmin, isItinerante }),
    [isAdmin, isItinerante],
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

      <DecDialog open={dialogOpen} onOpenChange={setDialogOpen} record={selectedRecord} onSuccess={fetchData} />
    </div>
  );
}
