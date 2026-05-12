export interface HistoryEntry {
  id: string;
  type: 'summary' | 'comparison';
  label: string;
  date: string;
  agentName: string;
  data: unknown;
}

const KEY = 'policysnap_history';
const MAX = 5;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'date'>): void {
  try {
    const history = getHistory();
    const next: HistoryEntry = { ...entry, id: Date.now().toString(), date: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify([next, ...history].slice(0, MAX)));
  } catch {}
}
