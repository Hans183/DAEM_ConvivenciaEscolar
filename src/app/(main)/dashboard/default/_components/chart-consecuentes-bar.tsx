"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DashboardData } from "./types";

const COLORS = [
    "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0",
    "#15803d", "#166534", "#14532d", "#052e16",
];

interface ChartConsecuentesBarProps {
    data: DashboardData["consecuentesFrecuentes"];
}

export function ChartConsecuentesBar({ data }: ChartConsecuentesBarProps) {
    const top = [...data].sort((a, b) => b.total - a.total).slice(0, 8);

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Consecuentes más Aplicados</CardTitle>
                <CardDescription>Medidas tomadas con mayor frecuencia en registros DEC</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={top}
                        layout="vertical"
                        margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="nombre"
                            width={160}
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + "…" : v}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                            }}
                            formatter={(value: number) => [value, "Veces aplicado"]}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                            {top.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                            <LabelList dataKey="total" position="right" style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
