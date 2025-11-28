import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { EVProvider } from "./components/EVContext.jsx";
import { ThemeContextProvider } from "./context/ThemeContext"; // 🌙 Import Theme Provider
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeContextProvider>
        <EVProvider>
          <App />
        </EVProvider>
      </ThemeContextProvider>
    </AuthProvider>
  </React.StrictMode>
);
