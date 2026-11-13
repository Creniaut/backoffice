import { assertBuildEnv } from "./build-env";

it("a production build without Supabase variables fails", () => {
  expect(() => assertBuildEnv("production", {})).toThrow(
    "VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY",
  );
});

it("a production build with both variables passes", () => {
  expect(() =>
    assertBuildEnv("production", {
      VITE_SUPABASE_URL: "https://x.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
    }),
  ).not.toThrow();
});

it("development and tests do not need them", () => {
  expect(() => assertBuildEnv("development", {})).not.toThrow();
  expect(() => assertBuildEnv("test", {})).not.toThrow();
});
