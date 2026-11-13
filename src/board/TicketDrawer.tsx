import {
  Button,
  chakra,
  Dialog,
  Drawer,
  Editable,
  Flex,
  IconButton,
  Input,
  Link,
  NativeSelect,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState, type ReactNode } from "react";
import { LuX } from "react-icons/lu";
import { linkLabel } from "./format";
import { LinkifiedText } from "./LinkifiedText";
import { topPosition } from "./position";
import { useDeleteTicket, useUpdateTicket } from "./queries";
import { TicketHistory } from "./TicketHistory";
import { ProjectTag } from "./TicketCard";
import { TicketImages } from "./TicketImages";
import { COLUMNS, type Board, type Status, type Ticket } from "./types";
import { useAddImages } from "./useAddImages";

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
      <Flex align="center" justify="space-between">
        <Text fontSize="13px" fontWeight="600" color="app.muted">
          {title}
        </Text>
        {action}
      </Flex>
      {children}
    </Stack>
  );
}

const FieldLabel = chakra("label", { base: { color: "app.muted" } });

function Description({ ticket }: { ticket: Ticket }) {
  const update = useUpdateTicket();
  const [editing, setEditing] = useState(false);

  const action = editing ? null : (
    <Button size="xs" variant="ghost" onClick={() => setEditing(true)}>
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
              event.stopPropagation();
              setEditing(false);
            }
          }}
          onBlur={(event) => {
            const value = event.target.value;
            if (value !== ticket.description) {
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

function hasFiles(types: readonly string[]) {
  return types.includes("Files");
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
  const project = board.projects.find((p) => p.slug === ticket.projectSlug);
  const save = (patch: Parameters<typeof update.mutate>[0]["patch"]) =>
    update.mutate({ id: ticket.id, patch });

  return (
    <Drawer.Root
      open
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      placement="end"
      size={{ base: "full", md: "md" }}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content
            bg="app.card"
            color="app.ink"
            onPaste={(event) => {
              const files = Array.from(event.clipboardData?.files ?? []);
              if (files.length === 0) return;
              event.preventDefault();
              addImages(files);
            }}
            onDragOver={(event) => {
              if (hasFiles(Array.from(event.dataTransfer?.types ?? []))) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => {
              const files = Array.from(event.dataTransfer?.files ?? []);
              if (files.length === 0) return;
              event.preventDefault();
              addImages(files);
            }}
          >
            <Drawer.Header justifyContent="space-between" pb="2">
              <ProjectTag project={project} />
              <Drawer.CloseTrigger asChild position="static">
                <IconButton
                  aria-label="Fermer le détail"
                  variant="ghost"
                  size="sm"
                >
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body display="flex" flexDirection="column" gap="5">
              <Editable.Root
                key={ticket.title}
                defaultValue={ticket.title}
                submitMode="both"
                fontFamily="heading"
                fontSize="20px"
                fontWeight="700"
                onValueCommit={({ value }) => {
                  const title = value.trim();
                  if (title && title !== ticket.title) save({ title });
                }}
              >
                <Drawer.Title asChild>
                  <Editable.Preview />
                </Drawer.Title>
                <Editable.Input aria-label="Titre" />
              </Editable.Root>

              <Flex direction="column" gap="2.5">
                <Flex align="center" gap="3">
                  <FieldLabel htmlFor="ticket-status" w="120px" flex="none">
                    Colonne
                  </FieldLabel>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      id="ticket-status"
                      value={ticket.status}
                      onChange={(event) => {
                        const status = event.target.value as Status;
                        save({
                          status,
                          position: topPosition(board.tickets, status),
                        });
                      }}
                    >
                      {COLUMNS.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Flex>
                <Flex align="center" gap="3">
                  <FieldLabel htmlFor="ticket-assignee" w="120px" flex="none">
                    Qui s'en occupe
                  </FieldLabel>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      id="ticket-assignee"
                      value={ticket.assigneeEmail ?? ""}
                      onChange={(event) =>
                        save({ assigneeEmail: event.target.value || null })
                      }
                    >
                      <option value="">Personne</option>
                      {board.members.map((member) => (
                        <option key={member.email} value={member.email}>
                          {member.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Flex>
                <Flex align="center" gap="3">
                  <FieldLabel htmlFor="ticket-link" w="120px" flex="none">
                    Lien
                  </FieldLabel>
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
                </Flex>
                {ticket.link && (
                  <Link
                    href={ticket.link}
                    target="_blank"
                    rel="noreferrer"
                    color="app.accent"
                    fontSize="13px"
                    ms="132px"
                  >
                    {`Ouvrir ${linkLabel(ticket.link)}`}
                  </Link>
                )}
              </Flex>

              <Description ticket={ticket} />

              <Section title="Images">
                <TicketImages ticketId={ticket.id} />
              </Section>

              <Section title="Historique">
                <TicketHistory ticketId={ticket.id} members={board.members} />
              </Section>
            </Drawer.Body>
            <Drawer.Footer justifyContent="flex-start">
              <DeleteTicket ticket={ticket} onDeleted={onClose} />
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
