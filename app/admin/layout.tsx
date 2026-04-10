"use client";

import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

const AUTH_PATHS = ["/admin/login", "/admin/signup"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.includes(pathname);

  if (isAuth) return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
