import { SegmentGroup } from "@chakra-ui/react";

export function LevelPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <SegmentGroup.Root
      size="sm"
      w="full"
      minW="0"
      aria-label={label}
      value={value}
      onValueChange={({ value: next }) => {
        const option = options.find((o) => o.id === next);
        if (option && option.id !== value) onChange(option.id);
      }}
    >
      <SegmentGroup.Indicator />
      {options.map((option) => (
        <SegmentGroup.Item key={option.id} value={option.id} flex="1" px="2">
          <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}
