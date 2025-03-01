import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../Context/UserContext';

const UserRequests = () => {
    const { user } = useContext(UserContext);
    const [requests, setRequests] = useState([]);

    // Fetch user's file upload requests
    const fetchUserRequests = async () => {
        try {
            const response = await axios.get(`http://localhost:4000/api/upload/requests/pending/${user._id}`);
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching user requests:', error);
        }
    };

    useEffect(() => {
        fetchUserRequests();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Your File Upload Requests</h1>
            <ul>
                {requests.map((request) => (
                    <li key={request._id} className="mb-4 p-4 border rounded-lg">
                        <p>File: {request.fileName}</p>
                        <p>Status: {request.status}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserRequests;