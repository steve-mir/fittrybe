"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, onAuthChange } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: "⬡", exact: true },
  { href: "/admin/users", label: "Users", icon: "◎" },
  { href: "/admin/sessions", label: "Sessions", icon: "◈" },
  { href: "/admin/payments", label: "Payments", icon: "◇" },
  { href: "/admin/moderation", label: "Moderation", icon: "◬" },
  { href: "/admin/reviews", label: "Reviews", icon: "◉" },
  { href: "/admin/notifications", label: "Notifications", icon: "◍" },
  { href: "/admin/content", label: "Content", icon: "▦" },
  { href: "/admin/hosts", label: "Hosts", icon: "◑" },
  { href: "/admin/analytics", label: "Analytics", icon: "◰" },
  { href: "/admin/posts", label: "Blog", icon: "▤" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (!user) router.push("/admin/login");
    });
    return unsub;
  }, [router]);

  async function handleSignOut() {
    await signOut();
    document.cookie = "fittrybe_admin_session=; path=/; max-age=0";
    router.push("/admin/login");
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-[#0a0a0a] border-r border-white/8 flex flex-col transition-transform duration-200 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-barlow-condensed)] text-xl font-black text-[#B6FF00]">
              FITTRYBE
            </span>
            <span className="text-white/30 text-xs font-[family-name:var(--font-dm-sans)] border border-white/10 rounded px-1.5 py-0.5">
              ADMIN
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all font-[family-name:var(--font-dm-sans)]
                  ${isActive(item.href, item.exact)
                    ? "bg-[#B6FF00]/10 text-[#B6FF00] font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all font-[family-name:var(--font-dm-sans)]"
          >
            <span className="text-base leading-none">⊗</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-white/8 bg-[#0a0a0a]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white"
          >
            ☰
          </button>
          <span className="font-[family-name:var(--font-barlow-condensed)] text-lg font-black text-[#B6FF00]">
            FITTRYBE ADMIN
          </span>
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
