import { toaster } from "../components/toaster";
import { validateImage } from "./images";
import { useUploadImage } from "./queries";

export function useAddImages(ticketId: number): (files: File[]) => void {
  const upload = useUploadImage(ticketId);
  return (files) => {
    for (const file of files) {
      const error = validateImage(file);
      if (error) toaster.create({ type: "error", title: error });
      else upload.mutate(file);
    }
  };
}
