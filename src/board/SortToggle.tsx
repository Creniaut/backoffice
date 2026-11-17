import { SegmentGroup } from "@chakra-ui/react";
import type { SortMode } from "./sort";

const OPTIONS: ReadonlyArray<{ id: SortMode; label: string }> = [
  { id: "manual", label: "Manuel" },
  { id: "priority", label: "Priorité" },
  { id: "difficulty", label: "Difficulté" },
];

export function SortToggle({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}) {
  return (
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
  );
}
