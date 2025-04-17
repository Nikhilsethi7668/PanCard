import React, { useState } from "react";
import Axios from "../../Lib/Axios";

export default function SendInvoiceDialog({ReFetch}) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!csvFile) {
      alert("Please upload csv file.");
      return;
    }

    const formData = new FormData();
    formData.append("csv", csvFile);
    try {
      setLoading(true);
      const res = await Axios.post("/invoice/send-invoice", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Success:", res.data);
      alert("Invoice sent successfully!");
      ReFetch()
      setIsOpen(false);
    } catch (err) {
      console.error("Error uploading files:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="border bg-blue-500 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={() => setIsOpen(true)}
      >
        Send Invoice
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-lg shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Send Invoice</h2>
              <p className="text-sm text-gray-500">
                Add CSV of user details and the invoice PDF. Click send when you're done.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="users-csv" className="text-sm font-medium block">
                  User file (.csv)
                </label>
                <input
                  id="users-csv"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="border border-gray-300 px-3 py-2 rounded-md text-sm w-full"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-black text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}