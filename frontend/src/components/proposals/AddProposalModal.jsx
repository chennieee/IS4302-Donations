import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";

export default function AddProposalModal({ open, onClose }) {
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [showToast, setShowToast] = useState(false);

  // reset form whenever the modal opens
  useEffect(() => {
    if (open) {
      setDays("");
      setReason("");
      setShowToast(false);
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // form submission: show toast, close modal after 1.5s
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose?.();
    }, 1500);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} widthClass="max-w-3xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Add a Proposal</h1>

          {/* Card framing similar to your screenshot */}
          <div className="rounded-2xl border border-gray-300 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Proposed extension */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-12 md:col-span-4 text-gray-700 font-medium">
                  Proposed extension:
                </label>
                <div className="col-span-12 md:col-span-8 flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="e.g., 14"
                    className="w-28 rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  <span className="text-gray-600">days</span>
                </div>
              </div>

              {/* Reason */}
              <div className="grid grid-cols-12 gap-4">
                <label className="col-span-12 md:col-span-4 text-gray-700 font-medium">
                  Reason for extension:
                </label>
                <div className="col-span-12 md:col-span-8">
                  <textarea
                    rows={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe your reason..."
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-gray-200 text-gray-900 font-medium shadow-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white font-medium shadow-sm hover:bg-black"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {showToast && (
        <div className="fixed top-4 right-4 z-[60] rounded-xl bg-green-600 text-white px-4 py-3 shadow-lg">
          Proposal successfully submitted
        </div>
      )}
    </>
  );
}
