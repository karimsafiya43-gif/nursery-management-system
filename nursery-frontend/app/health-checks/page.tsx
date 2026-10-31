"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorAlert, Field, Loading, PageHeader, SuccessNote, inputClass } from "@/components/ui";
import BatchSelect from "@/components/BatchSelect";
import { useBatches } from "@/lib/useBatches";
import { getObservations, Health, logObservation, Observation } from "@/lib/api";
import { dateError, formatDate, today } from "@/lib/format";

const statuses: { value: Health; label: string; on: string }[] = [
  { value: "healthy", label: "Healthy", on: "border-fern bg-dew text-fern" },
  { value: "weak", label: "Weak", on: "border-amber bg-[#FBF0D9] text-amber" },
  { value: "diseased", label: "Diseased", on: "border-rust bg-[#F8E1DC] text-rust" },
];
const tone = { healthy: "green", weak: "amber", diseased: "rust" } as const;

export default function HealthChecksPage() {
  const { batches, loading, error: batchError, reload } = useBatches();
  const [batchId, setBatchId] = useState<number | "">("");
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState<Health>("healthy");
  const [height, setHeight] = useState("");
  const [lost, setLost] = useState("0");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<Observation[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const batch = batches.find((b) => b.batch_id === batchId);
  const loadHistory = useCallback(async (id: number | "") => {
    if (!id) return setHistory(null);
    setHistory(null);
    try { setHistory(await getObservations(id)); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { loadHistory(batchId); }, [batchId, loadHistory]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setDone("");
    const problem = dateError(date, batch?.sown_date);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      await logObservation({ batch_id: Number(batchId), observed_on: date, health_status: status, avg_height_cm: height ? Number(height) : null, plants_lost: Number(lost || 0), notes });
      setDone("Health check saved."); setLost("0"); setHeight(""); setNotes("");
      await Promise.all([reload(), loadHistory(batchId)]);
    } catch (err) { setError((err as Error).message); } // shows the stock-trigger message as-is
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Health checks" subtitle="Record how a batch looks today, and any plants you lost." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="New health check" className="lg:col-span-3">
          <ErrorAlert message={error || batchError} /><SuccessNote message={done} />
          <form onSubmit={submit} className="space-y-4">
            <BatchSelect batches={batches} value={batchId} onChange={setBatchId} />
            <Field label="Date checked">
              <input type="date" className={inputClass} value={date} min={batch?.sown_date} max={today()} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-canopy">Health</legend>
              <div className="grid grid-cols-3 gap-2">
                {statuses.map((s) => (
                  <label key={s.value} className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-center text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-leaf ${status === s.value ? s.on : "border-sage bg-white text-stone"}`}>
                    <input type="radio" name="health" value={s.value} checked={status === s.value} onChange={() => setStatus(s.value)} className="sr-only" />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Average height (cm)" hint="Optional">
                <input type="number" min="0" step="0.1" className={inputClass} value={height} onChange={(e) => setHeight(e.target.value)} />
              </Field>
              <Field label="Plants lost" hint={batch ? `${batch.stock} plants in stock now` : "Choose a batch to see stock"}>
                <input type="number" min="0" step="1" className={inputClass} value={lost} onChange={(e) => setLost(e.target.value)} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you see?" />
            </Field>
            <Button type="submit" loading={saving} disabled={!batchId || loading}>Save health check</Button>
          </form>
        </Card>

        <Card title="Recent checks" hint={batch ? batch.name : "Choose a batch to see its history."} className="lg:col-span-2">
          {!batchId ? <EmptyState>No batch selected.</EmptyState> : history === null ? <Loading /> : history.length === 0 ? <EmptyState>No checks recorded for this batch yet.</EmptyState> : (
            <ul className="space-y-3">
              {history.map((o) => (
                <li key={o.observation_id} className="rounded-xl bg-mist px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{formatDate(o.observed_on)}</span>
                    <Badge tone={tone[o.health_status]}>{o.health_status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-stone">
                    {o.avg_height_cm ? `${o.avg_height_cm} cm tall. ` : ""}{o.plants_lost > 0 ? `${o.plants_lost} plants lost.` : "No plants lost."}
                  </p>
                  {o.notes && <p className="mt-1 text-sm">{o.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
