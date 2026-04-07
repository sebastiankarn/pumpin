import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { BodyWeightLog } from "../types";

export function useBodyWeight() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BodyWeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("body_weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true });
    setLogs(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addLog = async (weight: number, unit: "kg" | "lbs") => {
    if (!user) return;
    const newLog = {
      id: crypto.randomUUID(),
      user_id: user.id,
      weight,
      unit,
      logged_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("body_weight_logs").insert(newLog);
    if (!error) {
      setLogs((prev) => [...prev, newLog]);
    }
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase
      .from("body_weight_logs")
      .delete()
      .eq("id", id);
    if (!error) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  return { logs, loading, addLog, deleteLog, reload: load };
}
