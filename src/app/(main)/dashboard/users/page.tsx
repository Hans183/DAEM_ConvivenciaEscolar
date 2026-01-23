import { Separator } from "@/components/ui/separator";

import { UsersTable } from "./_components/users-table";

export const metadata = {
    title: "Usuarios",
    description: "Administrar usuarios del sistema.",
};

export default function UsersPage() {
    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="font-bold text-2xl tracking-tight">Usuarios</h2>
                    <p className="text-muted-foreground">
                        Administra tus usuarios y sus permisos aquí.
                    </p>
                </div>
            </div>
            <Separator />
            <UsersTable />
        </div>
    );
}
