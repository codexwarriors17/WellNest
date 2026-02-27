// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // folder import is correct

import "./styles/global.css";
import "./utils/i18n";

const rootEl = document.getElementById("root");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2>WellNest is starting…</h2>
      <p>If it crashes, open the browser console (F12 → Console).</p>
      <App />
    </div>
  </React.StrictMode>
);