import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuPlus, LuSettings2 } from "react-icons/lu";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { toaster } from "../components/toaster";
import { BoardColumns } from "./BoardColumns";
import {
  hasFilters,
  matchesFilters,
  NO_FILTERS,
  readFilters,
  writeFilters,
  type BoardFilters,
} from "./filters";
import { FilterMenus } from "./FilterMenus";
import { ticketsForProject } from "./format";
import { ProjectFilter } from "./ProjectFilter";
import { ProjectsDialog } from "./ProjectsDialog";
import { activeProjects, activeTickets, archivedProjects } from "./projects";
import { useBoard } from "./queries";
import { readSortMode, writeSortMode, type SortMode } from "./sort";
import { SortMenu } from "./SortMenu";
import { useBlockFileNavigation } from "./useBlockFileNavigation";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketDrawer } from "./TicketDrawer";
import type { Status } from "./types";

export function BoardPage() {
  const { project } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const board = useBoard();
  useBlockFileNavigation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState<Status | null>(null);
  const [managing, setManaging] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>(readSortMode);
  const [filters, setFilters] = useState<BoardFilters>(readFilters);
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

  const archivedCurrent =
    projectSlug !== null &&
    (board.data
      ? archivedProjects(board.data.projects).some(
          (p) => p.slug === projectSlug,
        )
      : false);
  useEffect(() => {
    if (!archivedCurrent) return;
    navigate(
      { pathname: "/todo", search: searchParams.toString() },
      {
        replace: true,
      },
    );
  });

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

  if (board.isLoadingError) {
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
  const shownProjects = activeProjects(data.projects);
  const shownTickets = activeTickets(data.tickets, data.projects);

  const viewSlug = archivedCurrent ? null : projectSlug;

  if (viewSlug && !data.projects.some((p) => p.slug === viewSlug)) {
    return (
      <Center flex="1">
        <Stack align="center" gap="2">
          <Text fontFamily="heading" fontWeight="700" fontSize="xl">
            Projet inconnu
          </Text>
          <Text color="app.muted">{`Aucun projet ne s'appelle « ${viewSlug} ».`}</Text>
          <Link asChild color="app.accent" fontWeight="500">
            <RouterLink to="/todo">Voir tous les projets</RouterLink>
          </Link>
        </Stack>
      </Center>
    );
  }

  const inProject = ticketsForProject(shownTickets, viewSlug);
  const visible = inProject.filter((t) => matchesFilters(t, filters));
  const filtered = hasFilters(filters);
  const changeFilters = (next: BoardFilters) => {
    setFilters(next);
    writeFilters(next);
  };

  return (
    <>
      <Flex
        wrap="wrap"
        align="center"
        rowGap="3"
        columnGap="4"
        px="5"
        pt="4"
        pb="3.5"
      >
        <Heading as="h1" srOnly>
          Tableau
        </Heading>
        <Flex align="center" gap="1" minW="0" maxW="full">
          <ProjectFilter
            projects={shownProjects}
            tickets={shownTickets}
            current={viewSlug}
          />
          <Box
            aria-hidden="true"
            flexShrink="0"
            w="1px"
            h="20px"
            mx="1"
            bg="app.line"
          />
          <Button
            size="sm"
            variant="ghost"
            flexShrink="0"
            aria-label="Gérer les projets"
            title="Créer, renommer ou archiver un projet"
            color="app.muted"
            fontWeight="400"
            _hover={{ color: "app.ink", bg: "app.lane" }}
            onClick={() => setManaging(true)}
          >
            <LuSettings2 aria-hidden="true" />
            <Box as="span" hideBelow="md">
              Gérer les projets
            </Box>
          </Button>
        </Flex>
        <Flex wrap="wrap" align="center" gap="2">
          <FilterMenus
            tickets={inProject}
            members={data.members}
            filters={filters}
            onChange={changeFilters}
          />
          <Box aria-hidden="true" w="1px" h="20px" mx="1" bg="app.line" />
          <SortMenu
            value={sortMode}
            onChange={(mode) => {
              setSortMode(mode);
              writeSortMode(mode);
            }}
          />
          {filtered && (
            <Button
              size="sm"
              variant="ghost"
              color="app.muted"
              fontWeight="400"
              _hover={{ color: "app.ink", bg: "app.lane" }}
              onClick={() => changeFilters(NO_FILTERS)}
            >
              Effacer les filtres
            </Button>
          )}
        </Flex>
        <Button
          ms="auto"
          size="sm"
          aria-label="Nouveau ticket"
          bg="app.accent"
          color="app.accentFg"
          fontWeight="600"
          _hover={{ opacity: 0.9 }}
          onClick={() => setCreating("todo")}
        >
          <LuPlus aria-hidden="true" />
          <Box as="span" hideBelow="md">
            Nouveau ticket
          </Box>
        </Button>
      </Flex>
      <Flex flex="1" minH="0">
        <BoardColumns
          board={data}
          tickets={visible}
          selectedId={ticket?.id ?? null}
          sortMode={sortMode}
          filtered={filtered}
          onOpen={(id) => setSearchParams({ ticket: String(id) })}
          onAdd={setCreating}
        />
        <TicketDrawer ticket={ticket} board={data} onClose={closeTicket} />
      </Flex>
      {managing && (
        <ProjectsDialog
          board={data}
          onClose={() => setManaging(false)}
          onCreated={(slug) => {
            setManaging(false);
            navigate(`/todo/${slug}`);
          }}
        />
      )}
      {creating && (
        <NewTicketDialog
          board={data}
          status={creating}
          projectSlug={viewSlug}
          onClose={() => setCreating(null)}
          onCreated={(id) => {
            setCreating(null);
            setSearchParams({ ticket: String(id) });
          }}
        />
      )}
    </>
  );
}
