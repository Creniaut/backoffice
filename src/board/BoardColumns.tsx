import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  IconButton,
  SegmentGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
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
import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { resolveDrop, resolveSortedDrop } from "./position";
import { useUpdateTicket } from "./queries";
import { sortLane, type SortMode } from "./sort";
import { cardStyle } from "./cardStyle";
import { CardContent, TicketCard } from "./TicketCard";
import { COLUMNS, type Board, type Status, type Ticket } from "./types";

const DONE_VISIBLE = 5;

interface ColumnsProps {
  board: Board;
  tickets: Ticket[];
  selectedId: number | null;
  sortMode: SortMode;
  onOpen: (id: number) => void;
  onAdd: (status: Status) => void;
}

const laneId = (status: Status) => `lane-${status}`;

function olderLabel(hidden: number) {
  return hidden === 1
    ? "Voir le plus ancien"
    : `Voir les ${hidden} plus anciens`;
}

function Lane({
  status,
  label,
  board,
  tickets,
  selectedId,
  shownOnPhone,
  onOpen,
  onAdd,
}: {
  status: Status;
  label: string;
  board: Board;
  tickets: Ticket[];
  selectedId: number | null;
  shownOnPhone: boolean;
  onOpen: (id: number) => void;
  onAdd: (status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: laneId(status),
    data: { status },
  });
  const [showOlder, setShowOlder] = useState(false);
  const collapsible = status === "done" && tickets.length > DONE_VISIBLE;
  const shown =
    collapsible && !showOlder ? tickets.slice(0, DONE_VISIBLE) : tickets;

  return (
    <Box
      as="section"
      aria-label={label}
      ref={setNodeRef}
      bg="app.lane"
      borderRadius="12px"
      p="2.5"
      minW="0"
      minH="160px"
      display={{ base: shownOnPhone ? "flex" : "none", md: "flex" }}
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
        <IconButton
          aria-label={`Ajouter dans ${label}`}
          ms="auto"
          size="xs"
          variant="ghost"
          color="app.muted"
          onClick={() => onAdd(status)}
        >
          <LuPlus />
        </IconButton>
      </Flex>
      <SortableContext
        items={shown.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {shown.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            project={board.projects.find((p) => p.slug === ticket.projectSlug)}
            assignee={
              board.members.find((m) => m.email === ticket.assigneeEmail) ??
              null
            }
            selected={ticket.id === selectedId}
            onOpen={onOpen}
          />
        ))}
      </SortableContext>
      {collapsible && (
        <Button
          size="xs"
          variant="ghost"
          color="app.muted"
          alignSelf="flex-start"
          onClick={() => setShowOlder((value) => !value)}
        >
          {showOlder
            ? "Masquer les plus anciens"
            : olderLabel(tickets.length - DONE_VISIBLE)}
        </Button>
      )}
      {tickets.length === 0 && (
        <Stack
          flex="1"
          align="center"
          justify="center"
          gap="0"
          py="4"
          textAlign="center"
          fontSize="13px"
          color="app.muted"
        >
          <Text>Aucun ticket ici.</Text>
          <Text>
            <Button
              variant="plain"
              size="xs"
              h="auto"
              minW="0"
              p="0"
              fontSize="13px"
              fontWeight="600"
              color="app.accent"
              verticalAlign="baseline"
              onClick={() => onAdd(status)}
            >
              Ajouter
            </Button>{" "}
            ou glisser une carte.
          </Text>
        </Stack>
      )}
    </Box>
  );
}

function PhoneColumnPicker({
  tickets,
  value,
  onChange,
}: {
  tickets: Ticket[];
  value: Status;
  onChange: (status: Status) => void;
}) {
  return (
    <Box hideFrom="md" px="5" pb="3">
      <SegmentGroup.Root
        size="sm"
        w="full"
        minW="0"
        aria-label="Colonne affichée"
        value={value}
        onValueChange={({ value: next }) => {
          const column = COLUMNS.find((c) => c.id === next);
          if (column) onChange(column.id);
        }}
      >
        <SegmentGroup.Indicator />
        {COLUMNS.map((column) => (
          <SegmentGroup.Item
            key={column.id}
            value={column.id}
            flex="1"
            px="1.5"
          >
            <SegmentGroup.ItemText>
              {column.label}{" "}
              <Text as="span" opacity="0.65" fontVariantNumeric="tabular-nums">
                {tickets.filter((t) => t.status === column.id).length}
              </Text>
            </SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
    </Box>
  );
}

export function BoardColumns({
  board,
  tickets,
  selectedId,
  sortMode,
  onOpen,
  onAdd,
}: ColumnsProps) {
  const updateTicket = useUpdateTicket();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [phoneColumn, setPhoneColumn] = useState<Status>("doing");
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
    const drop =
      sortMode === "manual"
        ? resolveDrop(tickets, Number(active.id), { status, overTicketId })
        : resolveSortedDrop(board.tickets, Number(active.id), status);
    if (drop) updateTicket.mutate({ id: Number(active.id), patch: drop });
  };

  const active = tickets.find((t) => t.id === activeId);

  return (
    <Flex direction="column" flex="1" minW="0" minH="0">
      <PhoneColumnPicker
        tickets={tickets}
        value={phoneColumn}
        onChange={setPhoneColumn}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <Grid
          flex="1"
          minH="0"
          templateColumns={{
            base: "minmax(0, 1fr)",
            md: "repeat(4, minmax(200px, 1fr))",
          }}
          gap="3"
          px="5"
          pb="5"
          overflow="auto"
          alignItems="start"
        >
          {COLUMNS.map((column) => (
            <Lane
              key={column.id}
              status={column.id}
              label={column.label}
              board={board}
              tickets={sortLane(
                tickets.filter((t) => t.status === column.id),
                column.id === "done" ? "manual" : sortMode,
              )}
              selectedId={selectedId}
              shownOnPhone={column.id === phoneColumn}
              onOpen={onOpen}
              onAdd={onAdd}
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
    </Flex>
  );
}
