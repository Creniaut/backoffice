import { Flex, SegmentGroup, Text } from "@chakra-ui/react";
import type { SortMode } from "./sort";

const OPTIONS: ReadonlyArray<{ id: SortMode; label: string }> = [
  { id: "manual", label: "Manuel" },
  { id: "priority", label: "Priorité" },
];

export function SortToggle({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}) {
  return (
    <Flex align="center" gap="2">
      <Text color="app.muted" aria-hidden="true">
        Trier
      </Text>
      <SegmentGroup.Root
        size="sm"
        aria-label="Trier"
        value={value}
        onValueChange={({ value: next }) => {
          const option = OPTIONS.find((o) => o.id === next);
          if (option && option.id !== value) onChange(option.id);
        }}
      >
        <SegmentGroup.Indicator />
        {OPTIONS.map((option) => (
          <SegmentGroup.Item key={option.id} value={option.id} px="3">
            <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
    </Flex>
  );
}
