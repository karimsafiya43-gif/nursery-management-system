"use client";
import { useCallback, useEffect, useState } from "react";
import { Batch, getBatches } from "./api";

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try { setBatches(await getBatches()); setError(""); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { batches, loading, error, reload };
}
