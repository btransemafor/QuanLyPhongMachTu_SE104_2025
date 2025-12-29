import React, { useState } from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

// Modern Toast Component
const ModernToastContainer = ({ toasts, onDismiss }) => {
  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type) => {
    const styles = {
      success: "from-green-500/90 to-green-600/90",
      error: "from-rose-500/90 to-red-600/90",
      warning: "from-amber-500/90 to-orange-600/90",
      info: "from-blue-500/90 to-indigo-600/90",
    };
    return styles[type] || styles.info;
  };

  return (
    <>
      <div className="fixed top-6 right-6  z-[200000]  space-y-3 max-w-md pointer-events-none toast-portal">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              flex items-center gap-3 p-4 pr-3 rounded-2xl
              bg-gradient-to-r ${getStyles(toast.type)}
              backdrop-blur-xl border border-white/20
              shadow-2xl text-white
              transform transition-all duration-300 ease-out
              ${
                toast.isHiding
                  ? "translate-x-[120%] opacity-0 scale-95"
                  : "translate-x-0 opacity-100 scale-100"
              }
            `}
            style={{
              animation: toast.isHiding ? "none" : "slideIn 0.3s ease-out",
            }}
          >
            <div className="flex-shrink-0 animate-pulse">
              {getIcon(toast.type)}
            </div>

            <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
              {typeof toast.message === "string" ? (
                <p>{toast.message}</p>
              ) : (
                toast.message
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
              <div
                className="h-full bg-white/60"
                style={{
                  animation: `progress ${toast.duration}ms linear forwards`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  );
};

export default ModernToastContainer;
