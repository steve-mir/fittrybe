"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (pathname === "/admin/login" || pathname === "/admin/signup") {
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push(`/admin/login?redirect=${pathname}`);
        } else {
          setLoading(false);
        }
      } catch {
        router.push(`/admin/login?redirect=${pathname}`);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (loading && pathname !== "/admin/login" && pathname !== "/admin/signup") {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  return <>{children}</>;
}
