import {
  DIFFICULTIES,
  PRIORITIES,
  type Difficulty,
  type Priority,
  type Ticket,
} from "./types";

export const NONE = "none";

export type PriorityChoice = Priority | typeof NONE;
export type DifficultyChoice = Difficulty | typeof NONE;

export interface BoardFilters {
  priorities: PriorityChoice[];
  difficulties: DifficultyChoice[];
}

export const NO_FILTERS: BoardFilters = { priorities: [], difficulties: [] };

const STORAGE_KEY = "board-filters";
const PRIORITY_CHOICES: PriorityChoice[] = [
  ...PRIORITIES.map((p) => p.id),
  NONE,
];
const DIFFICULTY_CHOICES: DifficultyChoice[] = [
  ...DIFFICULTIES.map((d) => d.id),
  NONE,
];

const accepts = <T extends string>(checked: T[], value: T) =>
  checked.length === 0 || checked.includes(value);

export function matchesFilters(ticket: Ticket, filters: BoardFilters): boolean {
  return (
    accepts(filters.priorities, ticket.priority ?? NONE) &&
    accepts(filters.difficulties, ticket.difficulty ?? NONE)
  );
}

export function hasFilters(filters: BoardFilters): boolean {
  return filters.priorities.length > 0 || filters.difficulties.length > 0;
}

function known<T extends string>(value: unknown, choices: T[]): T[] {
  return Array.isArray(value)
    ? choices.filter((choice) => value.includes(choice))
    : [];
}

export function readFilters(): BoardFilters {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "{}",
    );
    if (typeof stored !== "object" || stored === null) return NO_FILTERS;
    const { priorities, difficulties } = stored as Record<string, unknown>;
    return {
      priorities: known(priorities, PRIORITY_CHOICES),
      difficulties: known(difficulties, DIFFICULTY_CHOICES),
    };
  } catch {
    return NO_FILTERS;
  }
}

export function writeFilters(filters: BoardFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    return;
  }
}
