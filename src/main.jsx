import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { EVProvider } from "./components/EVContext.jsx";
import { ThemeContextProvider } from "./context/ThemeContext"; // 🌙 Import Theme Provider
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeContextProvider>
      <EVProvider>
        <App />
      </EVProvider>
    </ThemeContextProvider>
  </React.StrictMode>
);
