"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Lock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CanadianFlag, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <CanadianFlag width={110} />
          <div className="flex items-center gap-2 mt-5">
            <Compass size={20} color="#D52B1E" />
            <span className="font-display font-bold text-ink text-xl tracking-wide">PROJECT TRUE NORTH</span>
          </div>
          <div className="text-[11px] font-mono mt-1.5 tracking-wide text-muted">WILD FORK CANADA</div>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide font-mono mb-1.5 block text-muted">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@wildforkfoods.com" autoFocus required />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide font-mono mb-1.5 block text-muted">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full text-sm px-3 py-2.5 rounded-lg font-medium inline-flex items-center justify-center gap-1.5 bg-red text-white disabled:opacity-60"
            >
              <Lock size={14} /> {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </Card>
        <p className="text-center text-xs mt-4 text-[#B0B0B5]">
          Access is limited to invited members of the Canadian business unit. Contact your admin for an account.
        </p>
      </div>
    </div>
  );
}
