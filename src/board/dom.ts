export function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "TEXTAREA" ||
    target.tagName === "INPUT" ||
    target.isContentEditable
  );
}

export function hasFiles(dataTransfer: DataTransfer | null): boolean {
  return Array.from(dataTransfer?.types ?? []).includes("Files");
}
