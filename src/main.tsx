import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./styles.css";
import App from "./App";
import { WordsProvider } from "./words";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WordsProvider>
      <App />
    </WordsProvider>
  </StrictMode>,
);
