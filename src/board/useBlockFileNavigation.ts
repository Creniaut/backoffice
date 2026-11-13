import { useEffect } from "react";
import { hasFiles } from "./dom";

export function useBlockFileNavigation(): void {
  useEffect(() => {
    const block = (event: DragEvent) => {
      if (hasFiles(event.dataTransfer)) event.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);
}
