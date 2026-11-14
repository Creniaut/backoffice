import { isTextField } from "./dom";

function input(type: string) {
  const element = document.createElement("input");
  element.type = type;
  return element;
}

describe("isTextField", () => {
  it.each(["text", "url", "search"])("is true for a %s input", (type) =>
    expect(isTextField(input(type))).toBe(true),
  );
  it.each(["radio", "checkbox", "button"])("is false for a %s input", (type) =>
    expect(isTextField(input(type))).toBe(false),
  );
  it("is true for a textarea", () =>
    expect(isTextField(document.createElement("textarea"))).toBe(true));
  it("is false for a button or nothing", () => {
    expect(isTextField(document.createElement("button"))).toBe(false);
    expect(isTextField(null)).toBe(false);
  });
});
