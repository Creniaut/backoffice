import { chakra, HStack } from "@chakra-ui/react";
import { PROJECT_COLORS } from "./projects";

const Swatch = chakra("button", {
  base: {
    w: "22px",
    h: "22px",
    borderRadius: "6px",
    cursor: "pointer",
    outlineOffset: "2px",
    borderWidth: "2px",
    borderColor: "transparent",
    _checked: { borderColor: "app.ink" },
    _focusVisible: { outline: "2px solid", outlineColor: "app.accent" },
  },
});

export function ColorSwatches({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  return (
    <HStack role="radiogroup" aria-label={label} gap="1.5" wrap="wrap">
      {PROJECT_COLORS.map((color, index) => (
        <Swatch
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          data-checked={color === value ? "" : undefined}
          aria-label={`Couleur ${index + 1}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </HStack>
  );
}
