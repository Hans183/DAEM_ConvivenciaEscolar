"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import type { AuthModel } from "pocketbase";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { pb } from "@/lib/pocketbase";
import { getInitials } from "@/lib/utils";

interface GetColumnsProps {
    onEdit: (user: AuthModel) => void;
    onDelete: (user: AuthModel) => void;
}

export const getColumns = ({ onEdit, onDelete }: GetColumnsProps): ColumnDef<AuthModel>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Seleccionar todo"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Seleccionar fila"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
        cell: ({ row }) => {
            const user = row.original;
            if (!user) return null;

            const avatarUrl = user.avatar ? pb.files.getURL(user, user.avatar) : undefined;

            return (
                <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{user.name || user.username}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Correo" />,
        cell: ({ row }) => (
            <div className="w-[180px] truncate">{row.getValue("email")}</div>
        ),
    },
    {
        accessorKey: "establecimiento",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Establecimiento" />,
        cell: ({ row }) => {
            const user = row.original;
            if (!user) return null;
            const establecimiento = user.expand?.establecimiento?.nombre;
            return <div className="w-[150px] truncate">{establecimiento || "Sin asignar"}</div>;
        },
    },
    {
        accessorKey: "role",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
        cell: ({ row }) => <div className="w-[100px]">{row.getValue("role")}</div>,
    },
    {
        accessorKey: "created",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
        cell: ({ row }) => {
            return (
                <div className="w-[100px] text-muted-foreground">
                    {format(new Date(row.getValue("created")), "MMM d, yyyy")}
                </div>
            );
        },
    },
    {
        id: "verified",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Verificado" />,
        cell: ({ row }) => {
            const user = row.original;
            if (!user) return null;
            const isVerified = user.verified;
            return (
                <Badge variant={isVerified ? "default" : "secondary"}>
                    {isVerified ? "Verificado" : "No verificado"}
                </Badge>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original;
            if (!user) return null;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
