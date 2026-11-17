import type { Difficulty, Priority, Ticket } from "./types";

export type SortMode = "manual" | "priority" | "difficulty";

const STORAGE_KEY = "board-sort";
const UNSET = 3;
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const DIFFICULTY_RANK: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

const priorityRank = (t: Ticket) =>
  t.priority ? PRIORITY_RANK[t.priority] : UNSET;
const difficultyRank = (t: Ticket) =>
  t.difficulty ? DIFFICULTY_RANK[t.difficulty] : UNSET;

function compare(a: Ticket, b: Ticket, mode: SortMode): number {
  if (mode === "priority") {
    return (
      priorityRank(a) - priorityRank(b) || difficultyRank(a) - difficultyRank(b)
    );
  }
  if (mode === "difficulty") {
    return (
      difficultyRank(a) - difficultyRank(b) || priorityRank(a) - priorityRank(b)
    );
  }
  return 0;
}

export function sortLane(tickets: Ticket[], mode: SortMode): Ticket[] {
  return [...tickets].sort(
    (a, b) => compare(a, b, mode) || a.position - b.position,
  );
}

export function readSortMode(): SortMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "priority" || stored === "difficulty" ? stored : "manual";
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
