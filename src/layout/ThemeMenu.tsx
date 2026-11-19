import { Box, IconButton, Menu, Portal } from "@chakra-ui/react";
import { useTheme } from "next-themes";
import type { IconType } from "react-icons";
import { LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import { menuContentStyle, menuItemStyle } from "../board/menuStyle";

type ThemeChoice = "system" | "light" | "dark";

const OPTIONS: ReadonlyArray<{
  id: ThemeChoice;
  label: string;
  icon: IconType;
}> = [
  { id: "system", label: "Système", icon: LuMonitor },
  { id: "light", label: "Clair", icon: LuSun },
  { id: "dark", label: "Sombre", icon: LuMoon },
];

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const current = OPTIONS.find((o) => o.id === theme) ?? OPTIONS[0];
  const Icon = current.icon;

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          size="xs"
          variant="ghost"
          color="app.muted"
          _hover={{ color: "app.ink", bg: "app.lane" }}
          aria-label={`Thème : ${current.label}`}
        >
          <Icon aria-hidden="true" />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content {...menuContentStyle} minW="160px">
            <Menu.RadioItemGroup
              value={current.id}
              onValueChange={({ value }) => setTheme(value)}
            >
              {OPTIONS.map((option) => (
                <Menu.RadioItem
                  key={option.id}
                  {...menuItemStyle}
                  value={option.id}
                >
                  <Box
                    as={option.icon}
                    aria-hidden="true"
                    flex="none"
                    color="app.muted"
                    _groupChecked={{ color: "app.accent" }}
                  />
                  {option.label}
                  <Menu.ItemIndicator ms="auto" color="app.accent" />
                </Menu.RadioItem>
              ))}
            </Menu.RadioItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
