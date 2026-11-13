import { Button, Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { fetchIsMember } from "../board/api";
import { Brand } from "../layout/Shell";
import { signIn, signOut, useSession } from "./useSession";

function Panel({ children }: { children: ReactNode }) {
  return (
    <Center h="100%" px="4">
      <Stack
        gap="5"
        bg="app.card"
        borderWidth="1px"
        borderColor="app.line"
        borderRadius="xl"
        p="8"
        maxW="sm"
        w="full"
        align="flex-start"
      >
        <Brand />
        {children}
      </Stack>
    </Center>
  );
}

const primary = {
  bg: "app.accent",
  color: "app.accentFg",
  _hover: { opacity: 0.9 },
} as const;

export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const email = session.email;
  const membership = useQuery({
    queryKey: ["member", email],
    queryFn: () => fetchIsMember(email as string),
    enabled: session.status === "signedIn" && email !== null,
  });

  if (
    session.status === "loading" ||
    (session.status === "signedIn" && email !== null && membership.isPending)
  ) {
    return (
      <Center h="100%">
        <Spinner color="app.muted" />
      </Center>
    );
  }

  if (session.status === "signedOut") {
    return (
      <Panel>
        <Text color="app.muted">
          Le tableau de l'organisation, réservé à ses membres.
        </Text>
        <Button {...primary} onClick={signIn}>
          Se connecter avec Google
        </Button>
      </Panel>
    );
  }

  if (membership.isError) {
    return (
      <Panel>
        <Text>Impossible de vérifier l'accès pour le moment.</Text>
        <Button {...primary} onClick={() => void membership.refetch()}>
          Réessayer
        </Button>
      </Panel>
    );
  }

  if (!membership.data) {
    return (
      <Panel>
        <Text fontFamily="heading" fontWeight="700" fontSize="xl">
          Accès réservé
        </Text>
        <Text color="app.muted">
          {`Le compte ${email ?? "inconnu"} n'a pas accès à ce back-office.`}
        </Text>
        <Button variant="outline" onClick={signOut}>
          Se déconnecter
        </Button>
      </Panel>
    );
  }

  return <>{children}</>;
}
