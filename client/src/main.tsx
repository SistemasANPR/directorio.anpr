import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 🌱 Importar auto-setup para poblado automático de base de datos en producción
import "@/lib/autoSetupDB.js";

createRoot(document.getElementById("root")!).render(<App />);
