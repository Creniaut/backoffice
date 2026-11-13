import {
  Box,
  Button,
  Dialog,
  Flex,
  Grid,
  Image,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { LuImagePlus } from "react-icons/lu";
import { IMAGE_TYPES } from "./images";
import { useDeleteImage, useTicketImages } from "./queries";
import type { TicketImage } from "./types";
import { useAddImages } from "./useAddImages";

export function TicketImages({ ticketId }: { ticketId: number }) {
  const images = useTicketImages(ticketId);
  const addImages = useAddImages(ticketId);
  const remove = useDeleteImage(ticketId);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<{
    image: TicketImage;
    index: number;
  } | null>(null);

  return (
    <Flex direction="column" gap="2">
      {images.isPending && <Spinner size="sm" color="app.muted" />}
      {images.data && images.data.length > 0 && (
        <Grid templateColumns="repeat(auto-fill, minmax(84px, 1fr))" gap="2">
          {images.data.map((image, index) => (
            <Box
              as="button"
              key={image.id}
              aria-label={`Agrandir l'image ${index + 1}`}
              onClick={() => setOpen({ image, index })}
              borderRadius="md"
              overflow="hidden"
              borderWidth="1px"
              borderColor="app.line"
              aspectRatio="1"
              cursor="zoom-in"
            >
              <Image
                src={image.url}
                alt=""
                w="100%"
                h="100%"
                objectFit="cover"
              />
            </Box>
          ))}
        </Grid>
      )}
      <Flex align="center" gap="3" wrap="wrap">
        <Button
          size="xs"
          variant="outline"
          onClick={() => input.current?.click()}
        >
          <LuImagePlus aria-hidden="true" />
          Ajouter une image
        </Button>
        <Text fontSize="12px" color="app.muted">
          Ou colle une capture (Ctrl+V), ou dépose un fichier ici.
        </Text>
      </Flex>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        aria-label="Ajouter une image"
        accept={IMAGE_TYPES.join(",")}
        onChange={(event) => {
          addImages(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <Dialog.Root
        open={open !== null}
        onOpenChange={(details) => {
          if (!details.open) setOpen(null);
        }}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="app.card">
              <Dialog.Body pt="6">
                {open && (
                  <Image
                    src={open.image.url}
                    alt={`Image ${open.index + 1} en grand`}
                    maxH="75vh"
                    mx="auto"
                  />
                )}
              </Dialog.Body>
              <Dialog.Footer justifyContent="space-between">
                <Button
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => {
                    if (open) remove.mutate(open.image);
                    setOpen(null);
                  }}
                >
                  Retirer l'image
                </Button>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Fermer</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Flex>
  );
}
