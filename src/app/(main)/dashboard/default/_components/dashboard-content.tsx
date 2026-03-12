"use client";

import { useEffect, useMemo, useState } from "react";

import { Building2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { pb } from "@/lib/pocketbase";

import { ChartConductasPie } from "./chart-conductas-pie";
import { ChartConsecuentesBar } from "./chart-consecuentes-bar";
import { ChartDecTendencia } from "./chart-dec-tendencia";
import { ChartProtocolosBar } from "./chart-protocolos-bar";
import { KpiCards } from "./kpi-cards";
import { ResumenDecTable } from "./resumen-table";
import type { DashboardData, DecRecord, EstablecimientoRecord, ProtocolRecord } from "./types";

const MESES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function formatMesLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return `${MESES_ES[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function computeDashboardData(
  decRecords: DecRecord[],
  protocolRecords: ProtocolRecord[],
  filtroEstablecimiento: string | null, // null = global (ID)
  isAdmin: boolean,
  allEsts: EstablecimientoRecord[],
): DashboardData & { establecimientos: EstablecimientoRecord[] } {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const last6 = getLastNMonths(6);

  // Filter by establecimiento if selected
  const dec = filtroEstablecimiento
    ? decRecords.filter((r) => r.establecimiento === filtroEstablecimiento)
    : decRecords;
  const proto = filtroEstablecimiento
    ? protocolRecords.filter((r) => r.establecimiento === filtroEstablecimiento)
    : protocolRecords;

  // Basic counts
  const totalDec = dec.length;
  const decEsteMes = dec.filter((r) => {
    const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
    return d === currentMonth;
  }).length;
  const decMesAnterior = dec.filter((r) => {
    const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
    return d === prevMonth;
  }).length;
  const decTrend = decMesAnterior > 0 ? Math.round(((decEsteMes - decMesAnterior) / decMesAnterior) * 100) : undefined;
  const medidasEfectivas = dec.filter((r) => r.funciona_medida === true).length;

  // Protocolos
  const totalProtocolos = proto.reduce((s: number, r: ProtocolRecord) => s + (Number(r.cantidad) || 0), 0);
  const protocolosEsteMes = proto
    .filter((r: ProtocolRecord) => r.meses === currentMonth || r.created?.slice(0, 7) === currentMonth)
    .reduce((s: number, r: ProtocolRecord) => s + (Number(r.cantidad) || 0), 0);
  const protocolosMesAnterior = proto
    .filter((r: ProtocolRecord) => r.meses === prevMonth || r.created?.slice(0, 7) === prevMonth)
    .reduce((s: number, r: ProtocolRecord) => s + (Number(r.cantidad) || 0), 0);
  const protocolosTrend =
    protocolosMesAnterior > 0
      ? Math.round(((protocolosEsteMes - protocolosMesAnterior) / protocolosMesAnterior) * 100)
      : undefined;

  // Establecimientos activos count
  const estabelsSet = new Set<string>();
  [...dec, ...proto].forEach((r) => {
    if (r.establecimiento) estabelsSet.add(r.establecimiento);
  });
  const establecimientosActivos = estabelsSet.size;

  // DEC por mes chart (last 6 months)
  let decPorMes: DashboardData["decPorMes"] = [];
  if (isAdmin && !filtroEstablecimiento) {
    // Lines per establecimiento (top 5 by activity)
    const activeEstsIds = Array.from(estabelsSet).slice(0, 5);
    const estNamesMap = new Map(allEsts.map((e) => [e.id, e.nombre]));
    decPorMes = last6.map((m) => {
      const obj: { mes: string; total: number; [k: string]: string | number } = {
        mes: formatMesLabel(m),
        total: 0,
      };
      activeEstsIds.forEach((estId) => {
        const estName = estNamesMap.get(estId) || "Unknown";
        const cnt = dec.filter((r) => {
          const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
          return d === m && r.establecimiento === estId;
        }).length;
        obj[estName] = cnt;
        obj.total += cnt;
      });
      return obj;
    });
    // return establecimientos list for chart
    return {
      totalDec,
      decEsteMes,
      decTrend,
      medidasEfectivas,
      totalProtocolos,
      protocolosEsteMes,
      protocolosTrend,
      establecimientosActivos,
      decPorMes,
      protocolosPorTipo: computeProtocolosPorTipo(proto),
      conductasFrecuentes: computeConductas(dec),
      consecuentesFrecuentes: computeConsecuentes(dec),
      ultimosDec: computeUltimosDec(dec),
      establecimientos: allEsts,
    };
  }
  decPorMes = last6.map((m) => ({
    mes: formatMesLabel(m),
    total: dec.filter((r) => {
      const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
      return d === m;
    }).length,
  }));

  return {
    totalDec,
    decEsteMes,
    decTrend,
    medidasEfectivas,
    totalProtocolos,
    protocolosEsteMes,
    protocolosTrend,
    establecimientosActivos,
    decPorMes,
    protocolosPorTipo: computeProtocolosPorTipo(proto),
    conductasFrecuentes: computeConductas(dec),
    consecuentesFrecuentes: computeConsecuentes(dec),
    ultimosDec: computeUltimosDec(dec),
    establecimientos: allEsts,
  };
}

function computeProtocolosPorTipo(proto: ProtocolRecord[]) {
  const map: Record<string, number> = {};
  proto.forEach((r) => {
    const nombre =
      r.expand?.protocolo?.item || r.expand?.protocolo?.nombre || r.expand?.protocolo?.name || "Sin nombre";
    map[nombre] = (map[nombre] || 0) + (Number(r.cantidad) || 0);
  });
  return Object.entries(map).map(([nombre, total]) => ({ nombre, total }));
}

function computeConductas(dec: DecRecord[]) {
  const map: Record<string, number> = {};
  dec.forEach((r) => {
    const arr: string[] = Array.isArray(r.conductas) ? r.conductas : [];
    arr.forEach((c) => {
      map[c] = (map[c] || 0) + 1;
    });
  });
  return Object.entries(map).map(([nombre, total]) => ({ nombre, total }));
}

function computeConsecuentes(dec: DecRecord[]) {
  const map: Record<string, number> = {};
  dec.forEach((r) => {
    const arr: string[] = Array.isArray(r.consecuentes) ? r.consecuentes : [];
    arr.forEach((c) => {
      map[c] = (map[c] || 0) + 1;
    });
  });
  return Object.entries(map).map(([nombre, total]) => ({ nombre, total }));
}

function computeUltimosDec(dec: DecRecord[]) {
  return [...dec]
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      dia: r.dia || r.created,
      nombre_estudiante: r.nombre_estudiante,
      curso_estudiante: r.curso_estudiante,
      establecimiento: r.expand?.establecimiento?.nombre,
      funciona_medida: r.funciona_medida,
    }));
}

export function DashboardContent() {
  const user = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [decRecords, setDecRecords] = useState<DecRecord[]>([]);
  const [protocolRecords, setProtocolRecords] = useState<ProtocolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEst, setFiltroEst] = useState<string>("global");
  const [allEsts, setAllEsts] = useState<EstablecimientoRecord[]>([]);
  const [userEsts, setUserEsts] = useState<EstablecimientoRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    refreshKey; // used as trigger
    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      try {
        let filter = "";
        if (!isAdmin && user.establecimiento) {
          const ests = Array.isArray(user.establecimiento) ? user.establecimiento : [user.establecimiento];
          if (ests.length > 0) {
            filter = ests.map((id: string) => `establecimiento = "${id}"`).join(" || ");
          }
        }

        const [dec, proto, estsList] = await Promise.all([
          pb.collection("dec").getFullList({
            sort: "-created",
            expand: "establecimiento",
            ...(filter ? { filter } : {}),
          }),
          pb.collection("activacion_protocolos").getFullList({
            sort: "-created",
            expand: "protocolo,establecimiento",
            ...(filter ? { filter } : {}),
          }),
          pb.collection("establecimientos").getFullList({
            sort: "nombre",
          }),
        ]);

        if (!cancelled) {
          setDecRecords(dec as unknown as DecRecord[]);
          setProtocolRecords(proto as unknown as ProtocolRecord[]);
          const all = estsList as unknown as EstablecimientoRecord[];
          setAllEsts(all);

          if (isAdmin) {
            setUserEsts(all);
          } else if (user.establecimiento) {
            const ids = Array.isArray(user.establecimiento) ? user.establecimiento : [user.establecimiento];
            setUserEsts(all.filter((e) => ids.includes(e.id)));
          }
        }
      } catch (e: unknown) {
        if (e && typeof e === "object" && "isAbort" in e && !e.isAbort) {
          console.error("Dashboard fetch error:", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey, isAdmin]);

  const dashData = useMemo(() => {
    if (loading) return null;
    return computeDashboardData(
      decRecords,
      protocolRecords,
      filtroEst === "global" ? null : filtroEst,
      isAdmin,
      allEsts,
    );
  }, [decRecords, protocolRecords, filtroEst, isAdmin, loading, allEsts]);

  const isGlobal = filtroEst === "global";

  if (loading || !dashData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Panel de Control</h1>
          <p className="mt-0.5 text-muted-foreground text-sm">
            {filtroEst === "global"
              ? isAdmin
                ? "Vista general de todos los establecimientos"
                : "Estadísticas globales de tus establecimientos"
              : `Estadísticas de ${userEsts.find((e) => e.id === filtroEst)?.nombre || "tu establecimiento"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userEsts.length > 1 && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Select value={filtroEst} onValueChange={setFiltroEst}>
                <SelectTrigger className="h-auto w-[200px] border-0 bg-transparent p-0 font-medium text-sm shadow-none focus:ring-0">
                  <SelectValue placeholder="Seleccionar establecimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">🌐 Vista Global</SelectItem>
                  {userEsts.map((est) => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards data={dashData} isAdmin={isAdmin} />

      {/* Charts row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartDecTendencia
          data={dashData.decPorMes}
          isAdmin={isAdmin && isGlobal}
          establecimientos={
            isAdmin && isGlobal
              ? dashData.decPorMes.length > 0
                ? Object.keys(dashData.decPorMes[0]).filter((k) => k !== "mes" && k !== "total")
                : []
              : undefined
          }
        />
        <ChartProtocolosBar data={dashData.protocolosPorTipo} />
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartConductasPie data={dashData.conductasFrecuentes} />
        <ChartConsecuentesBar data={dashData.consecuentesFrecuentes} />
      </div>

      {/* Últimos registros */}
      <ResumenDecTable data={dashData.ultimosDec} isAdmin={isAdmin} />
    </div>
  );
}
