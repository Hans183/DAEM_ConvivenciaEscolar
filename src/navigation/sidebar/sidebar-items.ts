import {
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Users,
  School,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  adminOnly?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Menú Principal",
    items: [
      {
        title: "Inicio",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        title: "Usuarios",
        url: "/dashboard/users",
        icon: Users,
        adminOnly: true,
      },
      {
        title: "Activación Protocolos",
        url: "/dashboard/activacion-protocolos",
        icon: FileText,
      },
      {
        title: "Registro DEC",
        url: "/dashboard/dec",
        icon: FileText,
      },
      {
        title: "Establecimientos",
        url: "/dashboard/establecimientos",
        icon: School,
        adminOnly: true,
      },
      {
        title: "Protocolos",
        url: "/dashboard/protocolos",
        icon: FileText,
        adminOnly: true,
      },
    ],
  },
];
