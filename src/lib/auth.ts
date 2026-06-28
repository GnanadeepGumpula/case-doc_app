// Simple local auth (browser-only). Email + password stored as a SHA-256 hash
// in localStorage. No server, no recovery — appropriate for the
// "local browser only" storage choice.

const USER_KEY = "bestcase.user.v1";
const SESSION_KEY = "bestcase.session.v1";

interface StoredUser {
  email: string;
  passwordHash: string;
  createdAt: number;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as StoredUser) : null;
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "1";
}

export async function signUp(email: string, password: string) {
  if (getUser()) throw new Error("An account already exists on this device.");
  const user: StoredUser = {
    email: email.trim().toLowerCase(),
    passwordHash: await sha256(password),
    createdAt: Date.now(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, "1");
  window.dispatchEvent(new Event("bestcase:auth"));
}

export async function signIn(email: string, password: string) {
  const user = getUser();
  if (!user) throw new Error("No account on this device. Create one first.");
  if (user.email !== email.trim().toLowerCase()) throw new Error("Invalid email or password.");
  if (user.passwordHash !== (await sha256(password))) throw new Error("Invalid email or password.");
  localStorage.setItem(SESSION_KEY, "1");
  window.dispatchEvent(new Event("bestcase:auth"));
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("bestcase:auth"));
}
