"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { jsPDF } from "jspdf";
import { AlertTriangle, Building2, Calendar, CheckSquare, Download, FileText, Loader2, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { pb } from "@/lib/pocketbase";
import { hasRole } from "@/lib/roles";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Establecimiento {
  id: string;
  nombre: string;
  rbd: number;
}

interface Protocolo {
  id: string;
  nombre: string;
  item?: string;
  name?: string;
}

interface ProtocolActivation {
  id: string;
  cantidad: number;
  meses: string;
  protocolo: string;
  establecimiento: string;
  created: string;
  expand?: {
    protocolo?: Protocolo;
    establecimiento?: Establecimiento;
  };
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const YEARS = ["2024", "2025", "2026", "2027"];

export function ReportModal({ open, onOpenChange }: ReportModalProps) {
  const user = useUser();
  const isAdmin = hasRole(user?.role, "admin");

  const [loading, setLoading] = useState(false);
  const [fetchingEsts, setFetchingEsts] = useState(false);
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [selectedEsts, setSelectedEsts] = useState<Record<string, boolean>>({});

  // Configuración de Período
  const [periodType, setPeriodType] = useState<"mensual" | "semestral" | "anual">("mensual");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [selectedSemester, setSelectedSemester] = useState<"1" | "2">("1");

  // Cargar establecimientos según rol de usuario
  useEffect(() => {
    if (!open || !user) return;

    const loadEsts = async () => {
      setFetchingEsts(true);
      try {
        const list = await pb.collection("establecimientos").getFullList({
          sort: "nombre",
        });
        const all = list as unknown as Establecimiento[];

        let filtered: Establecimiento[] = [];
        if (isAdmin) {
          filtered = all;
        } else if (user?.establecimiento) {
          const ids = Array.isArray(user.establecimiento) ? user.establecimiento : [user.establecimiento];
          filtered = all.filter((e) => ids.includes(e.id));
        }

        setEstablecimientos(filtered);

        // Inicializar todos seleccionados por defecto
        const initialSelection: Record<string, boolean> = {};
        for (const est of filtered) {
          initialSelection[est.id] = true;
        }
        setSelectedEsts(initialSelection);
      } catch (error) {
        console.error("Error loading establishments for report:", error);
        toast.error("Error al cargar establecimientos");
      } finally {
        setFetchingEsts(false);
      }
    };

    loadEsts();
  }, [open, user, isAdmin]);

  const toggleSelectAll = (select: boolean) => {
    const nextSelection: Record<string, boolean> = {};
    for (const est of establecimientos) {
      nextSelection[est.id] = select;
    }
    setSelectedEsts(nextSelection);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedEsts((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const activeEstCount = Object.values(selectedEsts).filter(Boolean).length;

  // Generar y descargar reporte PDF
  const handleGenerateReport = async () => {
    const estIdsToReport = Object.keys(selectedEsts).filter((id) => selectedEsts[id]);

    if (estIdsToReport.length === 0) {
      toast.warning("Por favor seleccione al menos un establecimiento para el reporte.");
      return;
    }

    setLoading(true);
    try {
      // 1. Construir filtros según periodo
      const queryFilters: string[] = [];

      // Filtro de año
      queryFilters.push(`created >= "${selectedYear}-01-01 00:00:00" && created <= "${selectedYear}-12-31 23:59:59"`);

      // Filtro de meses según tipo de periodo
      let periodLabel = "";
      let monthsToSearch: string[] = [];

      if (periodType === "mensual") {
        queryFilters.push(`meses = "${selectedMonth}"`);
        periodLabel = `Mensual - ${selectedMonth} de ${selectedYear}`;
        monthsToSearch = [selectedMonth];
      } else if (periodType === "semestral") {
        if (selectedSemester === "1") {
          monthsToSearch = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"];
          periodLabel = `Semestral - 1º Semestre de ${selectedYear} (Ene - Jun)`;
        } else {
          monthsToSearch = ["Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
          periodLabel = `Semestral - 2º Semestre de ${selectedYear} (Jul - Dic)`;
        }
        const monthsQuery = monthsToSearch.map((m) => `meses = "${m}"`).join(" || ");
        queryFilters.push(`(${monthsQuery})`);
      } else {
        periodLabel = `Anual - Año ${selectedYear}`;
        monthsToSearch = MONTHS;
      }

      const finalFilter = queryFilters.join(" && ");

      // 2. Fetch de datos
      const records = (await pb.collection("activacion_protocolos").getFullList({
        filter: finalFilter,
        expand: "protocolo,establecimiento",
      })) as unknown as ProtocolActivation[];

      // 3. Procesar datos
      const selectedEstsList = establecimientos.filter((e) => selectedEsts[e.id]);
      const selectedEstsMap = new Map(selectedEstsList.map((e) => [e.id, e]));

      // Filtrar registros que pertenezcan a los establecimientos seleccionados
      const filteredRecords = records.filter((r) => selectedEstsMap.has(r.establecimiento));

      // Calcular activaciones por establecimiento
      const estReportData = selectedEstsList.map((est) => {
        const estRecords = filteredRecords.filter((r) => r.establecimiento === est.id);
        const totalCantidad = estRecords.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0);
        return {
          ...est,
          total: totalCantidad,
          hasReported: estRecords.length > 0,
        };
      });

      // Ordenar por cantidad
      const estReportDataSorted = [...estReportData].sort((a, b) => b.total - a.total);

      // Quienes sí y quienes no ingresaron datos
      const ingresaron = estReportData.filter((e) => e.hasReported);
      const noIngresaron = estReportData.filter((e) => !e.hasReported);

      // Calcular activaciones por protocolo
      const protocolMap: Record<string, { nombre: string; total: number }> = {};
      for (const r of filteredRecords) {
        const protoName =
          r.expand?.protocolo?.nombre || r.expand?.protocolo?.item || r.expand?.protocolo?.name || "Desconocido";
        if (!protocolMap[protoName]) {
          protocolMap[protoName] = { nombre: protoName, total: 0 };
        }
        protocolMap[protoName].total += Number(r.cantidad) || 0;
      }
      const protocolDataSorted = Object.values(protocolMap).sort((a, b) => b.total - a.total);

      // 4. Crear PDF usando jsPDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let currentY = 15;

      // Contexto de tabla para repetir cabeceras en saltos de página
      let activeTableHeaders: string[] | null = null;
      let activeTableColWidths: number[] | null = null;
      let activeTableIsWarning = false;

      // Helper para saltos de página con soporte de repetición de cabeceras
      const ensureSpace = (needed: number) => {
        if (currentY + needed > pageHeight - margin) {
          doc.addPage();

          // Encabezado simple en cada nueva página
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(150, 150, 150);
          doc.text("DAEM La Unión - Convivencia Escolar", margin, 10);
          doc.text(`Período: ${periodLabel}`, pageWidth - margin, 10, { align: "right" });
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(margin, 12, pageWidth - margin, 12);

          currentY = 20;

          // Si estamos dibujando una tabla, repetir cabeceras en la nueva página
          const headers = activeTableHeaders;
          const widths = activeTableColWidths;
          if (headers && widths) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            if (activeTableIsWarning) {
              doc.setFillColor(254, 226, 226);
              doc.setTextColor(153, 27, 27);
            } else {
              doc.setFillColor(219, 234, 254);
              doc.setTextColor(30, 58, 138);
            }

            doc.rect(
              margin,
              currentY,
              widths.reduce((a, b) => a + b, 0),
              8,
              "F",
            );

            let currentX = margin;
            headers.forEach((header, idx) => {
              doc.text(header, currentX + 3, currentY + 5.5);
              currentX += widths[idx];
            });

            currentY += 8;
          }
          return true;
        }
        return false;
      };

      // Encabezado Principal (Primera Página)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("ILUSTRE MUNICIPALIDAD DE LA UNIÓN", margin, currentY);
      currentY += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("DEPARTAMENTO DE ADMINISTRACIÓN DE EDUCACIÓN MUNICIPAL", margin, currentY);
      doc.text("ÁREA DE CONVIVENCIA ESCOLAR", margin, currentY + 4);

      // Fecha a la derecha
      const fechaEmision = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
      doc.text(`Fecha Emisión: ${fechaEmision}`, pageWidth - margin, currentY, { align: "right" });

      currentY += 12;

      // Título del Reporte
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(29, 78, 216); // Indigo-700
      doc.text("INFORME DE ACTIVACIÓN DE PROTOCOLOS", margin, currentY);
      currentY += 6;
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`PERÍODO: ${periodLabel.toUpperCase()}`, margin, currentY);

      currentY += 6;
      doc.setDrawColor(29, 78, 216);
      doc.setLineWidth(0.8);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 10;

      // Resumen / KPIs en cajas
      ensureSpace(30);
      const kpiWidth = (pageWidth - margin * 2 - 9) / 4; // 4 cajas
      const kpis = [
        { label: "Establecimientos", value: selectedEstsList.length, color: [241, 245, 249], textCol: [30, 41, 59] },
        {
          label: "Total Reportes",
          value: filteredRecords.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0),
          color: [239, 246, 255],
          textCol: [29, 78, 216],
        },
        { label: "Reportaron", value: ingresaron.length, color: [240, 253, 244], textCol: [22, 101, 52] },
        { label: "Sin Reportar", value: noIngresaron.length, color: [254, 242, 242], textCol: [153, 27, 27] },
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (kpiWidth + 3);
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.rect(x, currentY, kpiWidth, 18, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, x + 3, currentY + 5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(kpi.textCol[0], kpi.textCol[1], kpi.textCol[2]);
        doc.text(String(kpi.value), x + 3, currentY + 13);
      });

      currentY += 26;

      // Sección 1: Gráficos
      ensureSpace(12);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("1. RESUMEN GRÁFICO", margin, currentY);
      currentY += 4;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      // Gráfico 1: Reportes por establecimiento
      ensureSpace(65);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Cantidad de Protocolos Activados por Establecimiento", margin, currentY);
      currentY += 5;

      // Dibujar gráfico de barras horizontal para establecimientos
      const chartX = margin + 55; // Dar espacio a las etiquetas
      const chartWidth = pageWidth - margin * 2 - 60;
      const chartHeight = 45;

      const drawHorizontalChart = (
        items: { label: string; value: number }[],
        startX: number,
        startY: number,
        width: number,
        height: number,
      ) => {
        if (items.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(150, 150, 150);
          doc.text("No se registran datos para mostrar en este gráfico.", startX + width / 2, startY + height / 2, {
            align: "center",
          });
          return;
        }

        const maxVal = Math.max(...items.map((d) => d.value), 1);
        const barHeight = Math.min(6, (height - 5) / items.length);
        const gap = Math.min(2.5, (height - items.length * barHeight) / (items.length + 1));

        // Eje Y
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(startX, startY, startX, startY + height);
        // Eje X
        doc.line(startX, startY + height, startX + width, startY + height);

        items.forEach((item, index) => {
          const barY = startY + gap + index * (barHeight + gap);
          const barValWidth = (item.value / maxVal) * (width - 15);

          // Dibujar Barra
          doc.setFillColor(37, 99, 235); // Blue-600
          doc.rect(startX, barY, barValWidth, barHeight, "F");

          // Etiqueta del Valor
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(50, 50, 50);
          doc.text(String(item.value), startX + barValWidth + 2, barY + barHeight - 1);

          // Etiqueta de la Categoría (Establecimiento)
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(70, 70, 70);
          const cleanLabel = item.label.length > 38 ? `${item.label.substring(0, 35)}...` : item.label;
          doc.text(cleanLabel, startX - 2, barY + barHeight - 1, { align: "right" });
        });
      };

      const estChartData = estReportDataSorted.slice(0, 8).map((d) => ({
        label: d.nombre,
        value: d.total,
      }));

      drawHorizontalChart(estChartData, chartX, currentY, chartWidth, chartHeight);
      currentY += chartHeight + 12;

      // Gráfico 2: Protocolos más activados (Circular / Donut)
      ensureSpace(65);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Distribución de Protocolos más Activados", margin, currentY);
      currentY += 5;

      const protoChartData = protocolDataSorted.slice(0, 8).map((d) => ({
        label: d.nombre,
        value: d.total,
      }));

      // Dibujar gráfico circular (Donut chart)
      const drawDonutChart = (items: { label: string; value: number }[], cx: number, cy: number, r: number) => {
        const total = items.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(150, 150, 150);
          doc.text("No se registran activaciones en este período.", cx, cy, { align: "center" });
          return;
        }

        const sliceColors = [
          [37, 99, 235], // Azul
          [220, 38, 38], // Rojo
          [22, 163, 74], // Verde
          [217, 119, 6], // Ámbar
          [147, 51, 234], // Púrpura
          [8, 145, 178], // Cian
          [225, 29, 72], // Rosa
          [79, 70, 229], // Índigo
        ];

        let currentAngle = -Math.PI / 2; // Empezar a las 12 en punto

        items.forEach((item, index) => {
          const sliceAngle = (item.value / total) * 2 * Math.PI;
          const endAngle = currentAngle + sliceAngle;
          const color = sliceColors[index % sliceColors.length];

          // Dibujar sector circular usando triángulos contiguos
          const segments = 30;
          const delta = sliceAngle / segments;

          doc.setFillColor(color[0], color[1], color[2]);

          for (let i = 0; i < segments; i++) {
            const angle1 = currentAngle + i * delta;
            const angle2 = currentAngle + (i + 1) * delta;

            const x1 = cx + r * Math.cos(angle1);
            const y1 = cy + r * Math.sin(angle1);
            const x2 = cx + r * Math.cos(angle2);
            const y2 = cy + r * Math.sin(angle2);

            doc.triangle(cx, cy, x1, y1, x2, y2, "F");
          }

          currentAngle = endAngle;
        });

        // Efecto Donut (Círculo central blanco)
        doc.setFillColor(255, 255, 255);
        doc.circle(cx, cy, r * 0.5, "F");

        // Leyenda
        let legendY = cy - r + 2;
        const legendX = cx + r + 10;

        items.forEach((item, index) => {
          const color = sliceColors[index % sliceColors.length];
          const percentage = ((item.value / total) * 100).toFixed(1);

          // Cuadrado de color
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(legendX, legendY, 3, 3, "F");

          // Texto
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(60, 60, 60);
          const truncatedLabel = item.label.length > 45 ? `${item.label.substring(0, 42)}...` : item.label;
          doc.text(`${truncatedLabel}: ${item.value} (${percentage}%)`, legendX + 5, legendY + 2.5);

          legendY += 5;
        });
      };

      // Dibujar Donut Chart centrado en X con radio 20
      drawDonutChart(protoChartData, margin + 25, currentY + 22, 20);
      currentY += 45 + 15;

      // --- PAGINA 2: TABLAS DE DETALLE ---
      // Forzar salto de página para que las tablas comiencen limpias en la Página 2
      doc.addPage();

      // Dibujar encabezado en la Página 2
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("DAEM La Unión - Convivencia Escolar", margin, 10);
      doc.text(`Período: ${periodLabel}`, pageWidth - margin, 10, { align: "right" });
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);

      currentY = 20;

      // Sección 2: Tablas de detalle
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("2. DETALLE DE ESTABLECIMIENTOS QUE INFORMARON", margin, currentY);
      currentY += 4;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;

      // Helper para renderizar tablas con contexto activo para cabeceras repetidas
      const drawTable = (headers: string[], rows: string[][], colWidths: number[], isWarning = false) => {
        // Establecer contexto de tabla activa para la repetición de cabeceras en saltos de página
        activeTableHeaders = headers;
        activeTableColWidths = colWidths;
        activeTableIsWarning = isWarning;

        // Cabecera inicial de la tabla
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        if (isWarning) {
          doc.setFillColor(254, 226, 226); // Rojo suave
          doc.setTextColor(153, 27, 27);
        } else {
          doc.setFillColor(219, 234, 254); // Azul suave
          doc.setTextColor(30, 58, 138);
        }

        doc.rect(
          margin,
          currentY,
          colWidths.reduce((a, b) => a + b, 0),
          8,
          "F",
        );

        let startX = margin;
        headers.forEach((header, idx) => {
          doc.text(header, startX + 3, currentY + 5.5);
          startX += colWidths[idx];
        });

        currentY += 8;

        // Filas
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        if (rows.length === 0) {
          ensureSpace(8);
          doc.setFillColor(255, 255, 255);
          doc.rect(
            margin,
            currentY,
            colWidths.reduce((a, b) => a + b, 0),
            7,
            "F",
          );
          doc.text("No se registran establecimientos en esta categoría.", margin + 5, currentY + 5);
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(margin, currentY + 7, margin + colWidths.reduce((a, b) => a + b, 0), currentY + 7);
          currentY += 7;
        } else {
          rows.forEach((row, rowIdx) => {
            ensureSpace(8); // Esto disparará la nueva página y repetirá cabeceras si excede el límite

            // Zebra striping
            if (rowIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
            } else {
              doc.setFillColor(255, 255, 255);
            }
            doc.rect(
              margin,
              currentY,
              colWidths.reduce((a, b) => a + b, 0),
              7,
              "F",
            );

            let cellX = margin;
            row.forEach((cell, cellIdx) => {
              const text = String(cell);
              const cellWidth = colWidths[cellIdx] - 5;
              const lines = doc.splitTextToSize(text, cellWidth);
              doc.text(lines[0], cellX + 3, currentY + 4.8);
              cellX += colWidths[cellIdx];
            });

            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.line(margin, currentY + 7, margin + colWidths.reduce((a, b) => a + b, 0), currentY + 7);
            currentY += 7;
          });
        }

        // Limpiar contexto de tabla activa
        activeTableHeaders = null;
        activeTableColWidths = null;
      };

      // Datos Tabla 1: Reportaron
      const headers1 = ["RBD", "Establecimiento", "Total Activaciones", "Estado"];
      const colWidths1 = [25, 100, 30, 25];
      const rows1 = ingresaron.map((e) => [String(e.rbd || "N/A"), e.nombre, String(e.total), "Informado"]);

      drawTable(headers1, rows1, colWidths1);
      currentY += 12;

      // Sección 3: Sin registros (FALTA DE INFORMACIÓN)
      ensureSpace(30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28); // Rojo
      doc.text("3. DETALLE DE ESTABLECIMIENTOS SIN REGISTROS (FALTA DE INFORMACIÓN)", margin, currentY);
      currentY += 4;
      doc.setDrawColor(252, 165, 165); // Borde rojo suave
      doc.setLineWidth(0.4);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;

      // Datos Tabla 2: No ingresaron
      const headers2 = ["RBD", "Establecimiento", "Estado", "Observación"];
      const colWidths2 = [25, 95, 30, 30];
      const rows2 = noIngresaron.map((e) => [
        String(e.rbd || "N/A"),
        e.nombre,
        "No Registra Ingresos",
        "Falta Información",
      ]);

      drawTable(headers2, rows2, colWidths2, true);

      // Pie de Página final
      ensureSpace(25);
      currentY += 10;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Este reporte ha sido generado de forma automatizada por el sistema de Convivencia Escolar DAEM La Unión.",
        margin,
        currentY,
      );
      doc.text(
        "Cualquier discrepancia de información debe ser reportada y corregida por el encargado de convivencia del establecimiento correspondiente.",
        margin,
        currentY + 4,
      );

      // Guardar PDF
      const formattedPeriod = periodLabel.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      doc.save(`Reporte_Activacion_Protocolos_${formattedPeriod}.pdf`);
      toast.success("Reporte generado e iniciado la descarga.");
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating report PDF:", error);
      toast.error("Error al generar el reporte en PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[650px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 font-bold text-slate-800 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            Configurar Reporte de Activaciones
          </DialogTitle>
          <DialogDescription>
            Configure el periodo de tiempo y los establecimientos que desea evaluar en el informe consolidado.
          </DialogDescription>
        </DialogHeader>

        {fetchingEsts ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-500 text-sm">Cargando establecimientos...</p>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            {/* Paso 1: Tipo de Reporte / Periodo */}
            <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>1. Configurar Periodo de Tiempo</span>
              </div>

              {/* Botones de Periodo Rápido */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={periodType === "mensual" ? "default" : "outline"}
                  className="h-8 flex-1 text-xs"
                  onClick={() => setPeriodType("mensual")}
                >
                  Mensual
                </Button>
                <Button
                  type="button"
                  variant={periodType === "semestral" ? "default" : "outline"}
                  className="h-8 flex-1 text-xs"
                  onClick={() => setPeriodType("semestral")}
                >
                  Semestral
                </Button>
                <Button
                  type="button"
                  variant={periodType === "anual" ? "default" : "outline"}
                  className="h-8 flex-1 text-xs"
                  onClick={() => setPeriodType("anual")}
                >
                  Anual
                </Button>
              </div>

              {/* Controles dinámicos según el tipo de periodo */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Selector de Año */}
                <div className="space-y-1.5">
                  <Label htmlFor="year-select" className="text-slate-500 text-xs">
                    Año
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select" className="h-9">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de Mes (solo para mensual) */}
                {periodType === "mensual" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="month-select" className="text-slate-500 text-xs">
                      Mes
                    </Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger id="month-select" className="h-9">
                        <SelectValue placeholder="Mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Selector de Semestre (solo para semestral) */}
                {periodType === "semestral" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="semester-select" className="text-slate-500 text-xs">
                      Semestre
                    </Label>
                    <Select value={selectedSemester} onValueChange={(val: "1" | "2") => setSelectedSemester(val)}>
                      <SelectTrigger id="semester-select" className="h-9">
                        <SelectValue placeholder="Semestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Semestre (Ene-Jun)</SelectItem>
                        <SelectItem value="2">2º Semestre (Jul-Dic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Paso 2: Filtro de Establecimientos */}
            <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span>2. Establecimientos a Evaluar</span>
                </div>
                <div className="text-slate-500 text-xs">
                  {activeEstCount} de {establecimientos.length} seleccionados
                </div>
              </div>

              {/* Botones de acción rápida */}
              <div className="flex gap-2 pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-blue-600 text-xs hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => toggleSelectAll(true)}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Seleccionar Todos
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-slate-600 text-xs hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => toggleSelectAll(false)}
                >
                  <Square className="h-3.5 w-3.5" />
                  Deseleccionar Todos
                </Button>
              </div>

              {/* Lista scrollable de establecimientos */}
              <ScrollArea className="h-[180px] rounded-md border border-slate-200 bg-white p-3">
                <div className="space-y-2.5">
                  {establecimientos.map((est) => (
                    <div key={est.id} className="flex items-start gap-2.5">
                      <Checkbox
                        id={`est-${est.id}`}
                        checked={!!selectedEsts[est.id]}
                        onCheckedChange={(checked) => handleCheckboxChange(est.id, !!checked)}
                        className="mt-0.5"
                      />
                      <div className="grid gap-0.5 leading-none">
                        <Label
                          htmlFor={`est-${est.id}`}
                          className="cursor-pointer font-medium text-slate-700 text-xs hover:text-slate-900"
                        >
                          {est.nombre}
                        </Label>
                        <span className="text-[10px] text-slate-400">RBD: {est.rbd || "N/A"}</span>
                      </div>
                    </div>
                  ))}
                  {establecimientos.length === 0 && (
                    <div className="py-6 text-center text-slate-500 text-xs">No hay establecimientos disponibles.</div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Advertencia de Falta de Información */}
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-amber-800 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">Nota de Cumplimiento: </span>
                El informe contrastará automáticamente los establecimientos seleccionados con la base de datos de
                activaciones, identificando y listando a aquellos que no informaron ningún protocolo para el periodo
                establecido.
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex shrink-0 items-center justify-end gap-2 border-slate-100 border-t pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGenerateReport}
            disabled={loading || fetchingEsts || activeEstCount === 0}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar Reporte PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
