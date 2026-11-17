export const menuTriggerStyle = (active: boolean) =>
  ({
    size: "sm",
    variant: "outline",
    h: "32px",
    ps: "3",
    pe: "2.5",
    gap: "1.5",
    borderRadius: "8px",
    fontWeight: "500",
    bg: active ? "app.accentSoft" : "app.card",
    borderColor: active ? "app.accent" : "app.line",
    color: active ? "app.accent" : "app.ink",
    _hover: { borderColor: active ? "app.accent" : "app.muted" },
    _expanded: { borderColor: active ? "app.accent" : "app.muted" },
  }) as const;

export const menuContentStyle = {
  p: "1.5",
  bg: "app.card",
  borderWidth: "1px",
  borderColor: "app.line",
  borderRadius: "10px",
} as const;

export const menuItemStyle = {
  className: "group",
  gap: "2.5",
  px: "2",
  py: "1.5",
  borderRadius: "6px",
  cursor: "pointer",
  color: "app.ink",
  _highlighted: { bg: "app.lane" },
} as const;
