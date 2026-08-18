import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./hooks/useAuth";
import "./styles/app.css";
import "./styles/footer.css";
import "./styles/impressum.css";

createRoot(document.getElementById("root")!).render(<AuthProvider><App /></AuthProvider>);
