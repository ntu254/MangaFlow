import { StrictMode } from "react";
import { ClerkProvider } from "@clerk/react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import App from "./App";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: "#9065d5",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorText: "#2f243a",
    colorTextSecondary: "#5f5270",
    colorInputText: "#2f243a",
    borderRadius: "12px",
    fontFamily: "'Geist Variable', sans-serif",
  },
  elements: {
    card: "border border-[#eadff6] shadow-[0_12px_32px_rgba(229,96,188,0.08)]",
    formButtonPrimary:
      "bg-[#9065d5] hover:bg-[#7f55c7] text-white border-none shadow-none",
    formButtonSecondary:
      "border border-[#eadff6] text-[#5f5270] bg-white hover:bg-[#f8f1ff]",
    socialButtonsBlockButton:
      "border border-[#eadff6] text-[#2f243a] bg-white hover:bg-[#f8f1ff]",
    socialButtonsIconButton: "border border-[#eadff6] hover:bg-[#f8f1ff]",
    footerActionLink: "text-[#9065d5] hover:text-[#7f55c7]",
    headerTitle: "text-[#2f243a]",
    headerSubtitle: "text-[#5f5270]",
    formFieldLabel: "text-[#5f5270]",
    formFieldInput:
      "border border-[#eadff6] focus:border-[#9065d5] focus:ring-2 focus:ring-[#9065d5]/20",
    dividerLine: "bg-[#eadff6]",
    dividerText: "text-[#8a7a99]",
    developmentModeNotice: "hidden",
    formFieldInputShowPasswordButton: "text-[#8a7a99] hover:text-[#5f5270]",
    identityPreviewEditButton: "text-[#9065d5] hover:text-[#7f55c7]",
    avatarBox: "border-2 border-[#eadff6]",
  },
};

const app = (
  <ToastProvider>
    <App clerkConfigured={Boolean(clerkPublishableKey)} />
  </ToastProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {clerkPublishableKey ? (
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          appearance={clerkAppearance}
          unsafe_disableDevelopmentModeConsoleWarning
        >
          {app}
        </ClerkProvider>
      ) : (
        app
      )}
    </BrowserRouter>
  </StrictMode>
);
