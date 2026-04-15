export interface SessionLog {
  id: string;
  sessionTitle: string;
  sessionSubtitle?: string;
  startedAt: string; // ISO
  durationSeconds: number;
  exerciseCount: number;
  notes: string;
}

const STORAGE_KEY = "zoneit_session_logs";

export function getSessionLogs(): SessionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionLog[];
  } catch {
    return [];
  }
}

export function addSessionLog(log: Omit<SessionLog, "id">): SessionLog {
  const full: SessionLog = { ...log, id: crypto.randomUUID() };
  const logs = getSessionLogs();
  logs.push(full);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  return full;
}

export function deleteSessionLog(id: string): void {
  const logs = getSessionLogs().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}
