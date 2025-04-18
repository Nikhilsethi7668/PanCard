import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../Context/UserContext";
import Axios from "../Lib/Axios";
import SendInvoiceDialog from "../Components/invoice/SendInvoiceDialog";
import { FaDownload, FaSearch, FaFileInvoice } from "react-icons/fa";
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
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllUsers = async () => {
    try {
      const response = await Axios.get(`/data/get-all-users/${user.id}`);
      setAllUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
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
    setIsLoading(true);
    try {
      const response = await Axios.get("/invoice/get", {
        params: { ...filters, searchText },
      });
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
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
    <div className="w-full max-w-6xl px-4 mx-auto py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <FaFileInvoice className="text-blue-600 text-2xl mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Invoice Management</h1>
        </div>
        
        {user.isAdmin && (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <button
              onClick={DownloadCsvDemo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <FaDownload className="text-blue-600" />
              Download Format
            </button>
            <SendInvoiceDialog ReFetch={fetchInvoices} />
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {user.isAdmin && (
            <div className="relative">
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
                placeholder="Search invoices..."
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          )}

          {user.isAdmin && (
            <select
              name="userid"
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">All Users</option>
              {allUsers?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u?.username}
                </option>
              ))}
            </select>
          )}

          <select
            name="month"
            disabled={!filters.year}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            name="year"
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={filters.year}
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              {searchText || filters.month || filters.year || filters.userid
                ? "No invoices match your filters"
                : "No invoices found"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                user={user}
                refreshInvoices={fetchInvoices}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoice;