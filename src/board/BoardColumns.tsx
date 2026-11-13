import { Box, Flex, Grid, Heading, Text } from "@chakra-ui/react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState, type ReactNode } from "react";
import { resolveDrop } from "./position";
import { useUpdateTicket } from "./queries";
import { cardStyle } from "./cardStyle";
import { CardContent, TicketCard } from "./TicketCard";
import { COLUMNS, type Board, type Status, type Ticket } from "./types";

interface ColumnsProps {
  board: Board;
  tickets: Ticket[];
  onOpen: (id: number) => void;
  laneAction?: (status: Status) => ReactNode;
}

const laneId = (status: Status) => `lane-${status}`;

function Lane({
  status,
  label,
  board,
  tickets,
  onOpen,
  action,
}: {
  status: Status;
  label: string;
  board: Board;
  tickets: Ticket[];
  onOpen: (id: number) => void;
  action?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: laneId(status),
    data: { status },
  });
  return (
    <Box
      as="section"
      aria-label={label}
      ref={setNodeRef}
      bg="app.lane"
      borderRadius="12px"
      p="2.5"
      minH="160px"
      display="flex"
      flexDirection="column"
      gap="2"
      borderWidth="1.5px"
      borderColor={isOver ? "app.accent" : "transparent"}
      transition="border-color .12s"
    >
      <Flex align="center" gap="2" px="1" pt="0.5" pb="1">
        <Box
          w="8px"
          h="8px"
          borderRadius="full"
          flex="none"
          bg={`status.${status}`}
        />
        <Heading as="h2" fontSize="14px" fontWeight="600">
          {label}
        </Heading>
        <Text color="app.muted" fontVariantNumeric="tabular-nums">
          {tickets.length}
        </Text>
        {action && <Box ms="auto">{action}</Box>}
      </Flex>
      <SortableContext
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            project={board.projects.find((p) => p.slug === ticket.projectSlug)}
            assignee={
              board.members.find((m) => m.email === ticket.assigneeEmail) ??
              null
            }
            onOpen={onOpen}
          />
        ))}
      </SortableContext>
    </Box>
  );
}

export function BoardColumns({
  board,
  tickets,
  onOpen,
  laneAction,
}: ColumnsProps) {
  const updateTicket = useUpdateTicket();
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const onDragStart = ({ active }: DragStartEvent) =>
    setActiveId(Number(active.id));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const status = over?.data.current?.status as Status | undefined;
    if (!over || !status) return;
    const overTicketId = typeof over.id === "number" ? over.id : null;
    const drop = resolveDrop(tickets, Number(active.id), {
      status,
      overTicketId,
    });
    if (drop) updateTicket.mutate({ id: Number(active.id), patch: drop });
  };

  const active = tickets.find((t) => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <Grid
        flex="1"
        minW="0"
        templateColumns="repeat(4, minmax(230px, 1fr))"
        gap="3"
        px="5"
        pb="5"
        overflowX="auto"
        alignItems="start"
      >
        {COLUMNS.map((column) => (
          <Lane
            key={column.id}
            status={column.id}
            label={column.label}
            board={board}
            tickets={tickets
              .filter((t) => t.status === column.id)
              .sort((a, b) => a.position - b.position)}
            onOpen={onOpen}
            action={laneAction?.(column.id)}
          />
        ))}
      </Grid>
      <DragOverlay dropAnimation={null}>
        {active ? (
          <Box {...cardStyle} cursor="grabbing" borderColor="app.accent">
            <CardContent
              ticket={active}
              project={board.projects.find(
                (p) => p.slug === active.projectSlug,
              )}
              assignee={
                board.members.find((m) => m.email === active.assigneeEmail) ??
                null
              }
            />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
