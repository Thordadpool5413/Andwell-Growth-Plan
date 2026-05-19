import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "./DarkModeContext.jsx";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) {
  const { dark } = useDarkMode();

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 z-40 ${dark ? "bg-slate-900/60" : "bg-slate-900/40"}`}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              fixed inset-0 z-50 flex items-center justify-center pointer-events-none
            `}
          >
            <div
              className={`
                pointer-events-auto w-full mx-4 ${sizeStyles[size]}
                rounded-2xl shadow-xl border
                ${dark
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-white"
                }
              `}
            >
              {/* Header */}
              <div
                className={`
                  flex items-center justify-between px-6 py-4 border-b
                  ${dark ? "border-slate-700" : "border-slate-200"}
                `}
              >
                <h2
                  className={`
                    text-xl font-bold
                    ${dark ? "text-white" : "text-slate-900"}
                  `}
                >
                  {title}
                </h2>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`
                      p-1 rounded-lg transition-colors
                      ${dark
                        ? "hover:bg-slate-700 text-slate-400"
                        : "hover:bg-slate-100 text-slate-600"
                      }
                    `}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-4">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
