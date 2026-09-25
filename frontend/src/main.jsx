import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { queryClient } from "./lib/queryClient.js";

function render() {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  );
}

// MSW REST mocks are opt-in so both devs can work without a backend.
// Set VITE_USE_MOCKS=true in .env to enable.
if (import.meta.env.VITE_USE_MOCKS === "true") {
  import("./mocks/browser.js")
    .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
    .finally(render);
} else {
  render();
}
