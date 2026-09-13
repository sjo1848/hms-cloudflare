import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ReceptionRoot } from "./ReceptionPage";
import "./styles.css";

const root = location.pathname.startsWith("/bookings") ? <ReceptionRoot /> : <App />;
createRoot(document.getElementById("root")!).render(<StrictMode>{root}</StrictMode>);
