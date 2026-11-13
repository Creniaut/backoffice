const REQUIRED = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];

export function assertBuildEnv(
  mode: string,
  env: Record<string, string | undefined>,
): void {
  if (mode !== "production") return;
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Variables de build manquantes : ${missing.join(", ")}`);
  }
}
