import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { router } from "./routes";
import { HelmetProvider } from "react-helmet-async";

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </HelmetProvider>
  );
}

