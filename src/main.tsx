import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initContentSync } from "./stores/contentSync";

// Hydrate localStorage from the cloud and subscribe to realtime updates,
// so admin uploads on any device sync to every open visitor.
void initContentSync();

createRoot(document.getElementById("root")!).render(<App />);
