import { EstablecimientosTable } from "./_components/establecimientos-table";

export const metadata = {
  title: "Establecimientos",
  description: "Listado de establecimientos registrados.",
};

export default function EstablecimientosPage() {
  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Establecimientos
          </h2>
          <p className="text-muted-foreground">
            Registro de establecimientos disponibles en el sistema.
          </p>
        </div>
      </div>

      <div className="flex-1">
        <EstablecimientosTable />
      </div>
    </div>
  );
}
