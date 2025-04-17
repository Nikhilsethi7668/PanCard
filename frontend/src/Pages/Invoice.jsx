import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../Context/UserContext";
import Axios from "../Lib/Axios";
import SendInvoiceDialog from "../Components/invoice/SendInvoiceDialog";
import { FaDownload, FaSearch } from "react-icons/fa";
import InvoiceCard from "../Components/invoice/InvoiceCard";

const Invoice = () => {
  const { user } = useContext(UserContext);
  const currentYear = new Date().getFullYear().toString();
  const [searchText, setSearchText] = useState("");
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
    if (user.isAdmin) {
      fetchAllUsers();
    }
  }, [user]);

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

  const fetchInvoices = async () => {
    try {
      const response = await Axios.get("/invoice/get", {
        params: { ...filters, searchText },
      });
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    }
  };

  useEffect(() => {
    if (filters.userid || filters.month || filters.year) {
      fetchInvoices();
    }
  }, [filters, searchText]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const DownloadCsvDemo = () => {
    const link = document.createElement("a");
    link.href = "/dummyInvoice.csv";
    link.download = "dummyInvoice.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full lg:max-w-2xl px-4 mx-auto mt-10">
      <div className="flex px-2 py-3 border-b justify-between items-center">
        <h1 className="text-xl font-semibold">All invoices</h1>
        {user.isAdmin && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              (format)
              <FaDownload
                className="cursor-pointer"
                onClick={DownloadCsvDemo}
              />
            </div>
            <SendInvoiceDialog ReFetch={fetchInvoices} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-4">
        {user.isAdmin && (
          <div className="flex gap-2">
            <input
              className="border h-8 w-full"
              type="text"
              onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search invoices..."
            />
            <button
              onClick={fetchInvoices}
              className="p-2 bg-slate-200 hover:bg-slate-100 rounded"
            >
              <FaSearch />
            </button>
          </div>
        )}

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
        {invoices.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No invoices found for selected filters.
          </p>
        ) : (
          invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              user={user}
              refreshInvoices={fetchInvoices}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Invoice;