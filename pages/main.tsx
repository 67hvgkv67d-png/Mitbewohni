import React from "react";
import { createRoot } from "react-dom/client";
import WgFinder from "../app/WgFinder";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WgFinder />
  </React.StrictMode>,
);
