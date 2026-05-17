// import { createFileRoute, useNavigate } from "@tanstack/react-router";
// import { useEffect } from "react";
// import { useAuth } from "../lib/auth-context";

// export const Route = createFileRoute("/oauth-success")({
//   component: OAuthSuccessPage,
// });

// function OAuthSuccessPage() {
//   const { refreshUser } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const run = async () => {
//       try {
//         await refreshUser();
//       } finally {
//         navigate({ to: "/" });
//       }
//     };

//     run();
//   }, [refreshUser, navigate]);

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       Signing you in...
//     </div>
//   );
// }