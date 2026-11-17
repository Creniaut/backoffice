import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineSlotRecipe,
} from "@chakra-ui/react";
import { segmentGroupAnatomy } from "@chakra-ui/react/anatomy";

const tone = (light: string, dark: string) => ({
  value: { _light: light, _dark: dark },
});

const config = defineConfig({
  globalCss: {
    "html, body, #root": { height: "100%" },
    body: {
      bg: "app.bg",
      color: "app.ink",
      fontFamily: "body",
      fontSize: "14px",
      lineHeight: "1.45",
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: {
          value: '"Bricolage Grotesque", "Segoe UI", system-ui, sans-serif',
        },
        body: { value: '"Instrument Sans", "Segoe UI", system-ui, sans-serif' },
      },
    },
    semanticTokens: {
      colors: {
        app: {
          bg: tone("oklch(0.975 0.004 250)", "oklch(0.2 0.012 255)"),
          lane: tone("oklch(0.948 0.007 250)", "oklch(0.235 0.013 255)"),
          card: tone("oklch(1 0 0)", "oklch(0.285 0.014 255)"),
          ink: tone("oklch(0.25 0.02 255)", "oklch(0.94 0.008 250)"),
          muted: tone("oklch(0.53 0.015 255)", "oklch(0.7 0.015 255)"),
          line: tone("oklch(0.9 0.008 250)", "oklch(0.34 0.014 255)"),
          accent: tone("oklch(0.43 0.11 252)", "oklch(0.74 0.1 252)"),
          accentSoft: tone("oklch(0.93 0.03 252)", "oklch(0.32 0.04 252)"),
          accentFg: tone("oklch(0.975 0.004 250)", "oklch(0.2 0.012 255)"),
          claude: tone("oklch(0.6 0.13 45)", "oklch(0.72 0.12 45)"),
        },
        status: {
          idea: { value: "oklch(0.7 0.01 255)" },
          todo: { value: "oklch(0.6 0.12 252)" },
          doing: { value: "oklch(0.72 0.14 75)" },
          done: { value: "oklch(0.62 0.12 150)" },
        },
        priority: {
          high: { value: "oklch(0.6 0.19 25)" },
          medium: { value: "oklch(0.72 0.14 75)" },
          low: { value: "oklch(0.7 0.01 255)" },
        },
      },
      shadows: {
        card: tone(
          "0 1px 2px oklch(0.25 0.02 255 / 0.07), 0 2px 8px oklch(0.25 0.02 255 / 0.05)",
          "0 1px 2px oklch(0 0 0 / 0.3)",
        ),
      },
    },
    slotRecipes: {
      segmentGroup: defineSlotRecipe({
        slots: segmentGroupAnatomy.keys(),
        base: {
          root: {
            bg: "app.lane",
            boxShadow: "none",
            "--segment-indicator-bg": "colors.app.card",
            "--segment-indicator-shadow": "shadows.card",
          },
          item: {
            color: "app.muted",
            fontWeight: "500",
            whiteSpace: "nowrap",
            _checked: { color: "app.ink" },
            _before: { bg: "app.line" },
          },
        },
      }),
    },
  },
});

export const system = createSystem(defaultConfig, config);
