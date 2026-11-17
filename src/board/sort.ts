import type { Difficulty, Priority, Ticket } from "./types";

export type SortMode = "manual" | "priority";

const STORAGE_KEY = "board-sort";
const UNSET = 3;
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const DIFFICULTY_RANK: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

function byPriority(a: Ticket, b: Ticket): number {
  const priority =
    (a.priority ? PRIORITY_RANK[a.priority] : UNSET) -
    (b.priority ? PRIORITY_RANK[b.priority] : UNSET);
  if (priority !== 0) return priority;
  return (
    (a.difficulty ? DIFFICULTY_RANK[a.difficulty] : UNSET) -
    (b.difficulty ? DIFFICULTY_RANK[b.difficulty] : UNSET)
  );
}

export function sortLane(tickets: Ticket[], mode: SortMode): Ticket[] {
  return [...tickets].sort(
    (a, b) =>
      (mode === "priority" ? byPriority(a, b) : 0) || a.position - b.position,
  );
}

export function readSortMode(): SortMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "priority"
      ? "priority"
      : "manual";
  } catch {
    return "manual";
  }
}

export function writeSortMode(mode: SortMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    return;
  }
}
