// components/ToastContainer.jsx
import React, { useState } from "react";
import ToastMessage from "./ToastMessage";

let addToastGlobal;

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  // Hàm thêm toast (sẽ được gọi từ ngoài)
  const addToast = (message, duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, duration }]);
  };

  // Hàm xóa toast
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Gán global để dùng ở bất kỳ đâu
  if (!addToastGlobal) {
    addToastGlobal = addToast;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 420,
      }}
    >
      {toasts.map((toast) => (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
// Named export: đảm bảo import { toast } hoạt động
export const toast = (message, duration) => {
  if (addToastGlobal) {
    addToastGlobal(message, duration);
  } else {
    console.warn("ToastContainer chưa được mount!");
  }
};

export default ToastContainer;