import { ProtocolsTable } from "./_components/protocols-table";

export const metadata = {
    title: "Activación de Protocolos",
    description: "Registro de activaciones de protocolos escolares.",
};

export default function ProtocolsPage() {
    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="font-bold text-2xl tracking-tight">Activación de Protocolos</h2>
                    <p className="text-muted-foreground">
                        Historial de protocolos activados.
                    </p>
                </div>
            </div>
            <div className="flex-1">
                <ProtocolsTable />
            </div>
        </div>
    );
}
