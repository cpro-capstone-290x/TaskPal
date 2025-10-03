import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ChatProvider } from "./context/ChatProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ChatProvider>   {/* ✅ Now all children get chat context */}
        <App />
      </ChatProvider>
    </BrowserRouter>
  </StrictMode>
);
