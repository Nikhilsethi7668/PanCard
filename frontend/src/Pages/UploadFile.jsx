import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UploadFile = () => {
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

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

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('http://localhost:4000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            alert('File uploaded successfully!');
            navigate('/show-data'); // Redirect to Show Data page
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6">Upload CSV File</h1>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="mb-4"
                />
                <button
                    onClick={handleUpload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Upload File
                </button>
            </div>
        </div>
    );
};

export default UploadFile;
