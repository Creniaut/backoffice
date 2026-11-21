import { Box, Button, Menu, Portal, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import {
  NONE,
  type BoardFilters,
  type DifficultyChoice,
  type PriorityChoice,
} from "./filters";
import { menuContentStyle, menuItemStyle, menuTriggerStyle } from "./menuStyle";
import { MemberAvatar } from "./MemberAvatar";
import { DifficultyTag, PriorityTag } from "./TicketCard";
import { DIFFICULTIES, PRIORITIES, type Member, type Ticket } from "./types";

interface LevelOption<T extends string> {
  id: T;
  label: ReactNode;
  count: number;
}

function LevelMenu<T extends string>({
  label,
  options,
  checked,
  onChange,
}: {
  label: string;
  options: LevelOption<T>[];
  checked: T[];
  onChange: (next: T[]) => void;
}) {
  const active = checked.length > 0;
  const toggle = (id: T, on: boolean) =>
    onChange(
      options
        .map((option) => option.id)
        .filter((option) => (option === id ? on : checked.includes(option))),
    );

  return (
    <Menu.Root closeOnSelect={false}>
      <Menu.Trigger asChild>
        <Button
          {...menuTriggerStyle(active)}
          aria-label={
            active
              ? `${label}, ${checked.length} ${checked.length > 1 ? "cochés" : "coché"}`
              : undefined
          }
        >
          {label}
          {active && (
            <Box
              as="span"
              minW="18px"
              h="18px"
              px="1"
              borderRadius="full"
              bg="app.accent"
              color="app.card"
              fontSize="11px"
              fontWeight="600"
              display="inline-grid"
              placeItems="center"
              fontVariantNumeric="tabular-nums"
            >
              {checked.length}
            </Box>
          )}
          <LuChevronDown aria-hidden="true" />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content {...menuContentStyle} minW="220px">
            {options.map((option) => (
              <Menu.CheckboxItem
                key={option.id}
                {...menuItemStyle}
                value={option.id}
                checked={checked.includes(option.id)}
                onCheckedChange={(on) => toggle(option.id, on)}
              >
                <Box
                  aria-hidden="true"
                  w="16px"
                  h="16px"
                  flex="none"
                  display="grid"
                  placeItems="center"
                  borderRadius="4px"
                  borderWidth="1.5px"
                  borderColor="app.line"
                  color="app.card"
                  fontSize="11px"
                  _groupChecked={{
                    bg: "app.accent",
                    borderColor: "app.accent",
                  }}
                >
                  <Menu.ItemIndicator>
                    <LuCheck strokeWidth="3" />
                  </Menu.ItemIndicator>
                </Box>
                {option.label}
                <Text
                  as="span"
                  ms="auto"
                  ps="3"
                  color="app.muted"
                  fontSize="12px"
                  fontVariantNumeric="tabular-nums"
                >
                  {option.count}
                </Text>
              </Menu.CheckboxItem>
            ))}
            <Menu.Separator borderColor="app.line" />
            <Menu.Item
              {...menuItemStyle}
              value="all"
              color="app.accent"
              fontWeight="500"
              onClick={() => onChange([])}
            >
              Tout afficher
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

function MemberOption({ member }: { member: Member | null }) {
  return (
    <Box as="span" display="inline-flex" alignItems="center" gap="2">
      <MemberAvatar member={member} />
      {member?.name ?? "Non assigné"}
    </Box>
  );
}

export function FilterMenus({
  tickets,
  members,
  filters,
  onChange,
}: {
  tickets: Ticket[];
  members: Member[];
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
}) {
  const assigneeOptions: LevelOption<string>[] = [
    ...members.map((member) => ({
      id: member.email,
      label: <MemberOption member={member} />,
      count: tickets.filter((t) => t.assigneeEmail === member.email).length,
    })),
    {
      id: NONE,
      label: <MemberOption member={null} />,
      count: tickets.filter((t) => t.assigneeEmail === null).length,
    },
  ];
  const priorityOptions: LevelOption<PriorityChoice>[] = [
    ...PRIORITIES.map((p) => ({
      id: p.id,
      label: <PriorityTag priority={p.id} />,
      count: tickets.filter((t) => t.priority === p.id).length,
    })),
    {
      id: NONE,
      label: "Sans priorité",
      count: tickets.filter((t) => t.priority === null).length,
    },
  ];
  const difficultyOptions: LevelOption<DifficultyChoice>[] = [
    ...DIFFICULTIES.map((d) => ({
      id: d.id,
      label: <DifficultyTag difficulty={d.id} />,
      count: tickets.filter((t) => t.difficulty === d.id).length,
    })),
    {
      id: NONE,
      label: "Sans difficulté",
      count: tickets.filter((t) => t.difficulty === null).length,
    },
  ];

  return (
    <>
      <LevelMenu
        label="Priorité"
        options={priorityOptions}
        checked={filters.priorities}
        onChange={(priorities) => onChange({ ...filters, priorities })}
      />
      <LevelMenu
        label="Difficulté"
        options={difficultyOptions}
        checked={filters.difficulties}
        onChange={(difficulties) => onChange({ ...filters, difficulties })}
      />
      <LevelMenu
        label="Personne"
        options={assigneeOptions}
        checked={filters.assignees}
        onChange={(assignees) => onChange({ ...filters, assignees })}
      />
    </>
  );
}
