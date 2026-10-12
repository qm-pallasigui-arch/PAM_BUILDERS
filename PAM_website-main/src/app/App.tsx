import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "./portal/auth";
import { DataProvider } from "./portal/data";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RouterProvider router={router} />
        <Toaster />
        <Analytics />
      </DataProvider>
    </AuthProvider>
  );
}