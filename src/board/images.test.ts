import { makeFile } from "../test/fixtures";
import { imageExtension, validateImage } from "./images";

describe("validateImage", () => {
  it("accepts a 1 MB png", () =>
    expect(
      validateImage(makeFile("a.png", "image/png", 1_000_000)),
    ).toBeNull());
  it("accepts exactly 5 MB", () =>
    expect(validateImage(makeFile("a.gif", "image/gif", 5242880))).toBeNull());
  it("refuses heic", () =>
    expect(validateImage(makeFile("a.heic", "image/heic", 1000))).toBe(
      "Format non pris en charge : PNG, JPEG, WebP ou GIF.",
    ));
  it("refuses 8 MB", () =>
    expect(validateImage(makeFile("a.jpg", "image/jpeg", 8_000_000))).toBe(
      "Image trop lourde : 5 Mo maximum.",
    ));
});

it("imageExtension maps the MIME type", () => {
  expect(imageExtension(makeFile("a", "image/jpeg", 1))).toBe("jpg");
  expect(imageExtension(makeFile("a", "image/webp", 1))).toBe("webp");
});
