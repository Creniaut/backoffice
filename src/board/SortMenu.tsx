import { Box, Button, Menu, Portal, Text } from "@chakra-ui/react";
import { LuChevronDown } from "react-icons/lu";
import { menuContentStyle, menuItemStyle, menuTriggerStyle } from "./menuStyle";
import type { SortMode } from "./sort";

const OPTIONS: ReadonlyArray<{ id: SortMode; label: string }> = [
  { id: "manual", label: "Manuel" },
  { id: "priority", label: "Priorité" },
  { id: "difficulty", label: "Difficulté" },
];

export function SortMenu({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}) {
  const current = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button {...menuTriggerStyle(false)}>
          <Text as="span" color="app.muted" fontWeight="400">
            Tri :
          </Text>{" "}
          {current.label}
          <LuChevronDown aria-hidden="true" />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content {...menuContentStyle} minW="180px">
            <Menu.RadioItemGroup
              value={value}
              onValueChange={({ value: next }) => {
                const option = OPTIONS.find((o) => o.id === next);
                if (option && option.id !== value) onChange(option.id);
              }}
            >
              {OPTIONS.map((option) => (
                <Menu.RadioItem
                  key={option.id}
                  {...menuItemStyle}
                  value={option.id}
                >
                  <Box
                    aria-hidden="true"
                    w="16px"
                    h="16px"
                    flex="none"
                    display="grid"
                    placeItems="center"
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor="app.line"
                    _groupChecked={{ borderColor: "app.accent" }}
                  >
                    <Menu.ItemIndicator>
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg="app.accent"
                      />
                    </Menu.ItemIndicator>
                  </Box>
                  {option.label}
                </Menu.RadioItem>
              ))}
            </Menu.RadioItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
