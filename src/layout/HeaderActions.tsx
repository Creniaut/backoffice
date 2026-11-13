import { Button, Flex } from "@chakra-ui/react";
import { signOut } from "../auth/useSession";
import { MemberAvatar } from "../board/MemberAvatar";
import { useBoard } from "../board/queries";

export function HeaderActions() {
  const members = useBoard().data?.members ?? [];
  return (
    <>
      <Flex
        aria-label="Membres"
        css={{ "& > * + *": { marginInlineStart: "-6px" } }}
      >
        {members.map((member) => (
          <MemberAvatar key={member.email} member={member} />
        ))}
      </Flex>
      <Button size="xs" variant="ghost" color="app.muted" onClick={signOut}>
        Se déconnecter
      </Button>
    </>
  );
}
