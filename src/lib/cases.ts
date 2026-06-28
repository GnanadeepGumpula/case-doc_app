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
  photo?: string; // base64 data URL
  createdAt: number;
  updatedAt: number;
}

const KEY = "bestcase.cases.v1";

export function loadCases(): CaseRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CaseRecord[];
  } catch {
    return [];
  }
}

export function saveCases(list: CaseRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("bestcase:changed"));
}

export function upsertCase(c: CaseRecord) {
  const all = loadCases();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.unshift(c);
  saveCases(all);
}

export function deleteCase(id: string) {
  saveCases(loadCases().filter((c) => c.id !== id));
}

export function getCase(id: string): CaseRecord | undefined {
  return loadCases().find((c) => c.id === id);
}

export function emptyCase(): CaseRecord {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    id: crypto.randomUUID(),
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    caseId: "",
    callTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
