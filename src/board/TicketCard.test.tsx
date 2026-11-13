import { screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { members, projects, tickets } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import { TicketCard } from "./TicketCard";
import type { Ticket } from "./types";

function renderCard(ticket: Ticket) {
  const project = projects.find((p) => p.slug === ticket.projectSlug)!;
  const assignee =
    members.find((m) => m.email === ticket.assigneeEmail) ?? null;
  return renderWithProviders(
    <DndContext>
      <SortableContext items={[ticket.id]}>
        <TicketCard
          ticket={ticket}
          project={project}
          assignee={assignee}
          onOpen={() => {}}
        />
      </SortableContext>
    </DndContext>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T15:00:00"));
});
afterEach(() => vi.useRealTimers());

it("shows project, title, initials, PR label and « Claude · <time> »", () => {
  renderCard(tickets.find((t) => t.id === 7)!);
  expect(screen.getByText("Notia")).toBeInTheDocument();
  expect(screen.getByText("Accueil direction E en ligne")).toBeInTheDocument();
  expect(screen.getByText("CB")).toHaveAttribute("title", "CreniautB");
  expect(screen.getByText("PR #148")).toBeInTheDocument();
  expect(screen.getByText("Claude · il y a 3 j")).toBeInTheDocument();
});

it("shows « Claude · hier » for a ticket Claude moved yesterday", () => {
  renderCard(tickets.find((t) => t.id === 5)!);
  expect(screen.getByText("Claude · hier")).toBeInTheDocument();
});

it("shows the image count when the ticket has images", () => {
  renderCard(tickets.find((t) => t.id === 3)!);
  expect(screen.getByLabelText("2 images")).toBeInTheDocument();
  expect(screen.queryByText(/^Claude/)).not.toBeInTheDocument();
});

it("unassigned card shows the dashed « – » avatar", () => {
  renderCard(tickets.find((t) => t.id === 1)!);
  expect(screen.getByText("–")).toHaveAttribute("title", "Personne");
});
