import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LuGauge, LuImage, LuSparkles } from "react-icons/lu";
import { cardStyle } from "./cardStyle";
import { formatRelative, linkLabel } from "./format";
import { MemberAvatar } from "./MemberAvatar";
import {
  DIFFICULTIES,
  PRIORITIES,
  type Difficulty,
  type Member,
  type Priority,
  type Project,
  type Ticket,
} from "./types";

const tagStyle = {
  align: "center",
  gap: "1",
  h: "20px",
  px: "2",
  borderRadius: "full",
  borderWidth: "1px",
  borderColor: "app.line",
  fontSize: "11px",
  lineHeight: "1",
  whiteSpace: "nowrap",
} as const;

function PriorityTag({ priority }: { priority: Priority }) {
  const label = PRIORITIES.find((p) => p.id === priority)?.label ?? "";
  const name = `Priorité ${label.toLowerCase()}`;
  return (
    <Flex
      {...tagStyle}
      fontWeight="600"
      color="app.ink"
      aria-label={name}
      title={name}
    >
      <Box
        aria-hidden="true"
        w="7px"
        h="7px"
        borderRadius="full"
        flex="none"
        bg={`priority.${priority}`}
      />
      <Text as="span" aria-hidden="true">
        {label}
      </Text>
    </Flex>
  );
}

function DifficultyTag({ difficulty }: { difficulty: Difficulty }) {
  const label = DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? "";
  const name = `Difficulté ${label.toLowerCase()}`;
  return (
    <Flex {...tagStyle} aria-label={name} title={name}>
      <LuGauge aria-hidden="true" />
      <Text as="span" aria-hidden="true">
        {label}
      </Text>
    </Flex>
  );
}

interface CardProps {
  ticket: Ticket;
  project: Project | undefined;
  assignee: Member | null;
}

export function ProjectTag({ project }: { project: Project | undefined }) {
  return (
    <Flex
      align="center"
      gap="1.5"
      fontSize="12px"
      color="app.muted"
      fontWeight="500"
    >
      <Box
        aria-hidden="true"
        w="7px"
        h="7px"
        borderRadius="2px"
        flex="none"
        style={{ background: project?.color ?? "gray" }}
      />
      {project?.name ?? "Sans projet"}
    </Flex>
  );
}

export function CardContent({ ticket, project, assignee }: CardProps) {
  return (
    <>
      <ProjectTag project={project} />
      <Heading
        as="h3"
        fontFamily="body"
        fontSize="14px"
        fontWeight="500"
        lineHeight="1.35"
        color={ticket.status === "done" ? "app.muted" : "app.ink"}
        overflowWrap="anywhere"
      >
        {ticket.title}
      </Heading>
      <Flex
        align="center"
        wrap="wrap"
        gap="1 2"
        minH="24px"
        fontSize="12px"
        color="app.muted"
      >
        <MemberAvatar member={assignee} />
        {ticket.priority && <PriorityTag priority={ticket.priority} />}
        {ticket.difficulty && <DifficultyTag difficulty={ticket.difficulty} />}
        {ticket.link && <Text>{linkLabel(ticket.link)}</Text>}
        {ticket.imageCount > 0 && (
          <Flex
            align="center"
            gap="1"
            aria-label={`${ticket.imageCount} image${ticket.imageCount > 1 ? "s" : ""}`}
          >
            <LuImage aria-hidden="true" />
            <Text as="span" aria-hidden="true">
              {ticket.imageCount}
            </Text>
          </Flex>
        )}
        {ticket.lastActor === "claude" && (
          <Flex
            ms="auto"
            align="center"
            gap="1"
            color="app.claude"
            fontWeight="500"
            title="Dernière modification par Claude"
          >
            <LuSparkles aria-hidden="true" />
            <Text as="span">{`Claude · ${formatRelative(ticket.updatedAt, new Date())}`}</Text>
          </Flex>
        )}
      </Flex>
    </>
  );
}

export function TicketCard({
  onOpen,
  selected = false,
  ...props
}: CardProps & { onOpen: (id: number) => void; selected?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.ticket.id,
    data: { status: props.ticket.status },
  });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      {...cardStyle}
      aria-current={selected || undefined}
      cursor="grab"
      opacity={isDragging ? 0.4 : 1}
      borderColor={selected ? "app.accent" : "transparent"}
      _hover={{ borderColor: selected ? "app.accent" : "app.line" }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "app.accent",
        outlineOffset: "2px",
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={() => onOpen(props.ticket.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(props.ticket.id);
      }}
    >
      <CardContent {...props} />
    </Box>
  );
}
