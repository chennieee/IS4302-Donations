import React from "react";

export default function Modal({ open, onClose, children, widthClass = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="absolute inset-0 flex items-start justify-center overflow-auto">
        <div className={`mt-16 w-full ${widthClass} px-4 md:px-0`}>
          <div className="relative rounded-2xl bg-white border border-gray-300 shadow-2xl overflow-hidden">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
