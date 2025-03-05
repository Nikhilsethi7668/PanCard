import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);

    // Fetch pending requests
    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get('http://localhost:4000/api/upload/requests/pending');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
    };

    // Approve or reject a request
    const handleApproveReject = async (requestId, status) => {
        try {
            // console.log("requestId", requestId)
            await axios.put(`http://localhost:4000/api/upload/requests/${requestId}`, { status });
            fetchPendingRequests(); // Refresh the list after updating status
        } catch (error) {
            console.error('Error updating request status:', error);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Pending File Upload Requests</h1>
            <ul>
                {requests.map((request) => (
                    <li key={request.id} className="mb-4 p-4 border rounded-lg">
                        <p>File: {request.fileName}</p>
                        <p>User: {request.user.email}</p>
                        <div className="mt-2">
                            <button
                                onClick={() => handleApproveReject(request.id, 'approved')}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg mr-2"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleApproveReject(request.id, 'rejected')}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg"
                            >
                                Reject
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminDashboard;