import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DecRecord } from "./columns";

export const generateDecPDF = (record: DecRecord) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 15;

    // --- Helpers ---

    const checkPageBreak = (needed: number) => {
        if (y + needed > 270) {
            doc.addPage();
            y = 20;
            return true;
        }
        return false;
    };

    const addCenteredText = (text: string, fontSize: number, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, y);
        y += fontSize / 2 + 4;
    };

    const addSectionTitle = (title: string) => {
        checkPageBreak(15);
        y += 5;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 5, pageWidth - (margin * 2), 7, "F");
        doc.setTextColor(50, 50, 50);
        doc.text(title, margin + 2, y);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 10;
        doc.setTextColor(0, 0, 0);
    };

    const addField = (label: string, value: any, indent = 0) => {
        // Return false if value is empty/null/false
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
            return false;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const labelText = `${label}: `;
        const labelWidth = doc.getTextWidth(labelText);

        let displayValue = "";
        if (Array.isArray(value)) {
            displayValue = value.join(", ");
        } else if (typeof value === "boolean") {
            displayValue = value ? "Sí" : "No";
        } else {
            displayValue = String(value);
        }

        const maxWidth = pageWidth - margin * 2 - labelWidth - indent - 2;
        const lines = doc.splitTextToSize(displayValue, maxWidth);

        checkPageBreak(lines.length * 5 + 2);

        doc.setFont("helvetica", "bold");
        doc.text(labelText, margin + indent, y);

        doc.setFont("helvetica", "normal");
        doc.text(lines, margin + indent + labelWidth + 1, y);

        y += (lines.length * 5) + 2;
        return true;
    };

    // Helper for 2 column layout for short fields
    const addTwoFields = (label1: string, val1: any, label2: string, val2: any) => {
        if (!val1 && !val2) return;

        const colWidth = (pageWidth - margin * 2) / 2;

        doc.setFontSize(10);
        let maxLines = 0;

        // Draw First Field
        if (val1) {
            doc.setFont("helvetica", "bold");
            doc.text(`${label1}: `, margin, y);
            doc.setFont("helvetica", "normal");
            const l1Width = doc.getTextWidth(`${label1}: `);
            const v1 = String(val1);
            const lines1 = doc.splitTextToSize(v1, colWidth - l1Width - 5);
            doc.text(lines1, margin + l1Width + 1, y);
            maxLines = Math.max(maxLines, lines1.length);
        }

        // Draw Second Field
        if (val2) {
            doc.setFont("helvetica", "bold");
            doc.text(`${label2}: `, margin + colWidth, y);
            doc.setFont("helvetica", "normal");
            const l2Width = doc.getTextWidth(`${label2}: `);
            const v2 = String(val2);
            const lines2 = doc.splitTextToSize(v2, colWidth - l2Width - 5);
            doc.text(lines2, margin + colWidth + l2Width + 1, y);
            maxLines = Math.max(maxLines, lines2.length);
        }

        if (maxLines > 0) {
            y += (maxLines * 5) + 2;
            checkPageBreak(5);
        }
    };

    // --- Start Generation ---

    // Institutional Header Rigth
    const headerText = "DAEM La Unión, Convivencia Escolar";
    const dateToday = format(new Date(), "dd/MM/yyyy");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const headerWidth = doc.getTextWidth(headerText);
    const dateWidth = doc.getTextWidth(dateToday);

    doc.text(headerText, pageWidth - margin - headerWidth, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(dateToday, pageWidth - margin - dateWidth, y);
    y += 12;

    addCenteredText("DOCUMENTO DE ENTREVISTA Y COMPROMISO (DEC)", 14, true);
    if (record.expand?.establecimiento?.nombre) {
        addCenteredText(record.expand.establecimiento.nombre.toUpperCase(), 11, false);
    }
    y += 5;

    // Section 1
    addSectionTitle("I. IDENTIFICACIÓN Y DATOS GENERALES");
    const fecha = record.dia ? format(new Date(record.dia), "PPPP", { locale: es }) : "-";
    addField("Fecha de Registro", fecha);

    const horaVal = record.hora === "Otro" ? record.hora_otro : record.hora;
    const asigVal = record.asignaturas === "Otra:" ? record.asignatura_otra : record.asignaturas;
    addTwoFields("Bloque/Hora", horaVal, "Asignatura", asigVal);

    addField("Nivel de Intensidad", record.nivel_dec);

    addSectionTitle("II. ANTECEDENTES DEL ESTUDIANTE Y APODERADO");
    addField("Nombre Estudiante", record.nombre_estudiante);
    addTwoFields("Curso", record.curso_estudiante, "Edad", record.edad_estudiante ? `${record.edad_estudiante} años` : null);
    addField("Profesor(a) Jefe", record.profe_jefe_estudiante);
    addTwoFields("Apoderado", record.nombre_apoderado, "Teléfono", record.fono_apoderado);

    addSectionTitle("III. PERSONAL INTERVINIENTE");
    addField("Encargado(a) del Procedimiento", record.encargado_pi);
    if (record.acompanante_interno_pi || record.acompanante_externo_pi) {
        addTwoFields("Acompañante Interno", record.acompanante_interno_pi, "Acompañante Externo", record.acompanante_externo_pi);
    }

    addSectionTitle("IV. ANÁLISIS DEL EVENTO (GATILLANTE)");
    addField("Situación previa / ¿Qué estaba haciendo?", record.antecedentes);
    addField("Detalles adicionales", record.otra_antecedentes || record.ConflictoConEstudiante_antecedentes || record.ConflictoConProfesor_antecedentes);

    addSectionTitle("V. CONDUCTAS OBSERVADAS Y DESCRIPCIÓN");
    addField("Conductas registradas", record.conductas);
    addField("Especificación/Otro", record.otro_conductas || record.Agresion_fisica_conductas);
    addTwoFields("Duración estimada", record.duracion_conductas, "Nivel DEC", record.nivel_dec);
    addField("Descripción detallada del episodio", record.descripcion_conductas);

    addSectionTitle("VI. MEDIDAS Y COMPROMISO");
    addField("Acciones y medidas aplicadas", record.consecuentes);
    addField("Otras medidas", record.otro_consecuentes);
    addField("¿Se logró el objetivo de la medida inicial?", record.funciona_medida);
    addField("Propuesta de mejora institucional / formativa", record.propuesta_mejora);

    // Signatures Section
    y += 25;
    checkPageBreak(30);

    doc.setDrawColor(0);
    const sigWidth = 60;

    // Signature Line 1
    doc.line(margin + 10, y, margin + 10 + sigWidth, y);
    doc.setFontSize(9);
    doc.text("Firma Profesional", margin + 10 + (sigWidth / 2), y + 5, { align: "center" });
    doc.text("Responsable", margin + 10 + (sigWidth / 2), y + 9, { align: "center" });

    // Signature Line 2
    doc.line(pageWidth - margin - 10 - sigWidth, y, pageWidth - margin - 10, y);
    doc.text("Firma Apoderado", pageWidth - margin - 10 - (sigWidth / 2), y + 5, { align: "center" });
    doc.text("o Adulto Responsable", pageWidth - margin - 10 - (sigWidth / 2), y + 9, { align: "center" });

    // Footer Info
    doc.setFontSize(8);
    doc.setTextColor(120);
    const footerY = 285;
    doc.text(`ID Seguimiento: ${record.id}`, margin, footerY);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - margin, footerY, { align: "right" });

    // Output
    const sanitizedName = record.nombre_estudiante.replace(/[\\/:"*?<>|]/g, "").replace(/\s+/g, "_");
    const docName = `DEC_${sanitizedName}_${format(new Date(), "yyyyMMdd")}.pdf`;
    doc.save(docName);
};
