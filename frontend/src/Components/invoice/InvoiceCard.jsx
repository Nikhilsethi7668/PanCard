import React, { useState } from "react";
import { FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Axios from "../../Lib/Axios";

const InvoiceCard = ({ invoice, user, refreshInvoices }) => {
  const [status, setStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const statusOptions = [
    { value: "", label: "Select Status" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  const markRead = async (id) => {
    try {
      await Axios.put("/invoice/mark-read/" + id);
    } catch (error) {
      console.error("Error marking invoice as read:", error);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Invoice Date: ${invoice.invoiceDate}`, 14, 36);
    doc.text(`Due Date: ${invoice.dueDate}`, 14, 42);
    doc.text("Bill To:", 14, 52);
    doc.text(`${invoice.billToName}`, 14, 58);
    doc.text(`${invoice.billToCompany}`, 14, 64);
    doc.text(`${invoice.billToAddress}`, 14, 70);
    doc.text(`${invoice.billToEmail}`, 14, 76);

    autoTable(doc, {
      startY: 90,
      head: [["Tax Type", "Tax %", "Tax Amt", "Total (Excl. tax)", "Total"]],
      body: [
        [
          invoice.taxType,
          invoice.taxPercentage + "%",
          `₹${invoice.taxAmount}`,
          `₹${invoice.totalWithoutTax}`,
          `₹${invoice.total}`,
        ],
      ],
    });

    doc.text(`Notes: ${invoice.notes}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(
      `Payment Status: ${invoice.paymentStatus}`,
      14,
      doc.lastAutoTable.finalY + 18
    );
    markRead(invoice.id);
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handleStatusUpdate = async () => {
    if (!status) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      await Axios.put(`/invoice/status-update/${invoice.id}`, { status });
      refreshInvoices();
      
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setIsUpdating(false);
      setStatus(""); 
    }
  };

  return (
    <div className="border rounded-xl p-4 shadow-sm space-y-2 bg-white">
      <div className="flex justify-between items-center">
        <div
          onClick={generatePDF}
          className="flex gap-1 hover:underline cursor-pointer text-white hover:text-black items-center"
        >
          {!invoice?.isRead && (
            <span className="h-2 w-2 rounded bg-green-500"></span>
          )}
          <h2 className="text-lg text-black font-semibold">
            {invoice.invoiceNumber}
          </h2>
          <FiDownload strokeWidth={3} />
        </div>
        <div className="flex flex-col gap-2">
          <span
            className={`px-2 py-1 rounded text-xs ${
              invoice?.paymentStatus === "paid"
                ? "bg-green-100 text-green-700"
                : invoice?.paymentStatus === "overdue"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {invoice.paymentStatus}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        <strong>Pan number:</strong> {invoice.panNumber}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Bill To:</strong> {invoice.billToName} (
        {invoice.billToCompany})
      </p>
      <p className="text-sm text-gray-600">
        <strong>Invoice Date:</strong> {invoice.invoiceDate}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Due Date:</strong> {invoice.dueDate}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Total:</strong> ₹{invoice.total}
      </p>
      <p className="text-xs text-gray-500 italic">{invoice.notes}</p>

      {user.isAdmin && (
        <div className="mt-3 flex items-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isUpdating}
            className="rounded px-2 h-8 border-2 flex-1 max-w-[180px]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating || !status || status === invoice.paymentStatus}
            className="h-8 bg-slate-100 px-3 ml-3 hover:bg-slate-200 rounded disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </div>
  );
};

export default InvoiceCard;