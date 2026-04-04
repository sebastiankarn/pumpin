import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchWithCache } from "../lib/sync";
import { useAuth } from "../contexts/AuthContext";
import type {
  Exercise,
  Template,
  TemplateDay,
  TemplateDayExercise,
  UserProfile,
} from "../types";

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchWithCache<Exercise[]>("exercises", () =>
      supabase.from("exercises").select("*").order("name"),
    );
    setExercises(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addExercise = async (
    exercise: Omit<Exercise, "id" | "created_by" | "is_global">,
  ) => {
    const { data, error } = await supabase
      .from("exercises")
      .insert({ ...exercise, is_global: false })
      .select()
      .single();
    if (!error && data) {
      setExercises((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
    return { data, error };
  };

  const updateExercise = async (
    id: string,
    updates: Partial<Omit<Exercise, "id" | "created_by" | "is_global">>,
  ) => {
    const { data, error } = await supabase
      .from("exercises")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setExercises((prev) =>
        prev
          .map((e) => (e.id === id ? data : e))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
    return { data, error };
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (!error) {
      setExercises((prev) => prev.filter((e) => e.id !== id));
    }
    return { error };
  };

  return {
    exercises,
    loading,
    addExercise,
    updateExercise,
    deleteExercise,
    reload: load,
  };
}

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchWithCache<Template[]>(`templates-${user.id}`, () =>
      supabase
        .from("templates")
        .select("*")
        .or(`created_by.eq.${user.id},is_public.eq.true`),
    );
    setTemplates(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { templates, loading, setTemplates, reload: load };
}

export function useTemplateDays(templateId: string | null) {
  const [days, setDays] = useState<TemplateDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!templateId) {
      setDays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchWithCache<TemplateDay[]>(
      `template-days-${templateId}`,
      () =>
        supabase
          .from("template_days")
          .select("*")
          .eq("template_id", templateId)
          .order("day_index"),
    );
    setDays(data ?? []);
    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    load();
  }, [load]);

  return { days, loading, reload: load };
}

export function useTemplateDayExercises(templateDayId: string | null) {
  const [exercises, setExercises] = useState<TemplateDayExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!templateDayId) {
      setExercises([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchWithCache<TemplateDayExercise[]>(
      `tde-${templateDayId}`,
      () =>
        supabase
          .from("template_day_exercises")
          .select("*, exercise:exercises(*)")
          .eq("template_day_id", templateDayId)
          .order("order_index"),
    );
    setExercises(data ?? []);
    setLoading(false);
  }, [templateDayId]);

  useEffect(() => {
    load();
  }, [load]);

  return { exercises, loading, reload: load };
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchWithCache<UserProfile>(`profile-${user.id}`, () =>
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    );
    setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id);
    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }
    return { error };
  };

  return { profile, loading, updateProfile, reload: load };
}
