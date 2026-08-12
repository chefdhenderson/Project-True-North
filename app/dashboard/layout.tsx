"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, Target, UploadCloud, LogOut, Compass,
  PackagePlus, DollarSign, Timer, Tags, Store, Megaphone, FileBarChart,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { FlagBars } from "@/components/ui";
import { FOCUS_META } from "@/types";
import type { Session } from "@supabase/supabase-js";

const ICONS: Record<string, any> = {
  assortment: PackagePlus, margin: DollarSign, fefo: Timer, pricing: Tags,
  sws: Store, commercial: Megaphone, pnl: FileBarChart,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (session === undefined) return null; // checking auth
  if (!session) return null; // redirecting

  const navItems = [
    { href: "/dashboard", label: "Executive Summary", icon: Target, n: null },
    { href: "/dashboard/master", label: "Master Dashboard", icon: LayoutGrid, n: null },
    ...FOCUS_META.map((m) => ({ href: `/dashboard/focus/${m.id}`, label: m.label, icon: ICONS[m.id], n: m.n })),
    { href: "/dashboard/admin", label: "Admin", icon: UploadCloud, n: null },
  ];

  return (
    <div className="min-h-screen w-full flex">
      <aside className="w-64 shrink-0 border-r border-line flex flex-col bg-white">
        <div className="px-5 py-5 border-b border-line border-t-4 border-t-red">
          <div className="flex items-center gap-2">
            <Compass size={18} color="#D52B1E" />
            <span className="font-display font-bold text-ink text-[15px] tracking-wide">PROJECT TRUE NORTH</span>
          </div>
          <div className="text-[11px] font-mono mt-1.5 tracking-wide text-muted">WILD FORK CANADA · MERCHANT COMMAND</div>
          <FlagBars className="mt-2" />
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ background: active ? "#FBEAEA" : "transparent", color: active ? "#D52B1E" : "#3F3F46", borderLeft: active ? "3px solid #D52B1E" : "3px solid transparent" }}
              >
                {item.n && <span className="text-[10px] font-mono w-4" style={{ color: active ? "#D52B1E" : "#B0B0B5" }}>{item.n}</span>}
                {!item.n && <Icon size={15} className="shrink-0" style={{ color: active ? "#D52B1E" : "#6B7280" }} />}
                <span className="truncate text-left flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-line flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs truncate text-ink">{session.user.email}</div>
            <div className="text-[10px] font-mono text-[#B0B0B5]">Shared with leadership · live</div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }} title="Log out" className="text-muted">
            <LogOut size={15} />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
