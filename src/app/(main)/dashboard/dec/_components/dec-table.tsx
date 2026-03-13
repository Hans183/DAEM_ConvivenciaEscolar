"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Building2, Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useUser } from "@/hooks/use-user";
import { getFriendlyErrorMessage } from "@/lib/pb-error-handler";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

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
  const [filtroEst, setFiltroEst] = useState<string>("todos");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [userEsts, setUserEsts] = useState<{ id: string; nombre: string }[]>([]);
  const handledDecId = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let filter = "";
      // Parse establecimiento back from the stable key
      const establecimiento = JSON.parse(establecimientoKey) as string | string[] | null;

      if (filtroEst !== "todos") {
        filter = `establecimiento = "${filtroEst}"`;
      } else if (isItinerante && establecimiento) {
        const estArray = Array.isArray(establecimiento) ? establecimiento : [establecimiento];

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
      const message = getFriendlyErrorMessage(err);
      console.error("Failed to fetch DEC records:", err);
      toast.error("Error al cargar registros DEC", { description: message });
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, isItinerante, establecimientoKey, filtroEst]);

  const handleCreate = useCallback(() => {
    setSelectedRecord(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((record: DecRecord) => {
    setSelectedRecord(record);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (record: DecRecord) => {
      if (!confirm("¿Está seguro de eliminar este registro?")) return;

      try {
        await pb.collection("DEC").delete(record.id);
        toast.success("Registro eliminado correctamente");
        fetchData();
      } catch (err: unknown) {
        const message = getFriendlyErrorMessage(err);
        console.error("Failed to delete DEC record:", err);
        toast.error("Error al eliminar el registro", { description: message });
      }
    },
    [fetchData],
  );

  useEffect(() => {
    if (userId !== null) {
      fetchData();
    }
  }, [userId, fetchData]);

  // Fetch establishments for filter
  useEffect(() => {
    if (!userId) return;

    const fetchEsts = async () => {
      try {
        const estsList = await pb.collection("establecimientos").getFullList({
          sort: "nombre",
        });
        const all = estsList as unknown as { id: string; nombre: string }[];

        if (isAdmin) {
          setUserEsts(all);
        } else if (user?.establecimiento) {
          const ids = Array.isArray(user.establecimiento) ? user.establecimiento : [user.establecimiento];
          setUserEsts(all.filter((e) => ids.includes(e.id)));
        }
      } catch (e) {
        console.error("Error fetching establishments for filter:", e);
      }
    };

    fetchEsts();
  }, [userId, isAdmin, user?.establecimiento]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="-translate-y-1/2 absolute top-1/2 ml-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por estudiante..."
              value={(table.getColumn("nombre_estudiante")?.getFilterValue() as string) || ""}
              onChange={(event) => table.getColumn("nombre_estudiante")?.setFilterValue(event.target.value)}
              className="pl-8"
            />
          </div>

          {userEsts.length > 1 && (
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="h-9 justify-between">
                  {filtroEst === "todos" ? (
                    <>
                      <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      🌐 Todos los establecimientos
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      {userEsts.find((est) => est.id === filtroEst)?.nombre}
                    </>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar establecimiento..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el establecimiento.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todos"
                        onSelect={() => {
                          setFiltroEst("todos");
                          setComboboxOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", filtroEst === "todos" ? "opacity-100" : "opacity-0")} />
                        🌐 Todos los establecimientos
                      </CommandItem>
                      {userEsts.map((est) => (
                        <CommandItem
                          key={est.id}
                          value={est.nombre}
                          onSelect={() => {
                            setFiltroEst(est.id);
                            setComboboxOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", filtroEst === est.id ? "opacity-100" : "opacity-0")} />
                          {est.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Registro
          </Button>
        </div>
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
