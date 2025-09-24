import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { installAutoCloseNativePickers } from "./utils/commonUtils";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
installAutoCloseNativePickers();

root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
