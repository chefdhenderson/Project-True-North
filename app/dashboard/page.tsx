"use client";
import React, { useEffect, useState } from "react";
import { ChevronRight, Compass, Save, X, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Btn, Card, EmptyState, Input, SectionLabel, StatusPill, addDays, fmtWeek, todayISO } from "@/components/ui";
import { FOCUS_META, TAG_OPTIONS, Upload, Deliverable } from "@/types";

export default function ExecutiveSummaryPage() {
  const [exec, setExec] = useState({ week_of: todayISO(), week_focus: "", bullets: [] as string[] });
  const [rollup, setRollup] = useState<(Deliverable & { area: string })[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: execRow }, { data: deliverables }, { data: uploadRows }] = await Promise.all([
      supabase.from("exec_summary").select("*").eq("id", 1).single(),
      supabase.from("deliverables").select("*"),
      supabase.from("uploads").select("*").order("created_at", { ascending: false }).limit(4),
    ]);
    if (execRow) setExec({ week_of: execRow.week_of, week_focus: execRow.week_focus || "", bullets: execRow.bullets || [] });
    const cutoff = addDays(todayISO(), 14);
    const flagged = (deliverables || [])
      .filter((d) => d.status === "At Risk" || d.status === "Delayed" || (d.due && d.due <= cutoff))
      .map((d) => ({ ...d, area: FOCUS_META.find((f) => f.id === d.focus_id)?.label || d.focus_id }))
      .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
    setRollup(flagged as any);
    setUploads(uploadRows || []);
    setLoaded(true);
  }

  const save = async () => {
    await supabase.from("exec_summary").update({ week_focus: exec.week_focus, bullets: exec.bullets, updated_at: new Date().toISOString() }).eq("id", 1);
  };

  const addBullet = () => setExec({ ...exec, bullets: [...exec.bullets, ""] });
  const updateBullet = (i: number, v: string) => { const b = [...exec.bullets]; b[i] = v; setExec({ ...exec, bullets: b }); };
  const removeBullet = (i: number) => setExec({ ...exec, bullets: exec.bullets.filter((_, idx) => idx !== i) });

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <SectionLabel eyebrow="Week of" title={fmtWeek(exec.week_of)} right={<Btn variant="solid" onClick={save}><Save size={14} /> Save summary</Btn>} />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3"><Compass size={16} color="#D52B1E" /><label className="text-sm font-medium text-ink">This week's primary focus</label></div>
        <Input value={exec.week_focus} placeholder="e.g. Close Q3 FEFO markdown gap in Seafood before month-end" onChange={(e) => setExec({ ...exec, week_focus: e.target.value })} />
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-ink">Key bullets for leadership</label>
          <Btn onClick={addBullet}>+ Add bullet</Btn>
        </div>
        <div className="space-y-2">
          {exec.bullets.length === 0 && <p className="text-sm text-muted">No bullets yet — add the 3–5 things leadership should know this week.</p>}
          {exec.bullets.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <ChevronRight size={14} color="#D52B1E" className="shrink-0" />
              <Input value={b} onChange={(e) => updateBullet(i, e.target.value)} placeholder="Key update..." />
              <button onClick={() => removeBullet(i)} className="text-muted"><X size={15} /></button>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <SectionLabel eyebrow="Rollup" title="Deliverables due in 14 days or flagged" />
        <Card className="p-2">
          {rollup.length === 0 && <EmptyState text="Nothing due soon or flagged across the seven focus areas." />}
          <div className="divide-y divide-line">
            {rollup.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm truncate text-ink">{d.title}</div>
                  <div className="text-xs font-mono mt-0.5 text-muted">{d.area} · due {d.due || "—"}</div>
                </div>
                <StatusPill status={d.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {uploads.length > 0 && (
        <div>
          <SectionLabel eyebrow="Admin" title="Latest uploads feeding the tabs" />
          <div className="space-y-2">
            {uploads.map((u) => (
              <Card key={u.id} className="p-3.5 flex items-center gap-3">
                <FileText size={15} color="#D52B1E" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate text-ink">{u.filename || u.summary?.slice(0, 60) || "Update"}</div>
                  <div className="text-xs font-mono text-muted">{TAG_OPTIONS.find((t) => t.id === u.tag)?.label} · {u.created_at.slice(0, 10)}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
