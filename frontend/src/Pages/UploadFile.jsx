import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../Context/UserContext';
import Loader from '../Components/Loader';

const UploadFile = () => {
    const [file, setFile] = useState(null);
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // To show the status of the request

    // Handle File Selection
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Handle File Upload Request
    const handleUploadRequest = async () => {
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`https://pancard-backend1.onrender.com/api/upload/request/${user._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setStatus('pending'); // Set status to pending
            alert('File upload request submitted for approval.');
        } catch (error) {
            console.error('Error submitting file request:', error);
            alert('Failed to submit file upload request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
                <h1 className="text-3xl font-extrabold mb-6 text-gray-800 text-center">Upload CSV File</h1>
                <div className="flex flex-col items-center space-y-4">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleUploadRequest}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 relative"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader className="w-6 h-6" /> {/* Ensure Loader has a fixed size */}
                            </div>
                        ) : (
                            'Submit for Approval'
                        )}
                    </button>
                    {status && <p className="text-gray-700">Status: {status}</p>}
                </div>
            </div>
        </div>
    );
};

export default UploadFile;