"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const searchParams = useSearchParams();
  const router = useRouter();
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
    } catch (err: unknown) {
      const error = err as { isAbort?: boolean };
      console.error("Failed to delete DEC record:", error);
      toast.error("Error al eliminar el registro");
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const filter = !isAdmin && user.establecimiento ? `establecimiento = "${user.establecimiento}"` : "";

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
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentional bypass
  useEffect(() => {
    if (user !== null) {
      fetchData();
    }
  }, [user]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Handle specific search params sync
  useEffect(() => {
    if (data.length > 0) {
      const decId = searchParams.get("decId");
      if (decId) {
        const record = data.find((r) => r.id === decId);
        if (record) {
          handleEdit(record);
          const params = new URLSearchParams(searchParams.toString());
          params.delete("decId");
          const queryStr = params.toString();
          const newUrl = queryStr ? `?${queryStr}` : window.location.pathname;
          router.replace(newUrl, { scroll: false });
        }
      }
    }
  }, [data, searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Internal handlers are stable
  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete, isAdmin }),
    [isAdmin],
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
