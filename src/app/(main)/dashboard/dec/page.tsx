import { DecTable } from "./_components/dec-table";

export const metadata = {
    title: "Documento de Entrevista y Compromiso (DEC)",
    description: "Registro de actas de incidentes (DEC).",
};

export default function DecPage() {
    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Registro DEC</h2>
                    <p className="text-muted-foreground">
                        Documento de Entrevista y Compromiso
                    </p>
                </div>
            </div>
            <div className="flex-1">
                <DecTable />
            </div>
        </div>
    );
}
