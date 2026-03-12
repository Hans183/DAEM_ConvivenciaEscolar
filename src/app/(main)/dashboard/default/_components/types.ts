// Shared types for the KPI dashboard

export interface EstablecimientoRecord {
  id: string;
  nombre: string;
}

export interface DecRecord {
  id: string;
  created: string;
  dia?: string;
  nombre_estudiante: string;
  curso_estudiante: string;
  establecimiento: string;
  funciona_medida: boolean;
  conductas?: string[];
  consecuentes?: string[];
  expand?: {
    establecimiento?: EstablecimientoRecord;
  };
}

export interface ProtocolRecord {
  id: string;
  created: string;
  meses?: string;
  cantidad: number | string;
  establecimiento: string;
  expand?: {
    protocolo?: {
      item?: string;
      nombre?: string;
      name?: string;
    };
    establecimiento?: EstablecimientoRecord;
  };
}

export interface DashboardData {
  // DEC
  totalDec: number;
  decEsteMes: number;
  decTrend?: number; // % change vs last month
  medidasEfectivas: number;

  // Protocolos
  totalProtocolos: number;
  protocolosEsteMes: number;
  protocolosTrend?: number; // % change vs last month

  // Admin only
  establecimientosActivos: number;

  // Charts
  decPorMes: { mes: string; total: number; [key: string]: string | number }[];
  protocolosPorTipo: { nombre: string; total: number }[];
  conductasFrecuentes: { nombre: string; total: number }[];
  consecuentesFrecuentes: { nombre: string; total: number }[];

  // Table
  ultimosDec: {
    id: string;
    dia: string;
    nombre_estudiante: string;
    curso_estudiante: string;
    establecimiento?: string;
    funciona_medida: boolean;
  }[];
}
