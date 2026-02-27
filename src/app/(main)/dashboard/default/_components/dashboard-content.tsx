"use client";

import { useEffect, useMemo, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useUser } from "@/hooks/use-user";
import { KpiCards } from "./kpi-cards";
import { ChartDecTendencia } from "./chart-dec-tendencia";
import { ChartProtocolosBar } from "./chart-protocolos-bar";
import { ChartConductasPie } from "./chart-conductas-pie";
import { ChartConsecuentesBar } from "./chart-consecuentes-bar";
import { ResumenDecTable } from "./resumen-table";
import type { DashboardData } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    return `${MESES_ES[parseInt(m) - 1]} ${y.slice(2)}`;
}

function computeDashboardData(
    decRecords: any[],
    protocolRecords: any[],
    filtroEstablecimiento: string | null, // null = global
    isAdmin: boolean,
): DashboardData & { establecimientos: string[] } {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const last6 = getLastNMonths(6);

    // Filter by establecimiento if selected
    const dec = filtroEstablecimiento
        ? decRecords.filter(r => r.expand?.establecimiento?.nombre === filtroEstablecimiento || r.establecimiento === filtroEstablecimiento)
        : decRecords;
    const proto = filtroEstablecimiento
        ? protocolRecords.filter(r => r.expand?.establecimiento?.nombre === filtroEstablecimiento || r.establecimiento === filtroEstablecimiento)
        : protocolRecords;

    // Basic counts
    const totalDec = dec.length;
    const decEsteMes = dec.filter(r => {
        const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
        return d === currentMonth;
    }).length;
    const decMesAnterior = dec.filter(r => {
        const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
        return d === prevMonth;
    }).length;
    const decTrend = decMesAnterior > 0
        ? Math.round(((decEsteMes - decMesAnterior) / decMesAnterior) * 100)
        : undefined;
    const medidasEfectivas = dec.filter(r => r.funciona_medida === true).length;

    // Protocolos
    const totalProtocolos = proto.reduce((s: number, r: any) => s + (Number(r.cantidad) || 0), 0);
    const protocolosEsteMes = proto
        .filter((r: any) => r.meses === currentMonth || r.created?.slice(0, 7) === currentMonth)
        .reduce((s: number, r: any) => s + (Number(r.cantidad) || 0), 0);
    const protocolosMesAnterior = proto
        .filter((r: any) => r.meses === prevMonth || r.created?.slice(0, 7) === prevMonth)
        .reduce((s: number, r: any) => s + (Number(r.cantidad) || 0), 0);
    const protocolosTrend = protocolosMesAnterior > 0
        ? Math.round(((protocolosEsteMes - protocolosMesAnterior) / protocolosMesAnterior) * 100)
        : undefined;

    // Establecimientos activos
    const estabelsSet = new Set<string>();
    [...dec, ...proto].forEach(r => {
        const nombre = r.expand?.establecimiento?.nombre;
        if (nombre) estabelsSet.add(nombre);
    });
    const establecimientosActivos = estabelsSet.size;
    const establecimientos = Array.from(estabelsSet).sort();

    // DEC por mes chart (last 6 months)
    let decPorMes: DashboardData["decPorMes"] = [];
    if (isAdmin && !filtroEstablecimiento) {
        // Lines per establecimiento
        const estList = establecimientos.slice(0, 5); // max 5 para no saturar
        decPorMes = last6.map(m => {
            const obj: { mes: string; total: number;[k: string]: string | number } = {
                mes: formatMesLabel(m),
                total: 0,
            };
            estList.forEach(est => {
                const cnt = dec.filter(r => {
                    const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
                    return d === m && r.expand?.establecimiento?.nombre === est;
                }).length;
                obj[est] = cnt;
                obj.total += cnt;
            });
            return obj;
        });
        // return establecimientos list for chart
        return {
            totalDec, decEsteMes, decTrend, medidasEfectivas,
            totalProtocolos, protocolosEsteMes, protocolosTrend,
            establecimientosActivos,
            decPorMes,
            protocolosPorTipo: computeProtocolosPorTipo(proto),
            conductasFrecuentes: computeConductas(dec),
            consecuentesFrecuentes: computeConsecuentes(dec),
            ultimosDec: computeUltimosDec(dec),
            establecimientos,
        };
    } else {
        decPorMes = last6.map(m => ({
            mes: formatMesLabel(m),
            total: dec.filter(r => {
                const d = r.dia ? r.dia.slice(0, 7) : r.created.slice(0, 7);
                return d === m;
            }).length,
        }));
    }

    return {
        totalDec, decEsteMes, decTrend, medidasEfectivas,
        totalProtocolos, protocolosEsteMes, protocolosTrend,
        establecimientosActivos,
        decPorMes,
        protocolosPorTipo: computeProtocolosPorTipo(proto),
        conductasFrecuentes: computeConductas(dec),
        consecuentesFrecuentes: computeConsecuentes(dec),
        ultimosDec: computeUltimosDec(dec),
        establecimientos,
    };
}

