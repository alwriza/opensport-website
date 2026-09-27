import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./redesign.css";
import "./i18n";

const root = createRoot(document.getElementById("root")!);

root.render(<App />);
