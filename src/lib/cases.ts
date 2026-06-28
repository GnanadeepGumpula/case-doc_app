import { supabase } from "./supabase";

export interface CaseRecord {
  id: string; // internal uuid
  date: string;
  caseId: string;
  callTime: string;
  emergencyType: string;
  subType: string;
  district: string;
  ambulanceBase: string;
  ambulanceContact: string;
  emtName: string;
  emtId: string;
  pilotName: string;
  pilotId: string;
  mechanism: string;
  sceneDescription: string;
  duringTransport: string;
  hospitalHandover: string;
  outcome: string;
  photo?: string;
  photos?: string[];
  createdAt: number;
  updatedAt: number;
}

export const CASE_LIMIT = 24;

function normalizeCase(c: CaseRecord): CaseRecord {
  const photos = c.photos?.filter(Boolean) ?? [];
  const primaryPhoto = c.photo ?? photos[0];
  return {
    ...c,
    id: c.id || crypto.randomUUID(),
    photos,
    photo: primaryPhoto,
    createdAt: c.createdAt || Date.now(),
    updatedAt: c.updatedAt || Date.now(),
  };
}

function getCaseTitle(c: Partial<CaseRecord>): string {
  const titleParts = [c.caseId, c.emergencyType, c.subType, c.district]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  return titleParts.join(" • ") || "Untitled case";
}

function mapCaseRow(row: { id?: string; payload?: Partial<CaseRecord> } | null | undefined): CaseRecord {
  const payload = (row?.payload ?? {}) as Partial<CaseRecord>;
  return normalizeCase({ ...(payload as CaseRecord), id: row?.id ?? payload.id ?? crypto.randomUUID() });
}

async function getCurrentUserId() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (session?.user?.id) return session.user.id;

  try {
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (!refreshError && refreshedSession?.user?.id) {
      return refreshedSession.user.id;
    }
  } catch {
    // Fall back to a direct user lookup below.
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (userError.message?.includes("Auth session missing")) return null;
    throw userError;
  }

  return user?.id ?? null;
}

export async function loadCases(): Promise<CaseRecord[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("cases")
    .select("id,payload")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapCaseRow(row as { id?: string; payload?: Partial<CaseRecord> }));
}

export async function saveCases(list: CaseRecord[]) {
  await Promise.all(list.map((item) => upsertCase(item)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bestcase:changed"));
  }
}

export async function upsertCase(c: CaseRecord): Promise<CaseRecord> {
  const normalized = normalizeCase(c);
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Please sign in to save case data.");

  const { data, error } = await supabase
    .from("cases")
    .upsert(
      {
        id: normalized.id,
        user_id: userId,
        title: getCaseTitle(normalized),
        payload: normalized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id,payload")
    .single();

  if (error) {
    console.error("Supabase case save failed", error);
    throw new Error(error.message || "Unable to save case. Check your connection and sign-in status.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bestcase:changed"));
  }

  return mapCaseRow(data as { id?: string; payload?: Partial<CaseRecord> });
}

export async function deleteCase(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from("cases").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bestcase:changed"));
  }
}

export async function getCase(id: string): Promise<CaseRecord | undefined> {
  const userId = await getCurrentUserId();
  if (!userId) return undefined;

  const { data, error } = await supabase.from("cases").select("id,payload").eq("id", id).eq("user_id", userId).single();
  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return undefined;
    throw error;
  }

  return mapCaseRow(data as { id?: string; payload?: Partial<CaseRecord> });
}

export async function getCaseCount(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { count, error } = await supabase.from("cases").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function checkCaseLimit(): Promise<{ count: number; reached: boolean; limit: number }> {
  const count = await getCaseCount();
  return { count, reached: count >= CASE_LIMIT, limit: CASE_LIMIT };
}

export function emptyCase(): CaseRecord {
  return {
    id: "",
    date: "",
    caseId: "",
    callTime: "",
    emergencyType: "",
    subType: "",
    district: "",
    ambulanceBase: "",
    ambulanceContact: "",
    emtName: "",
    emtId: "",
    pilotName: "",
    pilotId: "",
    mechanism: "",
    sceneDescription: "",
    duringTransport: "",
    hospitalHandover: "",
    outcome: "",
    photos: [],
    createdAt: 0,
    updatedAt: 0,
  };
}
