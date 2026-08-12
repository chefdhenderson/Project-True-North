"use client";
import React, { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ChevronDown, ChevronUp, FileText, Paperclip, Save, Trash2, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Btn, Card, EmptyState, Input, SectionLabel, Select, TextArea } from "@/components/ui";
import { TAG_OPTIONS, Upload } from "@/types";

export default function AdminPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<{ tag: string; uploadedBy: string; summary: string; filename: string; parsed: { headers: string[]; rows: any[] } | null }>({
    tag: "master", uploadedBy: "", summary: "", filename: "", parsed: null,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("uploads").select("*").order("created_at", { ascending: false });
    setUploads(data || []);
    setLoaded(true);
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => setDraft((d) => ({ ...d, filename: file.name, parsed: { headers: (res.meta.fields as string[]) || [], rows: res.data as any[] } })),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
        const headers = json.length ? Object.keys(json[0]) : [];
        setDraft((d) => ({ ...d, filename: file.name, parsed: { headers, rows: json } }));
      };
      reader.readAsArrayBuffer(file);
    } else {
      setDraft((d) => ({ ...d, filename: file.name, parsed: null }));
    }
  };

  const submit = async () => {
    if (!draft.filename && !draft.summary) return;
    await supabase.from("uploads").insert({
      tag: draft.tag,
      filename: draft.filename || null,
      uploaded_by: draft.uploadedBy || null,
      summary: draft.summary || null,
      headers: draft.parsed?.headers || null,
      rows: draft.parsed?.rows || null,
      row_count: draft.parsed?.rows.length || null,
    });
    setDraft({ tag: "master", uploadedBy: "", summary: "", filename: "", parsed: null });
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const remove = async (id: string) => { await supabase.from("uploads").delete().eq("id", id); load(); };
  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <SectionLabel eyebrow="Admin" title="Weekly data & document uploads"
        sub="Tag each upload to a tab and its numbers flow there automatically. Team access is managed in Supabase → Authentication → Users (see README)." />

      <Card className="p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wide font-mono mb-1.5 block text-muted">Applies to</label>
            <Select value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} options={TAG_OPTIONS.map((t) => ({ value: t.id, label: t.label }))} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide font-mono mb-1.5 block text-muted">Uploaded by</label>
            <Input value={draft.uploadedBy} onChange={(e) => setDraft({ ...draft, uploadedBy: e.target.value })} placeholder="Name" />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide font-mono mb-1.5 block text-muted">File — CSV / XLSX drives the tab's data automatically; other files log by name</label>
          <div className="flex items-center gap-3 border border-dashed border-line rounded-lg px-4 py-4">
            <UploadCloud size={18} color="#D52B1E" className="shrink-0" />
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFile} className="text-sm w-full" />
          </div>
          {draft.filename && (
            <div className="mt-2 flex items-center gap-2 text-sm text-ink">
              <Paperclip size={13} className="text-muted" /> {draft.filename}
              {draft.parsed && <span className="text-xs font-mono text-muted">· {draft.parsed.rows.length} rows · columns: {draft.parsed.headers.join(", ")}</span>}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide font-mono mb-1.5 block text-muted">Summary for the team (optional)</label>
          <TextArea rows={2} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Anything worth flagging about this update..." />
        </div>

        <div className="flex justify-end"><Btn variant="solid" onClick={submit}><Save size={14} /> Log upload</Btn></div>
      </Card>

      <div>
        <div className="text-xs uppercase tracking-wide font-mono mb-3 text-muted">Upload history</div>
        <div className="space-y-2">
          {uploads.length === 0 && <EmptyState text="No uploads logged yet." />}
          {uploads.map((u) => {
            const tagLabel = TAG_OPTIONS.find((t) => t.id === u.tag)?.label || u.tag;
            return (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: "#FBEAEA", color: "#D52B1E" }}>{tagLabel}</span>
                      <span className="text-xs font-mono text-muted">{u.created_at.slice(0, 10)}{u.uploaded_by ? ` · ${u.uploaded_by}` : ""}</span>
                    </div>
                    {u.filename && <div className="flex items-center gap-1.5 text-sm mt-1.5 text-ink"><FileText size={13} className="text-muted" />{u.filename}</div>}
                    {u.summary && <p className="text-sm mt-1.5 text-ink">{u.summary}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.headers && (
                      <button onClick={() => toggle(u.id)} className="text-xs inline-flex items-center gap-1 font-mono text-red">
                        preview {expanded[u.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                    <button onClick={() => remove(u.id)} className="text-muted"><Trash2 size={14} /></button>
                  </div>
                </div>
                {u.headers && u.rows && expanded[u.id] && (
                  <div className="overflow-x-auto mt-3 border border-line rounded-lg">
                    <table className="w-full text-xs min-w-[480px]">
                      <thead><tr className="bg-cloud">{u.headers.map((h) => <th key={h} className="px-2.5 py-1.5 text-left font-mono text-muted">{h}</th>)}</tr></thead>
                      <tbody>
                        {u.rows.slice(0, 15).map((row, i) => (
                          <tr key={i} className="border-t border-line">{(u.headers as string[]).map((h) => <td key={h} className="px-2.5 py-1.5 font-mono text-ink">{String(row[h] ?? "")}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
