import { AuthGate } from "./auth/AuthGate";
import { HeaderActions } from "./layout/HeaderActions";
import { Shell } from "./layout/Shell";

export function App() {
  return (
    <AuthGate>
      <Shell actions={<HeaderActions />} />
    </AuthGate>
  );
}
