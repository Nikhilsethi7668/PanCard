import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../Context/UserContext';
import { data } from 'react-router-dom';
import { FaDownload } from "react-icons/fa";

const ShowPanData = () => {
    const [panEntries, setPanEntries] = useState([]);
    const [selectedPan, setSelectedPan] = useState(null);
    const [emails, setEmails] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showPanList, setShowPanList] = useState(false);
    const { user } = useContext(UserContext)

    useEffect(() => {
        fetchPanEntries();
    }, []);

    const fetchPanEntries = async () => {
        try {
            const response = await axios.get(`https://pancard-backend1.onrender.com/api/pan-entries/${user._id}`);
            setPanEntries(response.data);
        } catch (error) {
            console.error('Error fetching PAN entries:', error);
            alert('Failed to fetch PAN entries.');
        }
    };

    useEffect(() => {
        if (!selectedPan) return;

        const fetchEmails = async () => {
            try {
                const response = await axios.get(`https://pancard-backend1.onrender.com/api/data/${selectedPan}`, {
                    params: { page: currentPage, limit: 100, userId: user._id },
                },

                );
                setEmails(response.data.emails);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error('Error fetching emails:', error);
                alert('Failed to fetch emails.');
            }
        };

        fetchEmails();
    }, [selectedPan, currentPage]);
    const downloadData = async (panNumber) => {
        try {
            // Fetch all emails for the selected PAN number
            const response = await axios.get(`https://pancard-backend1.onrender.com/api/data/${panNumber}/download`, {
                params: { userId: user._id }, // Pass the user ID for authorization
            });

            // Create a CSV file
            const csvContent = response.data.emails.join("\n"); // Convert emails to CSV format
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);

            // Create a link and trigger the download
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${panNumber}.csv`);
            document.body.appendChild(link);
            link.click();

            // Clean up
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
            {/* Button to toggle PAN list visibility on mobile */}
            <button
                onClick={() => setShowPanList(!showPanList)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md"
            >
                {showPanList ? 'Hide PAN List' : 'Show PAN List'}
            </button>

            {/* PAN Entries List */}
            <div
                className={`w-full md:w-1/4 bg-white shadow-lg overflow-y-auto p-6 fixed md:relative transform transition-transform duration-300 ease-in-out ${showPanList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
                style={{ zIndex: 40, height: '100vh', top: 0, left: 0 }}
            >
                <h1 className="text-2xl font-bold mb-6">PAN Entries</h1>
                <ul className="space-y-2">
                    {panEntries.map((entry) => (
                        <li
                            key={entry.panNumber}
                            className={`cursor-pointer p-2 rounded-md flex justify-between items-center ${selectedPan === entry.panNumber ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            onClick={() => {
                                setSelectedPan(entry.panNumber);
                                setCurrentPage(1);
                                setShowPanList(false); // Hide PAN list on mobile after selection
                            }}
                        >
                            <div>
                                <span className="font-semibold">{entry.panNumber}</span>
                                <span className="text-sm ml-2">({entry.emailCount} emails)</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadData(entry.panNumber)
                                }}
                                className="text-red-500 hover:text-red-700"
                            >
                                <FaDownload />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedPan ? (
                    <>
                        <h2 className="text-2xl font-bold mb-6">Emails for PAN: {selectedPan}</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {emails.map((email, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-md shadow-sm flex justify-between items-center">
                                    <span>{email}</span>

                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                disabled={currentPage >= totalPages}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600">Select a PAN number to view emails.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShowPanData;