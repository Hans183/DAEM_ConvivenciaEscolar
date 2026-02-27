"use client";

import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DashboardData } from "./types";

interface ChartConductasPieProps {
    data: DashboardData["conductasFrecuentes"];
}

const COLORS = [
    "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#d97706",
    "#16a34a", "#0891b2", "#4f46e5", "#be185d", "#b45309",
];

export function ChartConductasPie({ data }: ChartConductasPieProps) {
    const top = [...data].sort((a, b) => b.total - a.total).slice(0, 7);
    const total = top.reduce((s, d) => s + d.total, 0);

    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
        cx: number; cy: number; midAngle: number;
        innerRadius: number; outerRadius: number; percent: number;
    }) => {
        if (percent < 0.06) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Conductas más Frecuentes</CardTitle>
                <CardDescription>Distribución de conductas registradas en DEC ({total} menciones)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={top}
                            dataKey="total"
                            nameKey="nombre"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={100}
                            labelLine={false}
                            label={renderLabel}
                        >
                            {top.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                            }}
                            formatter={(value: number) => [value, "Registros"]}
                        />
                        <Legend
                            formatter={(value: string) => value.length > 30 ? value.slice(0, 30) + "…" : value}
                            wrapperStyle={{ fontSize: "11px" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
