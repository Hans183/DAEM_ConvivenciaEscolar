"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DashboardData } from "./types";

interface ChartProtocolosBarProps {
    data: DashboardData["protocolosPorTipo"];
}

const PALETTE = [
    "#f97316", "#fb923c", "#fdba74", "#d97706", "#f59e0b",
    "#fbbf24", "#fcd34d", "#a16207", "#854d0e", "#78350f",
];

export function ChartProtocolosBar({ data }: ChartProtocolosBarProps) {
    const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 8);

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Protocolos Activados por Tipo</CardTitle>
                <CardDescription>Total de activaciones agrupadas por protocolo</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={sorted}
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
                            formatter={(value: number) => [value, "Activaciones"]}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                            {sorted.map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                            <LabelList dataKey="total" position="right" style={{ fontSize: "12px", fill: "hsl(var(--muted-foreground))" }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
