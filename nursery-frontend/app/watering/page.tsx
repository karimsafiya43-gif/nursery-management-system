"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorAlert, Field, Loading, PageHeader, SuccessNote, inputClass } from "@/components/ui";
import BatchSelect from "@/components/BatchSelect";
import { useBatches } from "@/lib/useBatches";
import { getOverdue, logWatering, Overdue } from "@/lib/api";
import { dateError, formatDate, today } from "@/lib/format";

export default function WateringPage() {
  const { batches, loading, error: batchError } = useBatches();
  const [overdue, setOverdue] = useState<Overdue[] | null>(null);
  const [batchId, setBatchId] = useState<number | "">("");
  const [date, setDate] = useState(today());
  const [litres, setLitres] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const batch = batches.find((b) => b.batch_id === batchId);
  const loadOverdue = useCallback(() => getOverdue().then(setOverdue).catch((e) => setError(e.message)), []);
  useEffect(() => { loadOverdue(); }, [loadOverdue]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setDone("");
    const problem = dateError(date, batch?.sown_date);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      await logWatering({ batch_id: Number(batchId), watered_on: date, amount_litres: litres ? Number(litres) : null, notes });
      setDone("Watering saved."); setLitres(""); setNotes(""); loadOverdue();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Watering" subtitle="Record each watering and see which batches are due." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Log watering" className="lg:col-span-3">
          <ErrorAlert message={error || batchError} /><SuccessNote message={done} />
          <form onSubmit={submit} className="space-y-4">
            <BatchSelect batches={batches} value={batchId} onChange={setBatchId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date watered">
                <input type="date" className={inputClass} value={date} min={batch?.sown_date} max={today()} onChange={(e) => setDate(e.target.value)} required />
              </Field>
              <Field label="Water used (litres)" hint="Optional">
                <input type="number" min="0" step="0.5" className={inputClass} value={litres} onChange={(e) => setLitres(e.target.value)} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Soil dry, used drip line" />
            </Field>
            <Button type="submit" loading={saving} disabled={!batchId || loading}>Save watering</Button>
          </form>
        </Card>

        <Card title="Due for watering" hint="Based on each species' watering interval." className="lg:col-span-2">
          {overdue === null ? <Loading /> : overdue.length === 0 ? <EmptyState>Every batch is watered on time.</EmptyState> : (
            <ul className="space-y-3">
              {overdue.map((o) => (
                <li key={o.batch_id} className="flex items-start justify-between gap-3 rounded-xl bg-mist px-4 py-3">
                  <div>
                    <p className="font-medium">{o.name}</p>
                    <p className="text-sm text-stone">Last watered {formatDate(o.last_watered)}</p>
                    <button className="mt-1 text-sm text-fern underline underline-offset-2" onClick={() => setBatchId(o.batch_id)}>Log this batch</button>
                  </div>
                  <Badge tone={o.days_overdue >= 3 ? "rust" : "amber"}>{o.days_overdue} {o.days_overdue === 1 ? "day" : "days"} overdue</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
