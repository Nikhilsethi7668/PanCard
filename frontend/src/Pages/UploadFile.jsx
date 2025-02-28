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

    // Handle File Selection
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Handle File Upload
    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(`http://localhost:4000/api/upload/${user._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            alert('File uploaded successfully!');
            navigate('/'); // Redirect to Show Data page
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file.');
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
                        onClick={handleUpload}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        disabled={loading}
                    >
                        {loading ? <Loader /> : 'Upload File'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadFile;
