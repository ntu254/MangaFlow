import { StrictMode } from "react";
import { ClerkProvider } from "@clerk/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const app = <App clerkConfigured={Boolean(clerkPublishableKey)} />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>{app}</ClerkProvider>
    ) : (
      app
    )}
  </StrictMode>
);
