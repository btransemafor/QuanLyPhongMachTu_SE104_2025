import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd"; // Thêm App
import viVN from "antd/locale/vi_VN";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";
import { ToastProvider } from "./contexts/ToastContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={viVN}>
        <ToastProvider>
          <AntApp>
            <App />
          </AntApp>
        </ToastProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
