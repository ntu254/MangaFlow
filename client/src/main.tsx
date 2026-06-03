import { StrictMode } from "react";
import { ClerkProvider } from "@clerk/react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import App from "./App";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const app = (
  <ToastProvider>
    <App clerkConfigured={Boolean(clerkPublishableKey)} />
  </ToastProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>{app}</ClerkProvider>
      ) : (
        app
      )}
    </BrowserRouter>
  </StrictMode>
);
