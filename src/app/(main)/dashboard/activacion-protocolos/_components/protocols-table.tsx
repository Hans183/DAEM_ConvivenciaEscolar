"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useUser } from "@/hooks/use-user";
import { hasRole } from "@/lib/roles";
import { getFriendlyErrorMessage } from "@/lib/pb-error-handler";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

import { getColumns, type ProtocolActivation } from "./columns";
import { ProtocolDialog } from "./protocol-dialog";

const MONTHS_SPANISH = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const YEARS = ["2024", "2025", "2026", "2027"];

export function ProtocolsTable() {
  const user = useUser();
  const isAdmin = hasRole(user?.role, "admin");

  const [data, setData] = useState<ProtocolActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolActivation | null>(null);

  // Filtros
  const [filtroEst, setFiltroEst] = useState<string>("todos");
  const [filtroYear, setFiltroYear] = useState<string>("todos");
  const [filtroMonth, setFiltroMonth] = useState<string>("todos");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [userEsts, setUserEsts] = useState<{ id: string; nombre: string }[]>([]);

  // Cargar lista de establecimientos para filtrar
  useEffect(() => {
    if (!user) return;

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
  }, [user, isAdmin]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const queryFilters: string[] = [];

      // 1. Filtro por establecimiento
      if (filtroEst !== "todos") {
        queryFilters.push(`establecimiento = "${filtroEst}"`);
      } else if (!isAdmin) {
        if (user.establecimiento) {
          const estArray = Array.isArray(user.establecimiento) ? user.establecimiento : [user.establecimiento];
          const validEsts = estArray.filter(Boolean);
          if (validEsts.length > 0) {
            const estQuery = validEsts.map((id) => `establecimiento = "${id}"`).join(" || ");
            queryFilters.push(`(${estQuery})`);
          } else {
            queryFilters.push('establecimiento = "none"');
          }
        } else {
          queryFilters.push('establecimiento = "none"');
        }
      }

      // 2. Filtro por año
      if (filtroYear !== "todos") {
        queryFilters.push(`created >= "${filtroYear}-01-01 00:00:00" && created <= "${filtroYear}-12-31 23:59:59"`);
      }

      // 3. Filtro por mes
      if (filtroMonth !== "todos") {
        queryFilters.push(`meses = "${filtroMonth}"`);
      }

      const filter = queryFilters.join(" && ");

      const records = await pb.collection("activacion_protocolos").getFullList({
        sort: "-created",
        expand: "protocolo,establecimiento",
        ...(filter ? { filter } : {}),
      });
      setData(records as unknown as ProtocolActivation[]);
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      toast.error("Error al cargar activaciones de protocolos", { description: message });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, filtroEst, filtroYear, filtroMonth]);

  const handleCreate = () => {
    setSelectedProtocol(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((record: ProtocolActivation) => {
    setSelectedProtocol(record);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (record: ProtocolActivation) => {
      if (!window.confirm("¿Está seguro de eliminar este registro?")) return;
      setLoading(true);
      try {
        await pb.collection("activacion_protocolos").delete(record.id);
        toast.success("Registro eliminado");
        fetchData();
      } catch (error) {
        const message = getFriendlyErrorMessage(error);
        toast.error("Error al eliminar registro", { description: message });
      } finally {
        setLoading(false);
      }
    },
    [fetchData],
  );

  useEffect(() => {
    if (user !== null) {
      fetchData();
    }
  }, [user, fetchData]);

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete, isAdmin }),
    [isAdmin, handleEdit, handleDelete],
  );

  const table = useDataTableInstance({ columns, data });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Selector de Escuela (si hay más de 1 escuela asignada o es admin) */}
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

          {/* Selector de Año */}
          <Select value={filtroYear} onValueChange={setFiltroYear}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">📅 Todos los años</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selector de Mes */}
          <Select value={filtroMonth} onValueChange={setFiltroMonth}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">🗓️ Todos los meses</SelectItem>
              {MONTHS_SPANISH.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <ProtocolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        protocol={selectedProtocol}
        onSuccess={fetchData}
      />
    </div>
  );
}
