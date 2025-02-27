import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShowPanData = () => {
    const [panEntries, setPanEntries] = useState([]);
    const [selectedPan, setSelectedPan] = useState(null);
    const [emails, setEmails] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch PAN Entries
    useEffect(() => {
        fetchPanEntries();
    }, []);

    const fetchPanEntries = async () => {
        try {
            const response = await axios.get('http://localhost:4000/api/pan-entries');
            setPanEntries(response.data);
        } catch (error) {
            console.error('Error fetching PAN entries:', error);
            alert('Failed to fetch PAN entries.');
        }
    };

    // Fetch Emails for Selected PAN
    useEffect(() => {
        if (!selectedPan) return;

        const fetchEmails = async () => {
            try {
                const response = await axios.get(`http://localhost:4000/api/data/${selectedPan}`, {
                    params: { page: currentPage, limit: 100 },
                });
                setEmails(response.data.emails);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error('Error fetching emails:', error);
                alert('Failed to fetch emails.');
            }
        };

        fetchEmails();
    }, [selectedPan, currentPage]);

    // Delete PAN Entry
    const deletePanEntry = async (panNumber) => {
        try {
            await axios.delete(`http://localhost:4000/api/pan-entries/${panNumber}`);
            alert('PAN entry deleted successfully.');
            fetchPanEntries(); // Refresh PAN entries
            if (selectedPan === panNumber) {
                setSelectedPan(null); // Clear selected PAN if it was deleted
            }
        } catch (error) {
            console.error('Error deleting PAN entry:', error);
            alert('Failed to delete PAN entry.');
        }
    };

    // Delete Email
    const deleteEmail = async (email) => {
        try {
            await axios.delete(`http://localhost:4000/api/data/${selectedPan}/emails`, {
                data: { email },
            });
            alert('Email deleted successfully.');
            setEmails((prevEmails) => prevEmails.filter((e) => e !== email)); // Remove email from the list
        } catch (error) {
            console.error('Error deleting email:', error);
            alert('Failed to delete email.');
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar - PAN Entries */}
            <div className="w-1/4 bg-white shadow-lg overflow-y-auto p-6">
                <h1 className="text-2xl font-bold mb-6">PAN Entries</h1>
                <ul className="space-y-2">
                    {panEntries.map((entry) => (
                        <li
                            key={entry.panNumber}
                            className={`cursor-pointer p-2 rounded-md flex justify-between items-center ${selectedPan === entry.panNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            onClick={() => {
                                setSelectedPan(entry.panNumber);
                                setCurrentPage(1); // Reset page on new selection
                            }}
                        >
                            <div>
                                <span className="font-semibold">{entry.panNumber}</span>
                                <span className="text-sm ml-2">({entry.emailCount} emails)</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent PAN selection
                                    deletePanEntry(entry.panNumber);
                                }}
                                className="text-red-500 hover:text-red-700"
                            >
                                🗑️
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Content - Emails */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedPan ? (
                    <>
                        <h2 className="text-2xl font-bold mb-6">Emails for PAN: {selectedPan}</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {emails.map((email, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-md shadow-sm flex justify-between items-center">
                                    <span>{email}</span>
                                    <button
                                        onClick={() => deleteEmail(email)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
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