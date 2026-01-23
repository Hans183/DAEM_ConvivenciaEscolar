import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./_components/profile-form";

export const metadata = {
    title: "Perfil",
    description: "Administra tu perfil de usuario.",
};

export default function ProfilePage() {
    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Perfil</h2>
                    <p className="text-muted-foreground">
                        Administra la configuración de tu cuenta y preferencias.
                    </p>
                </div>
            </div>
            <Separator />
            <ProfileForm />
        </div>
    );
}
