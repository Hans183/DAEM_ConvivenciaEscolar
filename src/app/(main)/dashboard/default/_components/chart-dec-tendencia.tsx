"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DashboardData } from "./types";

const COLORS = [
    "#2563eb", "#16a34a", "#d97706", "#9333ea", "#e11d48", "#0891b2",
];

interface ChartDecTendenciaProps {
    data: DashboardData["decPorMes"];
    isAdmin: boolean;
    establecimientos?: string[];
}

export function ChartDecTendencia({ data, isAdmin, establecimientos }: ChartDecTendenciaProps) {
    const hasEstablecimientos = isAdmin && establecimientos && establecimientos.length > 0;

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Tendencia DEC — Últimos 6 Meses</CardTitle>
                <CardDescription>Registros de Documentos de Entrevista y Compromiso por mes</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            {hasEstablecimientos ? (
                                establecimientos!.map((est, i) => (
                                    <linearGradient key={est} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))
                            ) : (
                                <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            )}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="mes"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                            }}
                        />
                        {hasEstablecimientos ? (
                            <>
                                <Legend />
                                {establecimientos!.map((est, i) => (
                                    <Area
                                        key={est}
                                        type="monotone"
                                        dataKey={est}
                                        name={est}
                                        stroke={COLORS[i % COLORS.length]}
                                        fill={`url(#grad-${i})`}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                ))}
                            </>
                        ) : (
                            <Area
                                type="monotone"
                                dataKey="total"
                                name="Registros DEC"
                                stroke="#2563eb"
                                fill="url(#grad-total)"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#2563eb" }}
                                activeDot={{ r: 6 }}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
