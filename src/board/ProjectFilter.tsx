import { Box, SegmentGroup, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import type { Project, Ticket } from "./types";

const ALL = "all";

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
  const options = [
    { value: ALL, label: "Tous les projets", count: tickets.length },
    ...projects.map((project) => ({
      value: project.slug,
      label: project.name,
      color: project.color,
      count: tickets.filter((t) => t.projectSlug === project.slug).length,
    })),
  ];

  return (
    <Box overflowX="auto" maxW="full" minW="0">
      <SegmentGroup.Root
        size="sm"
        aria-label="Filtrer par projet"
        value={current ?? ALL}
        onValueChange={({ value }) =>
          navigate(!value || value === ALL ? "/todo" : `/todo/${value}`)
        }
      >
        <SegmentGroup.Indicator />
        {options.map((option) => (
          <SegmentGroup.Item key={option.value} value={option.value} px="3">
            <SegmentGroup.ItemText
              display="inline-flex"
              alignItems="center"
              gap="1.5"
            >
              {"color" in option && (
                <Box
                  aria-hidden="true"
                  w="7px"
                  h="7px"
                  borderRadius="2px"
                  style={{ background: option.color }}
                />
              )}
              {option.label}{" "}
              <Text as="span" opacity="0.65" fontVariantNumeric="tabular-nums">
                {option.count}
              </Text>
            </SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
    </Box>
  );
}
