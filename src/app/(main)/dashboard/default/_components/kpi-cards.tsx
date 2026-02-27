"use client";

import { FileText, ShieldAlert, CheckCircle2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "./types";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
    data: DashboardData;
    isAdmin: boolean;
}

function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: { value: number; label: string };
    color: "blue" | "orange" | "green" | "purple";
}) {
    const colors = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-950/30",
            icon: "text-blue-600 dark:text-blue-400",
            badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
        },
        orange: {
            bg: "bg-orange-50 dark:bg-orange-950/30",
            icon: "text-orange-600 dark:text-orange-400",
            badge: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
        },
        green: {
            bg: "bg-green-50 dark:bg-green-950/30",
            icon: "text-green-600 dark:text-green-400",
            badge: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-950/30",
            icon: "text-purple-600 dark:text-purple-400",
            badge: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
        },
    };

    const c = colors[color];

    return (
        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <div className="mt-3">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                        trend.value >= 0
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                    )}
                                >
                                    {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-xl", c.bg)}>
                        <Icon className={cn("h-6 w-6", c.icon)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function KpiCards({ data, isAdmin }: KpiCardsProps) {
    const pctMedidas = data.totalDec > 0
        ? Math.round((data.medidasEfectivas / data.totalDec) * 100)
        : 0;

    return (
        <div className={cn("grid gap-4", isAdmin ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
            <KpiCard
                title="Registros DEC (este mes)"
                value={data.decEsteMes}
                subtitle={`${data.totalDec} total acumulado`}
                icon={FileText}
                color="blue"
                trend={data.decTrend !== undefined ? { value: data.decTrend, label: "vs mes anterior" } : undefined}
            />
            <KpiCard
                title="Protocolos Activados (este mes)"
                value={data.protocolosEsteMes}
                subtitle={`${data.totalProtocolos} activaciones totales`}
                icon={ShieldAlert}
                color="orange"
                trend={data.protocolosTrend !== undefined ? { value: data.protocolosTrend, label: "vs mes anterior" } : undefined}
            />
            <KpiCard
                title="Medidas Efectivas"
                value={`${pctMedidas}%`}
                subtitle={`${data.medidasEfectivas} de ${data.totalDec} casos`}
                icon={CheckCircle2}
                color="green"
            />
            {isAdmin && (
                <KpiCard
                    title="Establecimientos Activos"
                    value={data.establecimientosActivos}
                    subtitle="con actividad este mes"
                    icon={Building2}
                    color="purple"
                />
            )}
        </div>
    );
}
