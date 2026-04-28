import { z } from "zod";

import { validateRut } from "@/lib/rut-utils";

export const denunciaKarinSchema = z.object({
  // 1. Materia de la Denuncia
  materia: z.enum(["Acoso Sexual", "Acoso Laboral", "Violencia en el Trabajo"], {
    required_error: "Debes seleccionar la materia de la denuncia.",
  }),

  // 2. Identificación de las Partes - Denunciante
  nombresDenunciante: z.string().min(2, "El nombre es requerido"),
  rutDenunciante: z
    .string()
    .min(8, "RUT demasiado corto")
    .refine((val) => validateRut(val), {
      message: "El RUT ingresado no es válido (ej: 12.345.678-9)",
    }),
  direccionDenunciante: z.string().min(5, "Dirección es requerida"),
  ciudadComunaDenunciante: z.string().min(3, "Ciudad/Comuna es requerida"),
  telefonoDenunciante: z.string().min(8, "Teléfono inválido"),
  correoDenunciante: z.string().email("Correo electrónico inválido"),
  cargoDenunciante: z.string().min(2, "Cargo es requerido"),
  areaDenunciante: z.string().min(2, "Área de desempeño es requerida"),
  establecimiento: z.string().min(1, "El establecimiento es requerido"),
  nombreJefaturaDenunciante: z.string().min(2, "Nombre de jefatura es requerido"),
  cargoJefaturaDenunciante: z.enum(["Docente", "Directivo", "Apoderado", "Asistente", "Estudiante"], {
    required_error: "Debes seleccionar el cargo de la jefatura.",
  }),

  // 3. Identificación de las Partes - Denunciado
  nombresDenunciado: z.string().min(2, "El nombre del denunciado es requerido"),
  cargoDenunciado: z.string().min(2, "Cargo del denunciado es requerido"),
  areaDenunciado: z.string().min(2, "Área de desempeño del denunciado es requerida"),
  nombreJefaturaDenunciado: z.string().min(2, "Nombre de la jefatura es requerido"),
  cargoJefaturaDenunciado: z.enum(["Docente", "Directivo", "Apoderado", "Asistente", "Estudiante"], {
    required_error: "Debes seleccionar el cargo de la jefatura.",
  }),

  // 4. Relación y Relato de los Hechos
  vinculo: z.enum(["Docente", "Directivo", "Apoderado", "Asistente", "Estudiante", "Externo"], {
    required_error: "Debes seleccionar el vínculo con el/la denunciado/a.",
  }),
  relatoHechos: z.string().min(20, "Describe detalladamente los hechos (mínimo 20 caracteres)"),
  temporalidad: z.string().min(2, "Debes señalar hace cuánto tiempo ocurren los hechos"),
  testigos: z.string().optional(), // Puede no haber testigos
  evidencia: z.any().optional(), // File upload, handle via Server Actions / FormData

  // 5. Cierre
  observaciones: z.string().optional(),
});

export type DenunciaKarinFormValues = z.infer<typeof denunciaKarinSchema>;
