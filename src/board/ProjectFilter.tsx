import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import type { Project, Ticket } from "./types";

function Chip({
  pressed,
  label,
  count,
  color,
  onClick,
}: {
  pressed: boolean;
  label: string;
  count: number;
  color?: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      borderRadius="full"
      borderWidth="1px"
      fontWeight="500"
      aria-pressed={pressed}
      bg={pressed ? "app.ink" : "app.card"}
      color={pressed ? "app.bg" : "app.ink"}
      borderColor={pressed ? "app.ink" : "app.line"}
      _hover={{ borderColor: "app.muted" }}
      onClick={onClick}
    >
      {color && (
        <Box
          aria-hidden="true"
          w="7px"
          h="7px"
          borderRadius="2px"
          style={{ background: color }}
        />
      )}
      {label}
      <Text as="span" opacity="0.65" fontVariantNumeric="tabular-nums">
        {count}
      </Text>
    </Button>
  );
}

export function ProjectFilter({
  projects,
  tickets,
  current,
}: {
  projects: Project[];
  tickets: Ticket[];
  current: string | null;
}) {
  const navigate = useNavigate();
  return (
    <Flex role="group" aria-label="Filtrer par projet" gap="1.5" wrap="wrap">
      <Chip
        pressed={current === null}
        label="Tous les projets"
        count={tickets.length}
        onClick={() => navigate("/todo")}
      />
      {projects.map((project) => (
        <Chip
          key={project.slug}
          pressed={current === project.slug}
          label={project.name}
          color={project.color}
          count={tickets.filter((t) => t.projectSlug === project.slug).length}
          onClick={() => navigate(`/todo/${project.slug}`)}
        />
      ))}
    </Flex>
  );
}
