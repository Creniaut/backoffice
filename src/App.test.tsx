import { screen } from "@testing-library/react";
import { Shell } from "./layout/Shell";
import { renderWithProviders } from "./test/render";

it("renders the brand in the shell", () => {
  renderWithProviders(<Shell />);
  expect(screen.getByText("Creniaut")).toBeInTheDocument();
  expect(screen.getByText("back-office")).toBeInTheDocument();
});
