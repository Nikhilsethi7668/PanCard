import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../Context/UserContext';
import Axios from '../Lib/Axios';

// Status color mapping
const approvalColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    deleted: 'bg-gray-100 text-gray-800',
};

const UserRequests = () => {
    const { user } = useContext(UserContext);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('');

    const fetchUserRequests = async (status) => {
        try {
            const response = await Axios.get(`/upload/requests/${user.id}?approvalStage=${status}`);
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching user requests:', error);
        }
    };
    const handleDeleteData=async (requestId)=>{
        try {
            await Axios.put(`/upload/requests/delete/${requestId}`);
            fetchUserRequests(filter); // Refresh after update
        } catch (error) {
            console.error('Error deleting data:', error);
        }
    }
    useEffect(() => {
        if (user?.id) {
            fetchUserRequests(filter);
        }
    }, [user, filter]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Your File Upload Requests</h1>

            {/* Dropdown to filter requests */}
            <div className="mb-4">
                <label className="mr-2 font-semibold">Filter by Status:</label>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value=""></option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Requests List */}
            <ul>
                {requests.map((request) => (
                    <li key={request.id} className="mb-4 p-4 border rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-lg font-semibold">{request.fileName}</p>
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${approvalColors[request.approvalStage]}`}
                            >
                                {request.approvalStage}
                            </span>
                        </div>
                        <p><strong>Created At:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                        {filter=="approved"&&<p><strong>Number of PANs:</strong> {request.numberOfPans}</p>}
                        {request.approvalStage === 'approved'&& <button
                                    onClick={() => handleDeleteData(request.id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                                >
                                    Delete data
                       </button>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserRequests;
