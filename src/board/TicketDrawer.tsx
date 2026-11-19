import {
  Box,
  Button,
  chakra,
  Dialog,
  Editable,
  Flex,
  IconButton,
  Input,
  Portal,
  SegmentGroup,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuExternalLink, LuX } from "react-icons/lu";
import { hasFiles, isTextField } from "./dom";
import { linkLabel } from "./format";
import { LevelPicker } from "./LevelPicker";
import { LinkifiedText } from "./LinkifiedText";
import { MemberAvatar } from "./MemberAvatar";
import { topPosition } from "./position";
import { useDeleteTicket, useUpdateTicket } from "./queries";
import { TicketHistory } from "./TicketHistory";
import { ProjectTag, TicketNumber } from "./TicketCard";
import { TicketImages } from "./TicketImages";
import {
  COLUMNS,
  DIFFICULTIES,
  PRIORITIES,
  type Board,
  type Member,
  type Status,
  type Ticket,
  type TicketPatch,
} from "./types";
import { useAddImages } from "./useAddImages";

const labelStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "app.muted",
} as const;

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack gap="1.5">
      <Flex align="center" justify="space-between" minH="6">
        <Text {...labelStyle}>{title}</Text>
        {action}
      </Flex>
      {children}
    </Stack>
  );
}

const FieldLabel = chakra("label", { base: labelStyle });

