import {
  Button,
  Center,
  IconButton,
  Flex,
  Heading,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { Link as RouterLink, useParams, useSearchParams } from "react-router";
import { toaster } from "../components/toaster";
import { BoardColumns } from "./BoardColumns";
import { ticketsForProject } from "./format";
import { ProjectFilter } from "./ProjectFilter";
import { useBoard } from "./queries";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketDrawer } from "./TicketDrawer";
import { COLUMNS, type Status } from "./types";

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

export function BoardPage() {
  const { project } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const board = useBoard();
  const [creating, setCreating] = useState<Status | null>(null);
  const projectSlug = project ?? null;
  const ticketParam = searchParams.get("ticket");
  const ticketId = ticketParam === null ? null : Number(ticketParam);
  const ticket =
    ticketId === null
      ? null
      : (board.data?.tickets.find((t) => t.id === ticketId) ?? null);

  const closeTicket = () =>
    setSearchParams(
      (params) => {
        params.delete("ticket");
        return params;
      },
      { replace: true },
    );

  const missingTicket = ticketId !== null && board.isSuccess && ticket === null;
  useEffect(() => {
    if (!missingTicket) return;
    closeTicket();
    toaster.create({ type: "error", title: "Ticket introuvable" });
  });

  if (board.isPending) {
    return (
      <Center flex="1">
        <Spinner color="app.muted" />
      </Center>
    );
  }

  if (board.isError) {
    return (
      <Center flex="1">
        <Stack align="center" gap="3">
          <Text>Le tableau n'a pas pu être chargé.</Text>
          <Button variant="outline" onClick={() => void board.refetch()}>
            Réessayer
          </Button>
        </Stack>
      </Center>
    );
  }

  const data = board.data;

  if (projectSlug && !data.projects.some((p) => p.slug === projectSlug)) {
    return (
      <Center flex="1">
        <Stack align="center" gap="2">
          <Text fontFamily="heading" fontWeight="700" fontSize="xl">
            Projet inconnu
          </Text>
          <Text color="app.muted">{`Aucun projet ne s'appelle « ${projectSlug} ».`}</Text>
          <Link asChild color="app.accent" fontWeight="500">
            <RouterLink to="/todo">Voir tous les projets</RouterLink>
          </Link>
        </Stack>
      </Center>
    );
  }

  const visible = ticketsForProject(data.tickets, projectSlug);
  const doing = visible.filter((t) => t.status === "doing").length;

  return (
    <>
      <Flex wrap="wrap" align="end" gap="3 6" px="5" pt="5" pb="3.5">
        <Stack gap="1">
          <Heading as="h1" fontSize="26px" fontWeight="700" lineHeight="1.1">
            Tableau
          </Heading>
          <Text color="app.muted" fontVariantNumeric="tabular-nums">
            {`${plural(visible.length, "ticket")}, ${doing} en cours`}
          </Text>
        </Stack>
        <ProjectFilter
          projects={data.projects}
          tickets={data.tickets}
          current={projectSlug}
        />
        <Button
          ms="auto"
          bg="app.accent"
          color="app.accentFg"
          fontWeight="600"
          _hover={{ opacity: 0.9 }}
          onClick={() => setCreating("todo")}
        >
          Nouveau ticket
        </Button>
      </Flex>
      <BoardColumns
        board={data}
        tickets={visible}
        onOpen={(id) => setSearchParams({ ticket: String(id) })}
        laneAction={(status) => (
          <IconButton
            aria-label={`Ajouter dans ${COLUMNS.find((c) => c.id === status)?.label}`}
            size="xs"
            variant="ghost"
            color="app.muted"
            onClick={() => setCreating(status)}
          >
            <LuPlus />
          </IconButton>
        )}
      />
      {creating && (
        <NewTicketDialog
          board={data}
          status={creating}
          projectSlug={projectSlug}
          onClose={() => setCreating(null)}
          onCreated={(id) => {
            setCreating(null);
            setSearchParams({ ticket: String(id) });
          }}
        />
      )}
      <TicketDrawer ticket={ticket} board={data} onClose={closeTicket} />
    </>
  );
}
