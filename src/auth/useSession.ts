import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface SessionState {
  status: "loading" | "signedOut" | "signedIn";
  email: string | null;
}

function fromSession(session: Session | null): SessionState {
  return session
    ? { status: "signedIn", email: session.user.email ?? null }
    : { status: "signedOut", email: null };
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    email: null,
  });

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState(fromSession(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState(fromSession(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function signIn() {
  void supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
}

export function signOut() {
  void supabase.auth.signOut();
}
