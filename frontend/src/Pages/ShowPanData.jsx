import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../Context/UserContext";
import { FaDownload, FaSearch, FaTruckLoading } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import Axios from "../Lib/Axios";

const ShowPanData = () => {
  const [panEntries, setPanEntries] = useState([]);
  const [selectedPan, setSelectedPan] = useState(null);
  const [emails, setEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPanList, setShowPanList] = useState(false);
  const { user } = useContext(UserContext);
  const [loading,setLoading]=useState(false)
  const [emailLoading,setEmailLoading]=useState(false)
  const [currentPagePan, setCurrentPagePan] = useState(1);
 const [searchText,setSearchText]=useState("")
 const [type,setType]=useState("data")
  const fetchPanEntries = async (page = 1, limit = 10) => {
  try {
    setLoading(true);
    setPanEntries({})
    const response = await Axios.get(`/pan-entries/${user.id}`, {
      params: { page, limit,searchText,type },
    });
    setPanEntries(response.data);
  } catch (error) {
    console.error("Error fetching PAN entries:", error);
    alert("Failed to fetch PAN entries.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPanEntries(currentPagePan, 20); 
  }, [currentPagePan,type]);

  const Search =()=>{
    fetchPanEntries(currentPagePan, 20);
  }

  const handleTypeChange = (event) => {
    const selectedType = event.target.value;
    setType(selectedType);
  }

  useEffect(() => {
    if (!selectedPan) return;

    const fetchEmails = async () => {
      setEmailLoading(true)
      try {
        const response = await Axios.get(
          `/data/${selectedPan}`,
          {
            params: {
              page: currentPage,
              limit: 100,
              userId: user.id,
              type: type,
            },
          }
        );

        setEmails(response.data.emails);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching emails:", error);
        alert("Failed to fetch emails.");
      } finally{
        setEmailLoading(false)
      }
    };

    fetchEmails();
  }, [selectedPan, currentPage, user.id]);


  const downloadData = async (panNumber) => {
    try {
      const response = await Axios.get(`/data/${panNumber}/download`, {
        params: { userId: user.id, type: type },
      });
  
      let csvContent = '';
  
      if (Array.isArray(response.data.emails)) {
        csvContent = response.data.emails.join("\n");
      } else if (typeof response.data.emails === 'string') {
        csvContent = response.data.emails.replace(/,/g, "\n");
      } else {
        alert("No emails found for download.");
        return;
      }
  
      // Create a Blob from the CSV content
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
  
      // Create an anchor element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${panNumber || "data"}.csv`);
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-75px)] bg-gray-100">
      <button
        onClick={() => setShowPanList(!showPanList)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md"
      >
        {showPanList ? "Hide PAN List" : "Show PAN List"}
      </button>

      <div
        className={`w-full md:w-1/4 bg-white h-full shadow-lg overflow-y-auto p-6 fixed md:relative transform transition-transform duration-300 ease-in-out ${
          showPanList ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ zIndex: 40, top: 0, left: 0 }}
      >
        <h1 className="text-2xl font-bold mb-6">PAN Entries</h1>
        {/* {user?.isAdmin?<select id="type" value={type} onChange={handleTypeChange}>
        <option value="">-- Select --</option>
        <option value="user">Users</option>
        <option value="data">Approved Entries</option>
        <option value="panemail">Other</option>
      </select>:null} */}
        <div className="flex gap-2">
        <input className="border h-8 w-full"  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      Search();
    }
  }} type="text" value={searchText} onChange={(e)=>setSearchText(e.target.value)} /> <button onClick={Search} className="p-2 bg-slate-200 hover:bg-slate-100 rounded"><FaSearch/></button>
        </div>
        {loading&&<div className="w-full mt-16 flex justify-center"><FiLoader className=" animate-spin" /></div>}
        <ul className="space-y-2 mt-2">
          {panEntries?.items?.length?<span className="font-medium">Results: {panEntries?.totalCount}</span>:<></>}
          {panEntries?.items?.map((entry) => (
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
                setShowPanList(false);
              }}
            >
              <div>
                <span className="font-semibold">{entry.panNumber}</span>
                <span className="text-sm ml-2">
                  ({entry.emailCount} emails)
                </span>
              </div>
              {type!="user"&&<button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadData(entry.panNumber);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <FaDownload />
              </button>}
            </li>
          ))}
        </ul>
        {panEntries?.totalCount ? (
  <div className="mt-4 flex justify-center space-x-2">
    <button
      className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      onClick={() => setCurrentPagePan((prev) => Math.max(prev - 1, 1))}
      disabled={currentPagePan === 1}
    >
      Previous
    </button>
    <span className="px-2 py-1">
      Page {currentPagePan} of {panEntries.totalPages}
    </span>
    <button
      className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      onClick={() => setCurrentPagePan((prev) => prev + 1)}
      disabled={currentPagePan >= panEntries.totalPages}
    >
      Next
    </button>
  </div>
) : null}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedPan ? (
          <>
          {emailLoading?<div className="h-full w-full flex justify-center items-center"><FiLoader className=" animate-spin"/></div>:<div>
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
           </div>}
          </>
        ) : (
          <p className="text-gray-600">Select a PAN number to view emails.</p>
        )}
      </div>
    </div>
  );
};

export default ShowPanData;
