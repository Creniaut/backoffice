import { Link, Text } from "@chakra-ui/react";
import { linkify } from "./format";

export function LinkifiedText({ text }: { text: string }) {
  return (
    <Text whiteSpace="pre-wrap" overflowWrap="anywhere" maxW="65ch">
      {linkify(text).map((part, index) =>
        part.type === "link" ? (
          <Link
            key={index}
            href={part.value}
            target="_blank"
            rel="noreferrer"
            color="app.accent"
            textDecoration="underline"
          >
            {part.value}
          </Link>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </Text>
  );
}
