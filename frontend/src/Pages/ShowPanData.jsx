import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../Context/UserContext";
import { FaDownload } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import Axios from "../Lib/Axios";

const ShowPanData = () => {
  const [panEntries, setPanEntries] = useState([]);
  const [selectedPan, setSelectedPan] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [selectedDownloadType, setSelectedDownloadType] = useState("");
  const [emails, setEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPanList, setShowPanList] = useState(false);
  const { user } = useContext(UserContext);
 const [loading,setLoading]=useState(false)
  useEffect(() => {
    fetchPanEntries();
  }, []);

  const fetchPanEntries = async () => {
    try {
        setLoading(true)
      const response = await Axios.get(
        `/api/pan-entries/${user.id}`
      );
      setPanEntries(response.data);
    } catch (error) {
      console.error("Error fetching PAN entries:", error);
      alert("Failed to fetch PAN entries.");
    } finally{
        setLoading(false)
    }
  };

  useEffect(() => {
    if (!selectedPan) return;

    const fetchEmails = async () => {
      try {
        const response = await Axios.get(
          `/api/data/${selectedPan}`,
          {
            params: {
              page: currentPage,
              limit: 100,
              userId: user.id,
              type: selectedType,
            },
          }
        );

        setEmails(response.data.emails);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching emails:", error);
        alert("Failed to fetch emails.");
      }
    };

    fetchEmails();
  }, [selectedPan, currentPage, user.id]);

  const downloadData = async (panNumber) => {
    try {
      const response = await Axios.get(
        `http://localhost:4000/api/data/${panNumber}/download`,
        {
          params: { userId: user.id,type:selectedDownloadType },
        }
      );

      const csvContent = response.data.emails.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${panNumber}.csv`);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("Download started!");
    } catch (error) {
      console.error("Error downloading data:", error);
      alert("Failed to download data.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <button
        onClick={() => setShowPanList(!showPanList)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md"
      >
        {showPanList ? "Hide PAN List" : "Show PAN List"}
      </button>

      <div
        className={`w-full md:w-1/4 bg-white shadow-lg overflow-y-auto p-6 fixed md:relative transform transition-transform duration-300 ease-in-out ${
          showPanList ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ zIndex: 40, height: "100vh", top: 0, left: 0 }}
      >
        <h1 className="text-2xl font-bold mb-6">PAN Entries</h1>
        {loading&&<div className="w-full flex justify-center"><FiLoader className=" animate-spin" /></div>}
        <ul className="space-y-2">
          {panEntries?.panEntries&&<span>Approved entries</span>}
          {panEntries?.panEntries?.map((entry) => (
            <li
              key={entry.panNumber}
              className={`cursor-pointer p-2 rounded-md flex justify-between items-center ${
                selectedPan === entry.panNumber
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => {
                setSelectedPan(entry.panNumber);
                setCurrentPage(1);
                setSelectedType("approved-entries");
                setShowPanList(false);
              }}
            >
              <div>
                <span className="font-semibold">{entry.panNumber}</span>
                <span className="text-sm ml-2">
                  ({entry.emailCount} emails)
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadData(entry.panNumber);
                  setSelectedDownloadType("approved-entries")
                }}
                className="text-red-500 hover:text-red-700"
              >
                <FaDownload />
              </button>
            </li>
          ))}
          {panEntries?.userDetails&&<span className="mt-2">Users</span>}
          {panEntries?.userDetails?.map((entry) => (
            <li
              key={entry.panNumber}
              className={`cursor-pointer p-2 rounded-md flex justify-between items-center ${
                selectedPan === entry.panNumber
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => {
                setSelectedPan(entry.panNumber);
                setCurrentPage(1);
                setSelectedType("users");
                setShowPanList(false);
              }}
            >
              <div>
                <span className="font-semibold">{entry.panNumber}</span>
                <span className="text-sm ml-2">
                  ({entry.emailCount} emails)
                </span>
              </div>
              {/* <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadData(entry.panNumber);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <FaDownload />
              </button> */}
            </li>
          ))}
          {panEntries?.PanEmailDataEntries&&<span className="mt-2">Other</span>}
          {panEntries?.PanEmailDataEntries?.map((entry) => (
            <li
              key={entry.panNumber}
              className={`cursor-pointer p-2 rounded-md flex justify-between items-center ${
                selectedPan === entry.panNumber
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => {
                setSelectedPan(entry.panNumber);
                setCurrentPage(1);
                setSelectedType("other");
                setShowPanList(false);
              }}
            >
              <div>
                <span className="font-semibold">{entry.panNumber}</span>
                <span className="text-sm ml-2">
                  ({entry.emailCount} emails)
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadData(entry.panNumber);
                  setSelectedDownloadType("other")
                }}
                className="text-red-500 hover:text-red-700"
              >
                <FaDownload />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedPan ? (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Emails for PAN: {selectedPan}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {Array.isArray(emails) && emails.length > 0 ? (
                emails?.map((email, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-md shadow-sm"
                  >
                    {email}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-50 rounded-md shadow-sm">
                  {emails}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600">Select a PAN number to view emails.</p>
        )}
      </div>
    </div>
  );
};

export default ShowPanData;
