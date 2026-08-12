"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Btn, Card, EmptyState, Gauge, Input, Select, SectionLabel, TextArea, aggregate, num, todayISO } from "@/components/ui";
import { FOCUS_META, FocusId, Upload, Kpi, Deliverable, Commentary } from "@/types";

export default function FocusAreaPage() {
  const params = useParams<{ focusId: string }>();
  const focusId = params.focusId as FocusId;
  const meta = FOCUS_META.find((m) => m.id === focusId);

  const [objective, setObjective] = useState("");
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [latest, setLatest] = useState<Upload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); load(); }, [focusId]);

  async function load() {
    const [{ data: focusRow }, { data: kpiRows }, { data: deliverableRows }, { data: commentaryRows }, { data: uploadRows }] = await Promise.all([
      supabase.from("focus_areas").select("*").eq("id", focusId).single(),
      supabase.from("kpis").select("*").eq("focus_id", focusId).order("sort_order"),
      supabase.from("deliverables").select("*").eq("focus_id", focusId).order("due"),
      supabase.from("commentary").select("*").eq("focus_id", focusId).order("created_at", { ascending: false }),
      supabase.from("uploads").select("*").eq("tag", focusId).order("created_at", { ascending: false }).limit(1),
    ]);
    setObjective(focusRow?.objective || "");
    setKpis(kpiRows || []);
    setDeliverables(deliverableRows || []);
    setCommentary(commentaryRows || []);
    setLatest(uploadRows && uploadRows[0] ? uploadRows[0] : null);
    setLoaded(true);
  }

  const saveObjective = async () => { await supabase.from("focus_areas").update({ objective, updated_at: new Date().toISOString() }).eq("id", focusId); };

  const addKpi = async () => { await supabase.from("kpis").insert({ focus_id: focusId, label: "", target: "", column_name: "", agg: "sum", sort_order: kpis.length }); load(); };
  const updateKpi = async (id: string, field: string, val: string) => { setKpis(kpis.map((k) => (k.id === id ? { ...k, [field]: val } as Kpi : k))); await supabase.from("kpis").update({ [field]: val }).eq("id", id); };
  const removeKpi = async (id: string) => { await supabase.from("kpis").delete().eq("id", id); load(); };

  const addDeliverable = async () => { await supabase.from("deliverables").insert({ focus_id: focusId, title: "", milestone: "", owner: "", due: todayISO(), status: "On Track" }); load(); };
  const updateDeliverable = async (id: string, field: string, val: string) => { setDeliverables(deliverables.map((d) => (d.id === id ? { ...d, [field]: val } as Deliverable : d))); await supabase.from("deliverables").update({ [field]: val }).eq("id", id); };
  const removeDeliverable = async (id: string) => { await supabase.from("deliverables").delete().eq("id", id); load(); };

  const addComment = async () => { await supabase.from("commentary").insert({ focus_id: focusId, author: "", note_date: todayISO(), text: "" }); load(); };
  const updateComment = async (id: string, field: string, val: string) => { setCommentary(commentary.map((c) => (c.id === id ? { ...c, [field]: val } as Commentary : c))); await supabase.from("commentary").update({ [field]: val }).eq("id", id); };
  const removeComment = async (id: string) => { await supabase.from("commentary").delete().eq("id", id); load(); };

  if (!meta) return <EmptyState text="Unknown focus area." />;
  if (!loaded) return null;

  const headers = latest?.headers || [];
  const sorted = [...deliverables].sort((a, b) => (a.due || "").localeCompare(b.due || ""));

  return (
    <div className="space-y-6">
      <SectionLabel eyebrow={`Focus ${meta.n}`} title={meta.label}
        sub={latest ? `Data live from ${latest.filename} · uploaded ${latest.created_at.slice(0, 10)}` : "No data uploaded yet for this area — see Admin."}
        right={<Btn variant="solid" onClick={saveObjective}><Save size={14} /> Save objective</Btn>} />

      <Card className="p-5">
        <label className="text-xs uppercase tracking-wide font-mono mb-2 block text-muted">Objective (set once)</label>
        <TextArea rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="What does success look like for this focus area?" />
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wide font-mono text-muted">KPIs — target set once, current pulls from the latest upload</div>
          <Btn onClick={addKpi}><Plus size={14} /> Add KPI</Btn>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {kpis.map((k) => {
            const current = latest && k.column_name ? aggregate(latest.rows || [], k.column_name, k.agg) : null;
            const pct = num(k.target) && current !== null ? (current / num(k.target)) * 100 : 0;
            return (
              <Card key={k.id} className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Gauge pct={pct} />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Input value={k.label} onChange={(e) => updateKpi(k.id, "label", e.target.value)} placeholder="KPI name" />
                    <div className="flex items-center gap-1.5 text-sm font-mono text-ink">
                      <span className="text-red font-semibold">{current !== null ? current.toLocaleString("en-CA", { maximumFractionDigits: 1 }) : "—"}</span>
                      <span className="text-muted">/ target</span>
                      <Input mono value={k.target} onChange={(e) => updateKpi(k.id, "target", e.target.value)} placeholder="target" className="w-20" />
                    </div>
                  </div>
                  <button onClick={() => removeKpi(k.id)} className="text-muted"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center gap-1.5">
                  <Select value={k.column_name} onChange={(e) => updateKpi(k.id, "column_name", e.target.value)}
                    options={[{ value: "", label: headers.length ? "map to column…" : "no data yet" }, ...headers.map((h) => ({ value: h, label: h }))]} />
                  <Select value={k.agg} onChange={(e) => updateKpi(k.id, "agg", e.target.value)} className="w-24"
                    options={[{ value: "sum", label: "sum" }, { value: "avg", label: "avg" }, { value: "latest", label: "latest" }]} />
                </div>
              </Card>
            );
          })}
          {kpis.length === 0 && <p className="text-sm text-muted">No KPIs yet — add one and map it to a column once data has been uploaded.</p>}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide font-mono mb-3 text-muted">This week's data</div>
        <Card className="overflow-x-auto">
          {!latest || !latest.rows ? <EmptyState text="Nothing uploaded for this area yet." /> : (
            <table className="w-full text-sm min-w-[520px]">
              <thead><tr className="bg-cloud text-muted">{headers.map((h) => <th key={h} className="px-3 py-3 text-left text-xs uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {latest.rows.slice(0, 25).map((r, i) => (
                  <tr key={i} className="border-t border-line">{headers.map((h) => <td key={h} className="px-3 py-2 font-mono text-ink">{String(r[h] ?? "")}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wide font-mono text-muted">Project scope & timeline</div>
          <Btn onClick={addDeliverable}><Plus size={14} /> Add milestone</Btn>
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-muted bg-cloud">
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Deliverable</th>
                <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Milestone</th>
                <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Owner</th>
                <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Due</th>
                <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className="border-t border-line align-top">
                  <td className="px-4 py-2.5 w-56"><Input value={d.title} onChange={(e) => updateDeliverable(d.id, "title", e.target.value)} placeholder="Deliverable" /></td>
                  <td className="px-3 py-2.5 w-44"><Input value={d.milestone} onChange={(e) => updateDeliverable(d.id, "milestone", e.target.value)} placeholder="Milestone" /></td>
                  <td className="px-3 py-2.5 w-32"><Input value={d.owner} onChange={(e) => updateDeliverable(d.id, "owner", e.target.value)} placeholder="Owner" /></td>
                  <td className="px-3 py-2.5 w-40"><Input type="date" mono value={d.due || ""} onChange={(e) => updateDeliverable(d.id, "due", e.target.value)} /></td>
                  <td className="px-3 py-2.5 w-36"><Select value={d.status} onChange={(e) => updateDeliverable(d.id, "status", e.target.value)} options={["On Track", "At Risk", "Delayed", "Done"].map((s) => ({ value: s, label: s }))} /></td>
                  <td className="px-2 py-2.5"><button onClick={() => removeDeliverable(d.id)} className="text-muted"><Trash2 size={14} /></button></td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-sm text-muted">No deliverables tracked yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wide font-mono text-muted">Weekly commentary on deliverable status</div>
          <Btn onClick={addComment}><Plus size={14} /> Add entry</Btn>
        </div>
        <div className="space-y-2">
          {commentary.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Input type="date" mono value={n.note_date} onChange={(e) => updateComment(n.id, "note_date", e.target.value)} className="w-40" />
                <Input value={n.author} onChange={(e) => updateComment(n.id, "author", e.target.value)} placeholder="Author (optional)" className="w-44" />
                <button onClick={() => removeComment(n.id)} className="ml-auto text-muted"><Trash2 size={14} /></button>
              </div>
              <TextArea rows={2} value={n.text} onChange={(e) => updateComment(n.id, "text", e.target.value)} placeholder="Status on this week's deliverables..." />
            </Card>
          ))}
          {commentary.length === 0 && <p className="text-sm text-muted">No commentary yet.</p>}
        </div>
      </div>
    </div>
  );
}