function StatusPicker({
  value,
  onChange,
}: {
  value: Status;
  onChange: (status: Status) => void;
}) {
  return (
    <SegmentGroup.Root
      size="sm"
      w="full"
      minW="0"
      aria-label="Colonne"
      value={value}
      onValueChange={({ value: next }) => {
        const column = COLUMNS.find((c) => c.id === next);
        if (column && column.id !== value) onChange(column.id);
      }}
    >
      <SegmentGroup.Indicator />
      {COLUMNS.map((column) => (
        <SegmentGroup.Item key={column.id} value={column.id} flex="1" px="2">
          <SegmentGroup.ItemText
            display="inline-flex"
            alignItems="center"
            gap="1.5"
          >
            <Box
              aria-hidden="true"
              w="7px"
              h="7px"
              borderRadius="full"
              flex="none"
              bg={`status.${column.id}`}
            />
            {column.label}
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}

function AssigneeOption({
  pressed,
  label,
  member,
  onClick,
}: {
  pressed: boolean;
  label: string;
  member: Member | null;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      borderRadius="full"
      ps="1"
      pe={member ? "1" : "3"}
      fontWeight="500"
      aria-label={member ? label : undefined}
      aria-pressed={pressed}
      bg={pressed ? "app.lane" : "transparent"}
      color={pressed ? "app.ink" : "app.muted"}
      _hover={{ bg: "app.lane" }}
      onClick={onClick}
    >
      <Box
        as="span"
        aria-hidden="true"
        display="inline-flex"
        opacity={pressed ? 1 : 0.5}
      >
        <MemberAvatar member={member} />
      </Box>
      {!member && label}
    </Button>
  );
}

function AssigneePicker({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: string | null;
  onChange: (email: string | null) => void;
}) {
  const choose = (email: string | null) => {
    if (email !== value) onChange(email);
  };
  return (
    <Flex role="group" aria-label="Qui s'en occupe" gap="1" wrap="wrap">
      <AssigneeOption
        pressed={value === null}
        label="Personne"
        member={null}
        onClick={() => choose(null)}
      />
      {members.map((member) => (
        <AssigneeOption
          key={member.email}
          pressed={value === member.email}
          label={member.name}
          member={member}
          onClick={() => choose(member.email)}
        />
      ))}
    </Flex>
  );
}

function Description({ ticket }: { ticket: Ticket }) {
  const update = useUpdateTicket();
  const [editing, setEditing] = useState(false);
  const cancelled = useRef(false);

  const action = editing ? null : (
    <Button
      size="xs"
      variant="ghost"
      onClick={() => {
        cancelled.current = false;
        setEditing(true);
      }}
    >
      Modifier
    </Button>
  );

  return (
    <Section title="Description" action={action}>
      {editing ? (
        <Textarea
          aria-label="Description"
          autoFocus
          autoresize
          minH="120px"
          defaultValue={ticket.description}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancelled.current = true;
              setEditing(false);
            }
          }}
          onBlur={(event) => {
            const value = event.target.value;
            if (!cancelled.current && value !== ticket.description) {
              update.mutate({ id: ticket.id, patch: { description: value } });
            }
            setEditing(false);
          }}
        />
      ) : ticket.description ? (
        <LinkifiedText text={ticket.description} />
      ) : (
        <Text color="app.muted">Aucune description.</Text>
      )}
    </Section>
  );
}

function DeleteTicket({
  ticket,
  onDeleted,
}: {
  ticket: Ticket;
  onDeleted: () => void;
}) {
  const remove = useDeleteTicket();
  return (
    <Dialog.Root role="alertdialog">
      <Dialog.Trigger asChild>
        <Button variant="ghost" colorPalette="red" size="sm">
          Supprimer
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="app.card">
            <Dialog.Body pt="6">
              <Text>
                Supprimer ce ticket ? Ses images seront supprimées aussi.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Annuler</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="red"
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(ticket.id, { onSuccess: onDeleted })
                }
              >
                Supprimer
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export function TicketDrawer({
  ticket,
  board,
  onClose,
}: {
  ticket: Ticket | null;
  board: Board;
  onClose: () => void;
}) {
  if (!ticket) return null;
  return (
    <OpenTicketDrawer
      key={ticket.id}
      ticket={ticket}
      board={board}
      onClose={onClose}
    />
  );
}

function OpenTicketDrawer({
  ticket,
  board,
  onClose,
}: {
  ticket: Ticket;
  board: Board;
  onClose: () => void;
}) {
  const update = useUpdateTicket();
  const addImages = useAddImages(ticket.id);
  const panel = useRef<HTMLDivElement>(null);
  const project = board.projects.find((p) => p.slug === ticket.projectSlug);
  const save = (patch: TicketPatch) => update.mutate({ id: ticket.id, patch });

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const inOtherLayer = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      const layer = target.closest('[role="dialog"], [role="alertdialog"]');
      return layer !== null && layer !== panel.current;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isTextField(event.target) || inOtherLayer(event.target)) return;
      onClose();
    };
    const onPaste = (event: ClipboardEvent) => {
      const clipboard = event.clipboardData;
      const files = Array.from(clipboard?.files ?? []);
      const text = Array.from(clipboard?.types ?? []).includes("text/plain");
      if (files.length === 0 || inOtherLayer(event.target)) return;
      if (text && isTextField(event.target)) return;
      event.preventDefault();
      addImages(files);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("paste", onPaste);
    };
  });

  return (
    <Flex
      as="aside"
      ref={panel}
      role="dialog"
      aria-label={ticket.title}
      tabIndex={-1}
      direction="column"
      flex="none"
      w={{ base: "auto", md: "400px" }}
      position={{ base: "fixed", md: "relative" }}
      inset={{ base: "0", md: "auto" }}
      zIndex={{ base: "overlay", md: "auto" }}
      bg="app.card"
      color="app.ink"
      borderStartWidth={{ base: "0", md: "1px" }}
      borderColor="app.line"
      outline="none"
      onDragOver={(event) => {
        if (hasFiles(event.dataTransfer)) event.preventDefault();
      }}
      onDrop={(event) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length === 0) return;
        event.preventDefault();
        addImages(files);
      }}
    >
      <Flex align="center" justify="space-between" px="5" pt="3" pb="1">
        <Flex align="center" gap="2">
          <ProjectTag project={project} />
          <TicketNumber id={ticket.id} />
        </Flex>
        <IconButton
          aria-label="Fermer le détail"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <LuX />
        </IconButton>
      </Flex>
      <Flex
        direction="column"
        gap="5"
        flex="1"
        minH="0"
        overflowY="auto"
        px="5"
        pt="1"
        pb="4"
      >
        <Editable.Root
          key={ticket.title}
          defaultValue={ticket.title}
          submitMode="both"
          translations={{ edit: "Modifier le titre", input: "Titre" }}
          fontFamily="heading"
          fontSize="20px"
          fontWeight="700"
          onValueCommit={({ value }) => {
            const title = value.trim();
            if (title && title !== ticket.title) save({ title });
          }}
        >
          <Editable.Preview />
          <Editable.Input />
        </Editable.Root>

        <Section title="Colonne">
          <StatusPicker
            value={ticket.status}
            onChange={(status) =>
              save({ status, position: topPosition(board.tickets, status) })
            }
          />
        </Section>

        <Section title="Priorité">
          <LevelPicker
            label="Priorité"
            options={PRIORITIES}
            value={ticket.priority}
            onChange={(priority) => save({ priority })}
          />
        </Section>

        <Section title="Difficulté">
          <LevelPicker
            label="Difficulté"
            options={DIFFICULTIES}
            value={ticket.difficulty}
            onChange={(difficulty) => save({ difficulty })}
          />
        </Section>

        <Section title="Qui s'en occupe">
          <AssigneePicker
            members={board.members}
            value={ticket.assigneeEmail}
            onChange={(assigneeEmail) => save({ assigneeEmail })}
          />
        </Section>

        <Stack gap="1.5">
          <FieldLabel htmlFor="ticket-link">Lien</FieldLabel>
          <Flex gap="2">
            <Input
              id="ticket-link"
              size="sm"
              type="url"
              placeholder="https://github.com/…"
              key={ticket.link ?? ""}
              defaultValue={ticket.link ?? ""}
              onBlur={(event) => {
                const link = event.target.value.trim() || null;
                if (link !== ticket.link) save({ link });
              }}
            />
            {ticket.link && (
              <Button asChild size="sm" variant="outline" flex="none">
                <a
                  href={ticket.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ouvrir ${linkLabel(ticket.link)}`}
                >
                  Ouvrir
                  <LuExternalLink aria-hidden="true" />
                </a>
              </Button>
            )}
          </Flex>
        </Stack>

        <Description ticket={ticket} />

        <Section title="Images">
          <TicketImages ticketId={ticket.id} />
        </Section>

        <Section title="Historique">
          <TicketHistory ticketId={ticket.id} members={board.members} />
        </Section>
      </Flex>
      <Flex px="5" py="2.5" borderTopWidth="1px" borderColor="app.line">
        <DeleteTicket ticket={ticket} onDeleted={onClose} />
      </Flex>
    </Flex>
  );
}
