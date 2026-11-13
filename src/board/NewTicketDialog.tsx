import {
  Button,
  chakra,
  Dialog,
  Input,
  NativeSelect,
  Portal,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useState, type ReactNode } from "react";
import { topPosition } from "./position";
import { useCreateTicket } from "./queries";
import { COLUMNS, type Board, type Status } from "./types";

const Label = chakra("label", {
  base: { fontSize: "13px", fontWeight: "500", color: "app.muted" },
});

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Stack gap="1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </Stack>
  );
}

export function NewTicketDialog({
  board,
  status: initialStatus,
  projectSlug,
  onClose,
  onCreated,
}: {
  board: Board;
  status: Status;
  projectSlug: string | null;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const create = useCreateTicket();
  const [title, setTitle] = useState("");
  const [project, setProject] = useState(projectSlug ?? "");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [assignee, setAssignee] = useState("");
  const [description, setDescription] = useState("");
  const ready = title.trim() !== "" && project !== "";

  const submit = () => {
    if (!ready) return;
    create.mutate(
      {
        projectSlug: project,
        title: title.trim(),
        description,
        status,
        assigneeEmail: assignee || null,
        position: topPosition(board.tickets, status),
      },
      { onSuccess: (ticket) => onCreated(ticket.id) },
    );
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      initialFocusEl={() => document.getElementById("new-ticket-title")}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="app.card" color="app.ink">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <Dialog.Header>
                <Dialog.Title fontFamily="heading">Nouveau ticket</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="3">
                  <Field id="new-ticket-title" label="Titre">
                    <Input
                      id="new-ticket-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </Field>
                  <Field id="new-ticket-project" label="Projet">
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        id="new-ticket-project"
                        value={project}
                        onChange={(event) => setProject(event.target.value)}
                      >
                        <option value="">Choisir un projet</option>
                        {board.projects.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field>
                  <Field id="new-ticket-status" label="Colonne">
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        id="new-ticket-status"
                        value={status}
                        onChange={(event) =>
                          setStatus(event.target.value as Status)
                        }
                      >
                        {COLUMNS.map((column) => (
                          <option key={column.id} value={column.id}>
                            {column.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field>
                  <Field id="new-ticket-assignee" label="Qui s'en occupe">
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        id="new-ticket-assignee"
                        value={assignee}
                        onChange={(event) => setAssignee(event.target.value)}
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
                  </Field>
                  <Field id="new-ticket-description" label="Description">
                    <Textarea
                      id="new-ticket-description"
                      autoresize
                      minH="96px"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </Field>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  type="submit"
                  bg="app.accent"
                  color="app.accentFg"
                  disabled={!ready}
                  loading={create.isPending}
                >
                  Créer
                </Button>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
