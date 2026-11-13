import { Box, Flex, Link, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { NavLink } from "react-router";

export function Brand() {
  return (
    <Flex align="center" gap="2.5">
      <Box
        aria-hidden="true"
        w="26px"
        h="26px"
        borderRadius="7px"
        bg="app.ink"
        color="app.bg"
        display="grid"
        placeItems="center"
        fontFamily="heading"
        fontWeight="700"
        fontSize="14px"
      >
        C
      </Box>
      <Text fontFamily="heading" fontWeight="600" fontSize="15px">
        Creniaut
      </Text>
      <Text color="app.muted">back-office</Text>
    </Flex>
  );
}

export function Shell({
  actions,
  children,
}: {
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Flex direction="column" h="100%">
      <Flex
        as="header"
        align="center"
        gap="6"
        px="5"
        py="3"
        borderBottomWidth="1px"
        borderColor="app.line"
      >
        <Brand />
        <Flex as="nav" aria-label="Sections" gap="1" hideBelow="md">
          <Link
            asChild
            px="2.5"
            py="1.5"
            borderRadius="md"
            fontWeight="500"
            color="app.muted"
            _currentPage={{ color: "app.ink", bg: "app.lane" }}
          >
            <NavLink to="/todo">Tableau</NavLink>
          </Link>
        </Flex>
        <Flex ms="auto" align="center" gap="3">
          {actions}
        </Flex>
      </Flex>
      <Flex direction="column" flex="1" minH="0">
        {children}
      </Flex>
    </Flex>
  );
}
