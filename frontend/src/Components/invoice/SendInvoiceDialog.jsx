import React, { useState } from "react";
import Axios from "../../Lib/Axios";
import Papa from "papaparse";

export default function SendInvoiceDialog({ReFetch}) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!csvFile) {
      alert("Please upload a CSV file.");
      return;
    }
  
    try {
      setLoading(true);
      const fileText = await csvFile.text();
      
      const { data, errors } = Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
      });
  
      if (errors?.length > 0) {
        throw new Error(`CSV parsing error on line ${errors[0].row + 2}: ${errors[0].message}`);
      }
  
      if (!data?.length) {
        throw new Error("CSV file is empty");
      }
  
      // Validate specific columns
      const validationErrors = [];
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/; // PAN format regex
  
      data.forEach((row, index) => {
        const rowNumber = index + 2; 
  
        // 1. Check PAN Number format
        if (!row.panNumber || !panRegex.test(row.panNumber)) {
          validationErrors.push(`Row ${rowNumber}: Invalid PAN number format (should be AAAAA9999A)`);
        }
  
        // 2. Check required fields
        if (!row.invoiceNumber) {
          validationErrors.push(`Row ${rowNumber}: Missing invoice number`);
        }
  
        if (!row.total || isNaN(parseFloat(row.total))) {
          validationErrors.push(`Row ${rowNumber}: Invalid total amount`);
        }
  
        if (!row.paymentStatus || !['paid', 'pending', 'overdue'].includes(row.paymentStatus.toLowerCase())) {
          validationErrors.push(`Row ${rowNumber}: Invalid payment status (must be paid/pending/overdue)`);
        }
      });
  
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors found:\n${validationErrors.join('\n')}`);
      }
  
      // Upload the file
      const formData = new FormData();
      formData.append("csv", csvFile);
      const res = await Axios.post("/invoice/send-invoice", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      alert(res.data?.message || "CSV processed successfully");
      if (res?.data?.errors && Array.isArray(res.data.errors)) {
        alert(res.data.errors.join('\n'));
      }
      setIsOpen(false);
      ReFetch()
    } catch (err) {
      console.error("Error:", err);
      alert(err.message);
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