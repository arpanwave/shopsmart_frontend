import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/oauth-success")({
  component: OAuthSuccessPage,
});

function OAuthSuccessPage() {

  const { refreshUser } = useAuth();

  useEffect(() => {

    const load = async () => {

      try {

        await refreshUser();

      } finally {

        window.location.href = "/";
      }
    };

    load();

  }, [refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Signing you in...
    </div>
  );
}