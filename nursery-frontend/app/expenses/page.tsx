"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorAlert, Field, Loading, PageHeader, SuccessNote, inputClass } from "@/components/ui";
import BatchSelect from "@/components/BatchSelect";
import { useBatches } from "@/lib/useBatches";
import { useUser } from "@/lib/useUser";
import { Expense, getExpenses, logExpense } from "@/lib/api";
import { dateError, formatDate, money, today } from "@/lib/format";

const categories = ["seeds", "fertilizer", "labour", "water", "pesticide", "other"];

export default function ExpensesPage() {
  const user = useUser();
  const { batches, loading, error: batchError } = useBatches();
  const [batchId, setBatchId] = useState<number | "">("");
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState("seeds");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [list, setList] = useState<Expense[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const batch = batches.find((b) => b.batch_id === batchId);
  const currency = user?.currency_code ?? "INR";

  const load = useCallback(async (id: number | "") => {
    if (!id) return setList(null);
    setList(null);
    try { setList(await getExpenses(id)); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { load(batchId); }, [batchId, load]);

  const { total, byCategory } = useMemo(() => {
    const map = new Map<string, number>();
    (list ?? []).forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return { total: [...map.values()].reduce((a, b) => a + b, 0), byCategory: [...map.entries()] };
  }, [list]);

  if (user && user.role === "staff") {
    return (
      <>
        <PageHeader title="Expenses" subtitle="Costs for each batch." />
        <Card title="Owners and managers only"><p className="text-stone">Your role does not have access to expenses. Ask an owner or manager if you need to record a cost.</p></Card>
      </>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setDone("");
    const problem = dateError(date, batch?.sown_date);
    if (problem) return setError(problem);
    if (!(Number(amount) > 0)) return setError("Enter an amount greater than 0.");
    setSaving(true);
    try {
      await logExpense({ batch_id: Number(batchId), spent_on: date, category, amount: Number(amount), description });
      setDone("Expense saved."); setAmount(""); setDescription("");
      await load(batchId);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Expenses" subtitle="Record what each batch costs so profit can be worked out later." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="New expense" className="lg:col-span-3">
          <ErrorAlert message={error || batchError} /><SuccessNote message={done} />
          <form onSubmit={submit} className="space-y-4">
            <BatchSelect batches={batches} value={batchId} onChange={setBatchId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date spent">
                <input type="date" className={inputClass} value={date} min={batch?.sown_date} max={today()} onChange={(e) => setDate(e.target.value)} required />
              </Field>
              <Field label="Category">
                <select className={`${inputClass} capitalize`} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label={`Amount (${currency})`}>
              <input type="number" min="0.01" step="0.01" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            <Field label="Description">
              <textarea rows={3} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" />
            </Field>
            <Button type="submit" loading={saving} disabled={!batchId || loading}>Save expense</Button>
          </form>
        </Card>

        <Card title="Batch expenses" hint={batch ? batch.name : "Choose a batch to see its costs."} className="lg:col-span-2">
          {!batchId ? <EmptyState>No batch selected.</EmptyState> : list === null ? <Loading /> : list.length === 0 ? <EmptyState>No expenses recorded for this batch.</EmptyState> : (
            <>
              <ul className="space-y-3">
                {list.map((x) => (
                  <li key={x.expense_id} className="flex items-start justify-between gap-3 rounded-xl bg-mist px-4 py-3">
                    <div>
                      <Badge tone="green">{x.category}</Badge>
                      <p className="mt-1 text-sm">{x.description || "No description"}</p>
                      <p className="text-xs text-stone">{formatDate(x.spent_on)}</p>
                    </div>
                    <span className="font-medium">{money(x.amount, currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-sage pt-4">
                {byCategory.map(([c, v]) => (
                  <p key={c} className="flex justify-between text-sm text-stone"><span className="capitalize">{c}</span><span>{money(v, currency)}</span></p>
                ))}
                <p className="mt-2 flex justify-between font-display text-lg text-canopy"><span>Total</span><span>{money(total, currency)}</span></p>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
