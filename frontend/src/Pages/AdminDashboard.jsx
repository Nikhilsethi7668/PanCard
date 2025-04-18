import React, { useEffect, useState } from 'react';
import Axios from '../Lib/Axios';
import { FaDownload, FaUser, FaClock, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

const statusConfig = {
    pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <FaClock className="mr-1" />
    },
    approved: {
        color: 'bg-green-100 text-green-800',
        icon: <FaCheck className="mr-1" />
    },
    rejected: {
        color: 'bg-red-100 text-red-800',
        icon: <FaTimes className="mr-1" />
    },
    deleted: {
        color: 'bg-gray-100 text-gray-800',
        icon: <FaTrash className="mr-1" />
    }
};

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchRequests = async (status) => {
        setIsLoading(true);
        try {
            const response = await Axios.get(`/upload/requests?approvalStage=${status}`);
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveReject = async (requestId, status) => {
        try {
            await Axios.put(`/upload/requests/${requestId}`, { status });
            fetchRequests(filter);
        } catch (error) {
            console.error('Error updating request status:', error);
        }
    };

    const handleDeleteData = async (requestId) => {
        if (window.confirm('Are you sure you want to delete this data?')) {
            try {
                await Axios.put(`/upload/requests/delete/${requestId}`);
                fetchRequests(filter);
            } catch (error) {
                console.error('Error deleting data:', error);
            }
        }
    };

    const handleDownloadApprovedData = async (requestId) => {
        try {
            const response = await Axios.get(`/upload/requests/get-csv/${requestId}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = response.headers['content-disposition'];
            let filename = `approved-data-${requestId}.csv`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading CSV:', error);
            alert('Failed to download CSV. Please try again.');
        }
    };

    const handleDownloadData = async (requestId) => {
        try {
            const response = await Axios.get(`/upload/download/${requestId}`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const disposition = response.headers['content-disposition'];
            let filename = 'data.csv';

            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1]
                    .split(';')[0]
                    .replace(/["']/g, '');
                
                if (!filename.toLowerCase().endsWith('.csv')) {
                    filename = filename.split('.')[0] + '.csv';
                }
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Failed to download CSV file');
        }
    };
    
    useEffect(() => {
        fetchRequests(filter);
    }, [filter]);

    return (
        <div className="container mx-auto lg:w-[80%] px-4 py-8">
            <div className="bg-white rounded-xl p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">File Upload Requests</h1>

                {/* Filter Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Requests</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Requests List */}
                {!isLoading && (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No requests found for the selected filter
                            </div>
                        ) : (
                            requests?.slice()?.reverse().map((request) => (
                                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center flex-wrap justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                    {request.fileName}
                                                    {(request.approvalStage === 'pending' || request.approvalStage === 'approved') && (
                                                        <button 
                                                            onClick={() => request.approvalStage === 'pending' 
                                                                ? handleDownloadData(request.id) 
                                                                : handleDownloadApprovedData(request.id)}
                                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                                            title="Download"
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                    )}
                                                </h3>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[request.approvalStage]?.color}`}>
                                                    {statusConfig[request.approvalStage]?.icon}
                                                    {request.approvalStage}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <FaUser className="mr-2 text-gray-400" />
                                                    <span>{request.user.email}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <FaClock className="mr-2 text-gray-400" />
                                                    <span>{new Date(request.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            
                                            {request.approvalStage === 'approved' && (
                                                <div className="mt-2 text-sm">
                                                    <span className="font-medium">Number of Emails:</span> {request.numberOfPans}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row md:flex-col gap-2">
                                            {request.approvalStage === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApproveReject(request.id, 'approved')}
                                                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                    >
                                                        <FaCheck className="mr-2" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveReject(request.id, 'rejected')}
                                                        className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                    >
                                                        <FaTimes className="mr-2" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {request.approvalStage === 'approved' && (
                                                <button
                                                    onClick={() => handleDeleteData(request.id)}
                                                    className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    <FaTrash className="mr-2" />
                                                    Delete Data
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;