import { Box } from "@chakra-ui/react";
import type { Member } from "./types";

const PALETTE = [
  { bg: "oklch(0.86 0.06 252)", fg: "oklch(0.3 0.08 252)" },
  { bg: "oklch(0.87 0.07 150)", fg: "oklch(0.3 0.07 150)" },
  { bg: "oklch(0.88 0.07 75)", fg: "oklch(0.35 0.08 75)" },
  { bg: "oklch(0.87 0.06 330)", fg: "oklch(0.33 0.08 330)" },
];

function tone(email: string) {
  const sum = [...email].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

export function MemberAvatar({ member }: { member: Member | null }) {
  const colors = member ? tone(member.email) : null;
  return (
    <Box
      as="span"
      title={member?.name ?? "Personne"}
      w="24px"
      h="24px"
      flex="none"
      borderRadius="full"
      display="inline-grid"
      placeItems="center"
      fontSize="10px"
      fontWeight="600"
      letterSpacing="0.02em"
      bg={colors?.bg ?? "transparent"}
      color={colors?.fg ?? "app.muted"}
      borderWidth={member ? "2px" : "1.5px"}
      borderStyle={member ? "solid" : "dashed"}
      borderColor={member ? "app.card" : "app.line"}
    >
      {member?.initials ?? "–"}
    </Box>
  );
}
