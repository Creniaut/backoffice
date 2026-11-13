import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { actorLabel, eventLabel, formatRelative } from "./format";
import { useTicketEvents } from "./queries";
import type { Member } from "./types";

export function TicketHistory({
  ticketId,
  members,
}: {
  ticketId: number;
  members: Member[];
}) {
  const events = useTicketEvents(ticketId);

  if (events.isPending) return <Spinner size="sm" color="app.muted" />;
  if (events.isError) {
    return <Text color="app.muted">Historique indisponible.</Text>;
  }
  if (events.data.length === 0) {
    return <Text color="app.muted">Aucun événement.</Text>;
  }

  const now = new Date();
  return (
    <Box
      as="ul"
      listStyleType="none"
      display="flex"
      flexDirection="column"
      gap="2"
    >
      {events.data.map((event) => (
        <Flex as="li" key={event.id} gap="2" align="baseline" fontSize="13px">
          <Text
            as="span"
            fontWeight={event.actor === "claude" ? "500" : "600"}
            color={event.actor === "claude" ? "app.claude" : "app.ink"}
          >
            {actorLabel(event.actor, members)}
          </Text>
          <Text as="span">{eventLabel(event, members)}</Text>
          <Text
            as="span"
            ms="auto"
            color="app.muted"
            fontSize="12px"
            whiteSpace="nowrap"
          >
            {formatRelative(event.at, now)}
          </Text>
        </Flex>
      ))}
    </Box>
  );
}
