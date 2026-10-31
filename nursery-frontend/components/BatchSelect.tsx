"use client";
import { Batch } from "@/lib/api";
import { Field, inputClass } from "./ui";

export default function BatchSelect({ batches, value, onChange }: { batches: Batch[]; value: number | ""; onChange: (id: number | "") => void }) {
  return (
    <Field label="Batch">
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")} required>
        <option value="">Choose a batch</option>
        {batches.map((b) => (
          <option key={b.batch_id} value={b.batch_id}>{b.name} - {b.stock} in stock</option>
        ))}
      </select>
    </Field>
  );
}
