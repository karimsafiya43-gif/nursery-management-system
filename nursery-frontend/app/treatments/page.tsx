
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  Field,
  Loading,
  PageHeader,
  SuccessNote,
  inputClass,
} from "@/components/ui";

import BatchSelect from "@/components/BatchSelect";
import { useBatches } from "@/lib/useBatches";

import {
  getIssues,
  getObservations,
  getTreatments,
  Issue,
  Observation,
  logTreatment,
  Treatment,
  TreatmentStatus,
} from "@/lib/api";

import {
  dateError,
  formatDate,
  today,
} from "@/lib/format";

const groups: {
  category: Issue["category"];
  label: string;
}[] = [
  { category: "pest", label: "Pests" },
  { category: "disease", label: "Diseases" },
  { category: "nutrient", label: "Nutrient deficiencies" },
  { category: "environmental", label: "Environmental problems" },
  { category: "other", label: "Other" },
];

export default function TreatmentsPage() {
  const {
    batches,
    loading,
    error: batchError,
  } = useBatches();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  const [batchId, setBatchId] = useState<number | "">("");
  const [observationId, setObservationId] = useState<number | "">("");
  const [issueId, setIssueId] = useState<number | "">("");

  const [treatmentDate, setTreatmentDate] = useState(today());
  const [treatmentName, setTreatmentName] = useState("");

  const [status, setStatus] =
    useState<TreatmentStatus>("in_progress");

  const [notes, setNotes] = useState("");

  const [history, setHistory] =
    useState<Treatment[] | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const batch = batches.find(
    (b) => b.batch_id === batchId
  );

  useEffect(() => {
    getIssues()
      .then(setIssues)
      .catch((e) => setError(e.message));
  }, []);

  const loadHistory = useCallback(
    async (id: number | "") => {
      if (!id) {
        setHistory(null);
        return;
      }

      setHistory(null);

      try {
        const records = await getTreatments(id);
        setHistory(records);
      } catch (e) {
        setError((e as Error).message);
        setHistory([]);
      }
    },
    []
  );

  useEffect(() => {
    loadHistory(batchId);
  }, [batchId, loadHistory]);

  useEffect(() => {
    let active = true;

    setObservations([]);
    setObservationId("");

    if (!batchId) return;

    getObservations(batchId)
      .then((data) => {
        if (active) setObservations(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });

    return () => {
      active = false;
    };
  }, [batchId]);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setDone("");

    if (!batchId || !observationId || !issueId) {
      setError(
        "Select a batch, health observation and issue."
      );
      return;
    }

    const problem = dateError(
      treatmentDate,
      batch?.sown_date
    );

    if (problem) {
      setError(problem);
      return;
    }

    if (!treatmentName.trim()) {
      setError("Enter the treatment given.");
      return;
    }

    setSaving(true);

    try {
      await logTreatment({
        observation_id: Number(observationId),
        issue_id: Number(issueId),
        treatment_name: treatmentName.trim(),
        treatment_date: treatmentDate,
        status,
        notes: notes.trim() || null,
      });

      setDone("Treatment saved successfully.");

      setTreatmentName("");
      setNotes("");
      setIssueId("");

      await loadHistory(batchId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Treatments"
        subtitle="Record treatments for pests, diseases and other plant problems."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          title="New treatment"
          className="lg:col-span-3"
        >
          <ErrorAlert message={error || batchError} />
          <SuccessNote message={done} />

          <form
            onSubmit={submit}
            className="space-y-4"
          >
            <BatchSelect
              batches={batches}
              value={batchId}
              onChange={setBatchId}
            />

            <Field label="Health observation">
              <select
                className={inputClass}
                value={observationId}
                onChange={(e) =>
                  setObservationId(
                    e.target.value
                      ? Number(e.target.value)
                      : ""
                  )
                }
                required
                disabled={
                  !batchId || observations.length === 0
                }
              >
                <option value="">
                  Choose a health observation
                </option>

                {observations.map((o) => (
                  <option
                    key={o.observation_id}
                    value={o.observation_id}
                  >
                    {formatDate(o.observed_on)} — {o.health_status}
                  </option>
                ))}
              </select>

              {batchId && observations.length === 0 && (
                <p className="mt-1 text-sm text-stone">
                  No health observations found for this batch.
                  Record a health check first.
                </p>
              )}
            </Field>

            <Field label="Problem found">
              <select
                className={inputClass}
                value={issueId}
                onChange={(e) =>
                  setIssueId(
                    e.target.value
                      ? Number(e.target.value)
                      : ""
                  )
                }
                required
              >
                <option value="">
                  Choose a pest, disease or other problem
                </option>

                {groups.map((g) => (
                  <optgroup
                    key={g.category}
                    label={g.label}
                  >
                    {issues
                      .filter(
                        (i) => i.category === g.category
                      )
                      .map((i) => (
                        <option
                          key={i.issue_id}
                          value={i.issue_id}
                        >
                          {i.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            <Field label="Treatment date">
              <input
                type="date"
                className={inputClass}
                value={treatmentDate}
                min={batch?.sown_date}
                max={today()}
                onChange={(e) =>
                  setTreatmentDate(e.target.value)
                }
                required
              />
            </Field>

            <Field label="Treatment given">
              <textarea
                rows={3}
                className={inputClass}
                value={treatmentName}
                onChange={(e) =>
                  setTreatmentName(e.target.value)
                }
                placeholder="Neem oil spray, twice a week"
                maxLength={150}
                required
              />
            </Field>

            <Field label="Treatment status">
              <select
                className={inputClass}
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as TreatmentStatus
                  )
                }
              >
                <option value="planned">Planned</option>
                <option value="in_progress">
                  In progress
                </option>
                <option value="completed">Completed</option>
              </select>
            </Field>

            <Field label="Notes">
              <textarea
                rows={2}
                className={inputClass}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional treatment details"
              />
            </Field>

            <Button
              type="submit"
              loading={saving}
              disabled={
                !batchId ||
                !observationId ||
                !issueId ||
                loading ||
                saving
              }
            >
              Save treatment
            </Button>
          </form>
        </Card>

        <Card
          title="Treatment history"
          hint={
            batch
              ? batch.name
              : "Choose a batch to see its treatments."
          }
          className="lg:col-span-2"
        >
          {!batchId ? (
            <EmptyState>No batch selected.</EmptyState>
          ) : history === null ? (
            <Loading />
          ) : history.length === 0 ? (
            <EmptyState>
              No treatments recorded for this batch.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {history.map((t) => (
                <li
                  key={t.treatment_id}
                  className="rounded-xl bg-mist px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {t.issue_name || "Issue not specified"}
                    </span>

                    <Badge
                      tone={
                        t.status === "completed"
                          ? "green"
                          : "amber"
                      }
                    >
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-stone">
                    {formatDate(t.treatment_date)}
                  </p>

                  <p className="mt-1 text-sm">
                    {t.treatment_name}
                  </p>

                  {t.notes && (
                    <p className="mt-1 text-sm text-stone">
                      {t.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

