
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { AuthProvider } from "./config/auth-context";
import "./config/firestore-console"; // Make Firestore utilities available in console
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
  