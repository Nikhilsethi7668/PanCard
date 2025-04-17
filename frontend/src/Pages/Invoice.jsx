import React, { useContext, useEffect, useState } from "react";

import { FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { UserContext } from "../Context/UserContext";
import Axios from "../Lib/Axios";
import SendInvoiceDialog from "../Components/invoice/SendInvoiceDialog";
import { FaDownload, FaSearch } from "react-icons/fa";

const Invoice = () => {
  const { user } = useContext(UserContext);
  const currentYear = new Date().getFullYear().toString();
   const [searchText,setSearchText]=useState("")
  const [filters, setFilters] = useState({
    userid: user.isAdmin ? "" : user.id,
    month: "",
    year: currentYear,
  });
  const [invoices, setInvoices] = useState([]);
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
    if (user.isAdmin) { fetchAllUsers(); }
    return
  }, []);

  
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
      const response = await Axios.get("/invoice/get", {
        params: {...filters,searchText},
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  };

  useEffect(() => {
    if (filters.userid || filters.month || filters.year) {
      fetchInvoices(filters).then((data) => {        
          setInvoices(data);
      });
    }
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };


  const markRead =async(id)=>{
    try {
      await Axios.put("/invoice/mark-read/"+id);
      await fetchInvoices(filters).then((data) => {        
        setInvoices(data);})
    } catch (error) {
      console.error("Error reading invoices:", error);
      return;
    }
  }
  const Search =()=>{
    fetchInvoices(filters).then((data) => {        
      setInvoices(data);
  });
  }
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
    markRead(invoice.id)
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const DownloadCsvDemo = () => {
    const link = document.createElement('a');
    link.href = '/dummyInvoice.csv'; 
    link.download = 'dummyInvoice.csv'; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const [status, setStatus] = useState("");
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];


const handleStatusUpdate = async (invoiceId) => {
  try {
  
    const response = await Axios.put(
      `/invoices/status-update/${invoiceId}`,{ status });
     
      fetchInvoices(filters).then((data) => {        
        setInvoices(data);
    });
  } catch (err) {
    console.log(err);
    
  } 
};

  return (
    <div className="w-full lg:max-w-2xl px-4 mx-auto mt-10">
      <div className="flex px-2 py-3 border-b justify-between items-center">
        <h1 className=" text-xl font-semibold">All invoices</h1>
        {user.isAdmin && <div className="flex items-center gap-6"> <div className="flex items-center gap-1"> (format)<FaDownload className=' cursor-pointer' onClick={DownloadCsvDemo}/></div> <SendInvoiceDialog /></div>}
      </div>
      <div className="flex flex-wrap gap-4 mt-4">
      {user.isAdmin && ( <div className="flex gap-2">
                <input className="border h-8 w-full" type="text"  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      Search();
    }
  }} value={searchText} onChange={(e)=>setSearchText(e.target.value)} /> <button onClick={Search} className="p-2 bg-slate-200 hover:bg-slate-100 rounded"><FaSearch/></button>
                </div>)}
        {user.isAdmin && (
          <select
            name="userid"
            onChange={handleFilterChange}
            className="border px-3 py-1 rounded"
          >
            <option value="">Select User</option>
            {allUsers?.map((u) => (
              <option key={u.id} value={u.id}>
                {u?.username}
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
                 {!invoice?.isRead&&<span className="h-2 w-2 rounded bg-green-500"></span>} <h2 className="text-lg text-black font-semibold">
                    {invoice.invoiceNumber}
                  </h2>
                  <FiDownload strokeWidth={3} />
                </div>
                <div className=" flex flex-col gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${invoice?.paymentStatus === "paid"
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
                <strong>Pan number:</strong>{invoice.panNumber}
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
              {user.isAdmin?
                  <div className="status-updater">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isUpdating}
                    className="rounded border-2"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
            
                  <button
                    onClick={()=>handleStatusUpdate(invoice.id)}
                    className="update-btn p-2"
                  >
                    {'Update Status'}
                  </button>
                </div>
                :null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Invoice;
