"use client";

import Link from "next/link";
import Image from "next/image";

import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { useUser } from "@/hooks/use-user";
import { pb } from "@/lib/pocketbase";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Configuración",
      url: "#",
      icon: Settings,
    },
    {
      title: "Ayuda",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Buscar",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Biblioteca de Datos",
      url: "#",
      icon: Database,
    },
    {
      name: "Reportes",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Asistente Word",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, resolvedThemeMode, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      resolvedThemeMode: s.resolvedThemeMode,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const pbUser = useUser();

  // derived user object for NavUser, falling back to rootUser if not logged in
  // or mapping PB user fields to the expected format
  const user = pbUser ? {
    name: pbUser.name || pbUser.username || "User",
    email: pbUser.email || "",
    avatar: pbUser.avatar ? pb.files.getURL(pbUser, pbUser.avatar) : "",
  } : rootUser;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto" asChild>
              <Link prefetch={false} href="/dashboard/default">
                <div className="flex items-center justify-center w-full">
                  <Image
                    src={resolvedThemeMode === "dark" ? "/img/logo_darkmode.svg" : "/img/logo_naranja.svg"}
                    alt={APP_CONFIG.name}
                    width={180}
                    height={60}
                    className="h-16 w-auto"
                    priority
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
