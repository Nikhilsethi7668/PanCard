import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UploadPage = () => {
    const [panEntries, setPanEntries] = useState([]); // List of PAN entries
    const [selectedPan, setSelectedPan] = useState(null); // Selected PAN number
    const [emails, setEmails] = useState([]); // Emails for the selected PAN
    const [currentPage, setCurrentPage] = useState(1); // Current page for emails
    const [totalPages, setTotalPages] = useState(1); // Total pages for emails

    // Fetch all PAN entries
    useEffect(() => {
        const fetchPanEntries = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/pan-entries');
                setPanEntries(response.data);
            } catch (error) {
                console.error('Error fetching PAN entries:', error);
                alert('Failed to fetch PAN entries');
            }
        };

        fetchPanEntries();
    }, []);

    // Fetch emails for the selected PAN number
    useEffect(() => {
        if (!selectedPan) return;

        const fetchEmails = async () => {
            try {
                const response = await axios.get(`http://localhost:4000/api/data/${selectedPan}`, {
                    params: {
                        page: currentPage,
                        limit: 100,
                    },
                });
                setEmails(response.data.emails);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error('Error fetching emails:', error);
                alert('Failed to fetch emails');
            }
        };

        fetchEmails();
    }, [selectedPan, currentPage]);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Sidebar (PAN Entries) */}
            <div className="w-1/4 bg-white shadow-lg overflow-y-auto">
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">PAN Entries</h1>
                    <ul className="space-y-2">
                        {panEntries.map((entry) => (
                            <li
                                key={entry.panNumber}
                                className={`cursor-pointer p-2 rounded-md ${selectedPan === entry.panNumber
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                onClick={() => {
                                    setSelectedPan(entry.panNumber);
                                    setCurrentPage(1); // Reset to the first page when a new PAN is selected
                                }}
                            >
                                <span className="font-semibold">{entry.panNumber}</span>
                                <span className="text-sm ml-2">({entry.emailCount} emails)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Content (Emails) */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedPan ? (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Emails for PAN: {selectedPan}</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {emails.map((email, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-md shadow-sm">
                                    {email}
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
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
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600">Select a PAN number to view emails.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPage;