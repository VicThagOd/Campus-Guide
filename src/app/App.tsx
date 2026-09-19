import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { router } from "./routes";
import { HelmetProvider } from "react-helmet-async";
import { hasSupabaseEnv, missingSupabaseEnvVars } from "../lib/env";
import { NotificationPrompt } from "../components/NotificationPrompt";

export default function App() {
  if (!hasSupabaseEnv) {
    return (
      <HelmetProvider>
        <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "#BFC3C6" }}>
          <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
            <h1 className="mb-4" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#000000" }}>
              Local setup needed
            </h1>
            <p className="mb-4" style={{ color: "#000000", opacity: 0.75 }}>
              This app needs Supabase environment variables before it can render fully in development.
            </p>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-2" style={{ color: "#000000", fontWeight: 600 }}>
                Missing variables
              </p>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#2F4EA2" }}>
                {missingSupabaseEnvVars.join("\n")}
              </pre>
            </div>
            <p className="mt-4" style={{ color: "#000000", opacity: 0.75 }}>
              Create a `.env.local` file in the project root and add those values, then restart `npm run dev`.
            </p>
          </div>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <AuthProvider>
        <NotificationPrompt />
        <RouterProvider router={router} />
      </AuthProvider>
    </HelmetProvider>
  );
}
