import React, { useContext, useEffect, useState } from "react";
import SendInvoiceDialog from "../Components/invoice/SendInvoiceDialog";
import { FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { UserContext } from "../Context/UserContext";
import Axios from "../Lib/Axios";

const Invoice = () => {
  const { user } = useContext(UserContext);
  const currentYear = new Date().getFullYear().toString();
  const [filters, setFilters] = useState({
    userId: user.isAdmin ? "" : user.id,
    month: "",
    year: currentYear,
  });
  const [invoices, setInvoices] = useState([
    {
      invoiceNumber: "INV-2025-0001",
      invoiceDate: "2025-04-01",
      dueDate: "2025-04-10",
      billToName: "Riya Sharma",
      billToCompany: "Sharma Enterprises",
      billToAddress: "Block A, Sector 18, Noida, UP",
      billToEmail: "riya@sharmaenterprises.in",
      taxType: "GST",
      taxPercentage: 18,
      taxAmount: 1800,
      totalWithoutTax: 10000,
      total: 11800,
      notes: "Pay via UPI or bank transfer.",
      paymentStatus: "Paid",
    },
    {
      invoiceNumber: "INV-2025-0002",
      invoiceDate: "2025-04-02",
      dueDate: "2025-04-12",
      billToName: "Arjun Patel",
      billToCompany: "Patel Tech",
      billToAddress: "MG Road, Pune, Maharashtra",
      billToEmail: "arjun@pateltech.co",
      taxType: "IGST",
      taxPercentage: 18,
      taxAmount: 2700,
      totalWithoutTax: 10000,
      total: 17700,
      notes: "Kindly clear the dues ASAP.",
      paymentStatus: "Unpaid",
    },
    {
      invoiceNumber: "INV-2025-0003",
      invoiceDate: "2025-04-05",
      dueDate: "2025-04-15",
      billToName: "Neha Verma",
      billToCompany: "Verma & Co.",
      billToAddress: "DLF Phase 3, Gurugram, Haryana",
      billToEmail: "neha@vermacorp.com",
      taxType: "GST",
      taxPercentage: 12,
      taxAmount: 1200,
      totalWithoutTax: 10000,
      total: 11200,
      notes: "Service includes design consultation.",
      paymentStatus: "Pending",
    },
    {
      invoiceNumber: "INV-2025-0004",
      invoiceDate: "2025-04-08",
      dueDate: "2025-04-18",
      billToName: "Mohit Singh",
      billToCompany: "Singh Logistics",
      billToAddress: "NH 24, Lucknow, Uttar Pradesh",
      billToEmail: "mohit@singhlogistics.in",
      taxType: "GST",
      taxPercentage: 5,
      taxAmount: 500,
      totalWithoutTax: 10000,
      total: 10500,
      notes: "Delivery charges included.",
      paymentStatus: "Paid",
    },
    {
      invoiceNumber: "INV-2025-0005",
      invoiceDate: "2025-04-10",
      dueDate: "2025-04-25",
      billToName: "Kavita Joshi",
      billToCompany: "Joshi Artworks",
      billToAddress: "Bandra West, Mumbai, Maharashtra",
      billToEmail: "kavita@joshiartworks.com",
      taxType: "SGST+CGST",
      taxPercentage: 18,
      taxAmount: 3600,
      totalWithoutTax: 20000,
      total: 23600,
      notes: "Final payment for project delivery.",
      paymentStatus: "Overdue",
    },
  ]);
  console.log(user);

  const [allUsers, setAllUsers] = useState([]);
  const fetchAllUsers = async () => {
    try {
      const response = await Axios.get(`/data/get-all-users/${user.id}`);
      setAllUsers(response.data);
    } catch (error) {
      alert(error.message);
      console.log(error.message);
    }
  };
  useEffect(() => {
    if(user.isAdmin){fetchAllUsers();}
    return
  }, []);

  const users = [
    { id: "1", name: "Riya Sharma" },
    { id: "2", name: "Amit Verma" },
    { id: "3", name: "Sneha Patil" },
  ];

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: `${year}`, label: `${year}` };
  });

  const fetchInvoices = async (filters) => {
    try {
      const response = await Axios.get("/api/invoices", {
        params: filters,
      });

      return response.data.invoices;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  };

  useEffect(() => {
    if (filters.userId || filters.month || filters.year) {
      fetchInvoices(filters).then((data) => {
        if (data && data.length > 0) {
          setInvoices(data);
        }
      });
    }
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const generatePDF = (invoice) => {
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

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="w-full lg:max-w-2xl px-4 mx-auto mt-10">
      <div className="flex px-2 py-3 border-b justify-between items-center">
        <h1 className=" text-xl font-semibold">All invoices</h1>
        {user.isAdmin && <SendInvoiceDialog />}
      </div>
      <div className="flex flex-wrap gap-4 mt-4">
        {user.isAdmin && (
          <select
            name="userId"
            onChange={handleFilterChange}
            className="border px-3 py-1 rounded"
          >
            <option value="">Select User</option>
            {allUsers?.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username}
              </option>
            ))}
          </select>
        )}

        <select
          name="month"
          onChange={handleFilterChange}
          className="border px-3 py-1 rounded"
        >
          <option value="">Select Month</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          name="year"
          onChange={handleFilterChange}
          className="border px-3 py-1 rounded"
        >
          <option value="">Select Year</option>
          {years.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 mt-6 py-2">
        {invoices?.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No invoices found for selected filters.
          </p>
        ) : (
          invoices.map((invoice, index) => (
            <div
              key={index}
              className="border rounded-xl p-4 shadow-sm space-y-2 bg-white"
            >
              <div className="flex justify-between items-center">
                <div
                  onClick={() => generatePDF(invoice)}
                  className="flex gap-1 hover:underline cursor-pointer text-white hover:text-black items-center"
                >
                  <h2 className="text-lg text-black font-semibold">
                    {invoice.invoiceNumber}
                  </h2>
                  <FiDownload strokeWidth={3} />
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    invoice.paymentStatus === "Paid"
                      ? "bg-green-100 text-green-700"
                      : invoice.paymentStatus === "Unpaid"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {invoice.paymentStatus}
                </span>
              </div>

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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Invoice;
