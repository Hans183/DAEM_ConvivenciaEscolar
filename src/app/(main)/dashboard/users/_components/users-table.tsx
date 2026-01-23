"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthModel } from "pocketbase";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { pb } from "@/lib/pocketbase";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getColumns } from "./columns";
import { UserDialog } from "./user-dialog";

export function UsersTable() {
    const [data, setData] = useState<AuthModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AuthModel | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AuthModel | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const records = await pb.collection("users").getFullList({
                sort: "-created",
            });
            setData(records as unknown as AuthModel[]);
        } catch (error: any) {
            if (error.isAbort) return; // Ignore auto-cancelled requests
            console.error("Failed to fetch users:", error);
            toast.error("Error al obtener usuarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleEdit = (user: AuthModel) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleDeleteClick = (user: AuthModel) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await pb.collection("users").delete(userToDelete.id);
            toast.success("Usuario eliminado correctamente");
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar usuario");
        } finally {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const columns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDeleteClick }), []);

    const table = useDataTableInstance({
        columns,
        data,
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Usuario
                </Button>
            </div>
            <div className="rounded-md border">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Cargando usuarios...</div>
                ) : (
                    <DataTable table={table} columns={columns} />
                )}
            </div>
            <DataTablePagination table={table} />

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={selectedUser}
                onSuccess={fetchUsers}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta de usuario
                            de <strong>{userToDelete?.name || userToDelete?.email}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
