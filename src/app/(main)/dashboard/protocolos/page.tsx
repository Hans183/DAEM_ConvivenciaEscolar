import { ProtocolosTable } from "./_components/protocolos-table";

export const metadata = {
    title: "Protocolos",
    description: "Listado de protocolos registrados.",
};

export default function ProtocolosPage() {
    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="font-bold text-2xl tracking-tight">
                        Protocolos
                    </h2>
                    <p className="text-muted-foreground">
                        Gestión y registro de protocolos disponibles.
                    </p>
                </div>
            </div>

            <div className="flex-1">
                <ProtocolosTable />
            </div>
        </div>
    );
}
