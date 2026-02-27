"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "./types";

interface ResumenDecTableProps {
    data: DashboardData["ultimosDec"];
    isAdmin: boolean;
}

export function ResumenDecTable({ data, isAdmin }: ResumenDecTableProps) {
    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Últimos Registros DEC</CardTitle>
                <CardDescription>Los 10 registros DEC más recientes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estudiante</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Curso</th>
                                {isAdmin && (
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Establecimiento</th>
                                )}
                                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Medida Efectiva</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="text-center py-10 text-muted-foreground">
                                        No hay registros DEC aún.
                                    </td>
                                </tr>
                            ) : (
                                data.map((rec, i) => (
                                    <tr key={rec.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"} hover:bg-muted/40 transition-colors`}>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                            {rec.dia ? new Date(rec.dia).toLocaleDateString("es-CL") : "—"}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {rec.nombre_estudiante || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {rec.curso_estudiante || "—"}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {rec.establecimiento ? (
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                                        {rec.establecimiento.length > 25
                                                            ? rec.establecimiento.slice(0, 25) + "…"
                                                            : rec.establecimiento}
                                                    </span>
                                                ) : "—"}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-center">
                                            {rec.funciona_medida ? (
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0 text-xs">
                                                    Sí
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0 text-xs">
                                                    No
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
