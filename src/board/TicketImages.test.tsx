import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRoutes } from "../AppRoutes";
import { toaster } from "../components/toaster";
import { makeFile, members, projects, tickets } from "../test/fixtures";
import { renderWithProviders } from "../test/render";
import {
  deleteImage,
  fetchBoard,
  fetchEvents,
  fetchImages,
  uploadImage,
} from "./api";
import type { TicketImage } from "./types";

vi.mock("./api", () => ({
  fetchBoard: vi.fn(),
  fetchEvents: vi.fn(),
  fetchImages: vi.fn(),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));
vi.mock("../components/toaster", () => ({ toaster: { create: vi.fn() } }));

const image: TicketImage = {
  id: 1,
  ticketId: 3,
  path: "3/a.png",
  url: "https://signed/a",
  createdAt: "2026-11-10T10:00:00",
};

async function openTicket3() {
  renderWithProviders(<AppRoutes />, { route: "/todo?ticket=3" });
  return screen.findByRole("dialog");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchBoard).mockResolvedValue({ projects, members, tickets });
  vi.mocked(fetchEvents).mockResolvedValue([]);
  vi.mocked(fetchImages).mockResolvedValue([]);
  vi.mocked(uploadImage).mockResolvedValue();
  vi.mocked(deleteImage).mockResolvedValue();
});

it("pasting an image file uploads it", async () => {
  const drawer = await openTicket3();
  const file = makeFile("capture.png", "image/png", 1000);
  fireEvent.paste(drawer, {
    clipboardData: { files: [file], getData: () => "" },
  });
  await vi.waitFor(() => expect(uploadImage).toHaveBeenCalledWith(3, file));
});

it("pasting plain text into the description does not upload anything", async () => {
  const drawer = await openTicket3();
  await userEvent.click(
    within(drawer).getByRole("button", { name: "Modifier" }),
  );
  fireEvent.paste(within(drawer).getByLabelText("Description"), {
    clipboardData: { files: [], getData: () => "du texte" },
  });
  expect(uploadImage).not.toHaveBeenCalled();
});

it("pasting a HEIC photo is refused with the French message", async () => {
  const drawer = await openTicket3();
  fireEvent.paste(drawer, {
    clipboardData: {
      files: [makeFile("IMG_0001.heic", "image/heic", 1000)],
      getData: () => "",
    },
  });
  expect(toaster.create).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "error",
      title: "Format non pris en charge : PNG, JPEG, WebP ou GIF.",
    }),
  );
  expect(uploadImage).not.toHaveBeenCalled();
});

it("an 8 MB file from « Ajouter une image » is refused and nothing is uploaded", async () => {
  const drawer = await openTicket3();
  const input = within(drawer).getByLabelText("Ajouter une image");
  await userEvent.upload(input, makeFile("photo.jpg", "image/jpeg", 8_000_000));
  expect(toaster.create).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "error",
      title: "Image trop lourde : 5 Mo maximum.",
    }),
  );
  expect(uploadImage).not.toHaveBeenCalled();
});

it("dropping an image file on the drawer uploads it", async () => {
  const drawer = await openTicket3();
  const file = makeFile("schema.webp", "image/webp", 1000);
  fireEvent.drop(drawer, { dataTransfer: { files: [file], types: ["Files"] } });
  await vi.waitFor(() => expect(uploadImage).toHaveBeenCalledWith(3, file));
});

it("clicking a thumbnail opens it large; « Retirer l'image » deletes it", async () => {
  vi.mocked(fetchImages).mockResolvedValue([image]);
  const drawer = await openTicket3();
  await userEvent.click(
    await within(drawer).findByRole("button", { name: "Agrandir l'image 1" }),
  );
  expect(await screen.findByAltText("Image 1 en grand")).toHaveAttribute(
    "src",
    "https://signed/a",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Retirer l'image" }),
  );
  await vi.waitFor(() => expect(deleteImage).toHaveBeenCalledWith(image));
});
