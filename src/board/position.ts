import type { Status, Ticket } from "./types";

export function positionBetween(
  before: number | null,
  after: number | null,
): number {
  if (before === null && after === null) return 0;
  if (before === null) return (after as number) - 1;
  if (after === null) return before + 1;
  return (before + after) / 2;
}

function columnOf(tickets: Ticket[], status: Status): Ticket[] {
  return tickets
    .filter((t) => t.status === status)
    .sort((a, b) => a.position - b.position);
}

export function topPosition(tickets: Ticket[], status: Status): number {
  const column = columnOf(tickets, status);
  return positionBetween(null, column[0]?.position ?? null);
}

export function resolvePriorityDrop(
  tickets: Ticket[],
  activeId: number,
  status: Status,
): { status: Status; position: number } | null {
  const active = tickets.find((t) => t.id === activeId);
  if (!active || active.status === status) return null;
  return { status, position: topPosition(tickets, status) };
}

export function resolveDrop(
  tickets: Ticket[],
  activeId: number,
  target: { status: Status; overTicketId: number | null },
): { status: Status; position: number } | null {
  const active = tickets.find((t) => t.id === activeId);
  if (!active || target.overTicketId === activeId) return null;

  const sameColumn = active.status === target.status;
  const fullColumn = columnOf(tickets, target.status);
  const column = fullColumn.filter((t) => t.id !== activeId);
  const originalIndex = sameColumn
    ? fullColumn.findIndex((t) => t.id === activeId)
    : -1;

  let insertIndex = target.status === "done" ? 0 : column.length;
  if (target.overTicketId !== null) {
    const overIndex = column.findIndex((t) => t.id === target.overTicketId);
    if (overIndex !== -1) {
      const movingDown = sameColumn && originalIndex <= overIndex;
      insertIndex = movingDown ? overIndex + 1 : overIndex;
    }
  }

  if (sameColumn && insertIndex === originalIndex) return null;

  return {
    status: target.status,
    position: positionBetween(
      column[insertIndex - 1]?.position ?? null,
      column[insertIndex]?.position ?? null,
    ),
  };
}
