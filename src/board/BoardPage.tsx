import {
  Button,
  Center,
  Flex,
  Heading,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink, useParams, useSearchParams } from "react-router";
import { BoardColumns } from "./BoardColumns";
import { ticketsForProject } from "./format";
import { ProjectFilter } from "./ProjectFilter";
import { useBoard } from "./queries";

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

export function BoardPage() {
  const { project } = useParams();
  const [, setSearchParams] = useSearchParams();
  const board = useBoard();
  const projectSlug = project ?? null;

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
      </Flex>
      <BoardColumns
        board={data}
        tickets={visible}
        onOpen={(id) => setSearchParams({ ticket: String(id) })}
      />
    </>
  );
}