function computeProtocolosPorTipo(proto: any[]) {
    const map: Record<string, number> = {};
    proto.forEach(r => {
        const nombre = r.expand?.protocolo?.item || r.expand?.protocolo?.nombre || r.expand?.protocolo?.name || "Sin nombre";
        map[nombre] = (map[nombre] || 0) + (Number(r.cantidad) || 0);
    });
    return Object.entries(map).map(([nombre, total]) => ({ nombre, total }));
}

function computeConductas(dec: any[]) {
    const map: Record<string, number> = {};
    dec.forEach(r => {
        const arr: string[] = Array.isArray(r.conductas) ? r.conductas : [];
        arr.forEach(c => { map[c] = (map[c] || 0) + 1; });
    });
    return Object.entries(map).map(([nombre, total]) => ({ nombre, total }));
}

function computeConsecuentes(dec: any[]) {
    const map: Record<string, number> = {};
    dec.forEach(r => {
        const arr: string[] = Array.isArray(r.consecuentes) ? r.consecuentes : [];
        arr.forEach(c => { map[c] = (map[c] || 0) + 1; });
    });
    return Object.entries(map).map(([nombre, total]) => ({ nombre, total }));
}

function computeUltimosDec(dec: any[]) {
    return [...dec]
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
        .slice(0, 10)
        .map(r => ({
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

    const [decRecords, setDecRecords] = useState<any[]>([]);
    const [protocolRecords, setProtocolRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroEst, setFiltroEst] = useState<string>("global");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);

        const fetchAll = async () => {
            try {
                const filter = !isAdmin && user.establecimiento
                    ? `establecimiento = "${user.establecimiento}"`
                    : "";

                const [dec, proto] = await Promise.all([
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
                ]);

                if (!cancelled) {
                    setDecRecords(dec as any[]);
                    setProtocolRecords(proto as any[]);
                }
            } catch (e: any) {
                if (!e.isAbort) console.error("Dashboard fetch error:", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchAll();
        return () => { cancelled = true; };
    }, [user, refreshKey]);

    const dashData = useMemo(() => {
        if (loading) return null;
        return computeDashboardData(
            decRecords,
            protocolRecords,
            filtroEst === "global" ? null : filtroEst,
            isAdmin,
        );
    }, [decRecords, protocolRecords, filtroEst, isAdmin, loading]);

    const establecimientos = dashData?.establecimientos ?? [];
    const isGlobal = filtroEst === "global";

    if (loading || !dashData) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map(i => (
                        <div key={i} className="h-72 rounded-xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {isAdmin
                            ? "Vista general de todos los establecimientos"
                            : "Estadísticas de tu establecimiento"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && establecimientos.length > 0 && (
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Select value={filtroEst} onValueChange={setFiltroEst}>
                                <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 text-sm font-medium w-[200px] focus:ring-0">
                                    <SelectValue placeholder="Seleccionar establecimiento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">🌐 Vista Global</SelectItem>
                                    {establecimientos.map(est => (
                                        <SelectItem key={est} value={est}>{est}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRefreshKey(k => k + 1)}
                        className="gap-1.5"
                    >
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
                    establecimientos={isAdmin && isGlobal ? establecimientos.slice(0, 5) : undefined}
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
