import {
  Box,
  Button,
  chakra,
  Dialog,
  Flex,
  HStack,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { ColorSwatches } from "./ColorSwatches";
import {
  activeProjects,
  archivedProjects,
  CREATED_NOT_LOADED,
  defaultColor,
  NAME_WITHOUT_SLUG,
  PROJECT_EXISTS,
  slugify,
} from "./projects";
import { useCreateProject, useUpdateProject } from "./queries";
import type { Board, Project } from "./types";

const Label = chakra("label", {
  base: { fontSize: "13px", fontWeight: "500", color: "app.muted" },
});

const List = chakra("ul", {
  base: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "1",
  },
});

function ticketCount(count: number): string {
  return count > 1 ? `${count} tickets` : `${count} ticket`;
}

function Dot({ color }: { color: string }) {
  return (
    <Box
      aria-hidden="true"
      flexShrink="0"
      w="9px"
      h="9px"
      borderRadius="3px"
      style={{ background: color }}
    />
  );
}

function NewProjectForm({
  projects,
  onCreated,
}: {
  projects: Project[];
  onCreated: (slug: string) => void;
}) {
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => defaultColor(projects));
  const slug = slugify(name);
  const taken = slug !== "" && projects.some((p) => p.slug === slug);
  const unnamed = slug === "" && name.trim() !== "";
  const error = taken
    ? PROJECT_EXISTS
    : unnamed
      ? NAME_WITHOUT_SLUG
      : create.isError
        ? create.error.message
        : create.data === false
          ? CREATED_NOT_LOADED
          : null;
  const ready = slug !== "" && !taken;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        create.mutate(
          { slug, name: name.trim(), color },
          {
            onSuccess: (shown) => {
              if (shown) onCreated(slug);
            },
          },
        );
      }}
    >
      <Stack gap="2.5">
        <Text fontFamily="heading" fontWeight="600" fontSize="15px">
          Nouveau projet
        </Text>
        <Stack gap="1">
          <Label htmlFor="new-project-name">Nom</Label>
          <Input
            id="new-project-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              create.reset();
            }}
          />
          {slug !== "" && (
            <Text fontSize="12px" color="app.muted">
              {`Adresse : /todo/${slug}`}
            </Text>
          )}
          {error && (
            <Text fontSize="12px" color="fg.error" role="alert">
              {error}
            </Text>
          )}
        </Stack>
        <Stack gap="1">
          <Label as="span">Couleur</Label>
          <ColorSwatches value={color} onChange={setColor} label="Couleur" />
        </Stack>
        <Button
          type="submit"
          alignSelf="flex-end"
          size="sm"
          bg="app.accent"
          color="app.accentFg"
          disabled={!ready}
          loading={create.isPending}
        >
          Créer
        </Button>
      </Stack>
    </form>
  );
}

function ProjectRow({
  project,
  count,
  archived,
}: {
  project: Project;
  count: number;
  archived: boolean;
}) {
  const update = useUpdateProject();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const inputId = `project-name-${project.slug}`;

  if (editing) {
    return (
      <Box as="li" aria-label={project.name} py="1.5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim() === "") return;
            update.mutate(
              { slug: project.slug, patch: { name: name.trim(), color } },
              { onSuccess: () => setEditing(false) },
            );
          }}
        >
          <Stack gap="2">
            <Label htmlFor={inputId} srOnly>
              Nom du projet
            </Label>
            <Input
              id={inputId}
              size="sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <ColorSwatches
              value={color}
              onChange={setColor}
              label={`Couleur de ${project.name}`}
            />
            <HStack justify="flex-end" gap="2">
              <Button
                size="xs"
                variant="outline"
                type="button"
                onClick={() => {
                  setName(project.name);
                  setColor(project.color);
                  setEditing(false);
                }}
              >
                Annuler
              </Button>
              <Button
                size="xs"
                type="submit"
                bg="app.accent"
                color="app.accentFg"
                disabled={name.trim() === ""}
                loading={update.isPending}
              >
                Enregistrer
              </Button>
            </HStack>
          </Stack>
        </form>
      </Box>
    );
  }

  return (
    <Box as="li" aria-label={project.name} py="1.5">
      <Flex align="center" gap="2.5">
        <Dot color={project.color} />
        <Text flex="1" minW="0" truncate fontWeight="500">
          {project.name}
        </Text>
        <Text
          fontSize="12px"
          color="app.muted"
          fontVariantNumeric="tabular-nums"
        >
          {ticketCount(count)}
        </Text>
        {archived ? (
          <Button
            size="xs"
            variant="ghost"
            color="app.muted"
            _hover={{ color: "app.ink", bg: "app.lane" }}
            loading={update.isPending}
            onClick={() =>
              update.mutate({ slug: project.slug, patch: { archivedAt: null } })
            }
          >
            Restaurer
          </Button>
        ) : (
          <>
            <Button
              size="xs"
              variant="ghost"
              color="app.muted"
              _hover={{ color: "app.ink", bg: "app.lane" }}
              onClick={() => {
                setName(project.name);
                setColor(project.color);
                setEditing(true);
              }}
            >
              Modifier
            </Button>
            <Button
              size="xs"
              variant="ghost"
              color="app.muted"
              _hover={{ color: "app.ink", bg: "app.lane" }}
              loading={update.isPending}
              onClick={() =>
                update.mutate({
                  slug: project.slug,
                  patch: { archivedAt: new Date().toISOString() },
                })
              }
            >
              Archiver
            </Button>
          </>
        )}
      </Flex>
    </Box>
  );
}

export function ProjectsDialog({
  board,
  onClose,
  onCreated,
}: {
  board: Board;
  onClose: () => void;
  onCreated: (slug: string) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const active = activeProjects(board.projects);
  const archived = archivedProjects(board.projects);
  const countOf = (slug: string) =>
    board.tickets.filter((t) => t.projectSlug === slug).length;

  return (
    <Dialog.Root
      open
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      initialFocusEl={() => document.getElementById("new-project-name")}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="app.card" color="app.ink">
            <Dialog.Header>
              <Dialog.Title fontFamily="heading">Projets</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                <NewProjectForm
                  projects={board.projects}
                  onCreated={onCreated}
                />
                <Box h="1px" bg="app.line" />
                <List aria-label="Projets actifs">
                  {active.map((project) => (
                    <ProjectRow
                      key={project.slug}
                      project={project}
                      count={countOf(project.slug)}
                      archived={false}
                    />
                  ))}
                </List>
                {archived.length > 0 && (
                  <Stack gap="1">
                    <Button
                      size="xs"
                      variant="ghost"
                      color="app.muted"
                      alignSelf="flex-start"
                      aria-expanded={showArchived}
                      onClick={() => setShowArchived((value) => !value)}
                    >
                      {`Archivés (${archived.length})`}
                    </Button>
                    {showArchived && (
                      <List aria-label="Projets archivés">
                        {archived.map((project) => (
                          <ProjectRow
                            key={project.slug}
                            project={project}
                            count={countOf(project.slug)}
                            archived
                          />
                        ))}
                      </List>
                    )}
                  </Stack>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" type="button">
                  Fermer
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
