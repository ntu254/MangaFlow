import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import { AuthProvider } from "@/shared/context/AuthContext";
import App from "./App";
import "./index.css";

const app = (
  <ToastProvider>
    <App />
  </ToastProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {app}
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
