import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../Context/UserContext';
import Loader from '../Components/Loader';
import Axios from '../Lib/Axios';
import { FaDownload, FaCloudUploadAlt, FaFileCsv, FaExclamationTriangle } from 'react-icons/fa';
import * as Papa from 'papaparse';
import { FiLoader } from 'react-icons/fi';

const UploadFile = () => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('No file selected');
    const [error, setError] = useState('');
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handleFileChange = async (e) => {
        setError('');
        const selectedFile = e.target.files[0];
        
        if (!selectedFile) return;
        
        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }
    
        setFileName(selectedFile.name);
        
        // Read and validate the CSV file
        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Check for parsing errors
                if (results.errors.length > 0) {
                    console.log('Parsing errors:', results.errors);
                    setError('Error parsing CSV file. Please check the format.');
                    return;
                }
                
                // Check if we got any data
                if (!results.data || results.data.length === 0) {
                    setError('CSV file is empty or invalid format');
                    return;
                }
                
                // Check headers - normalize by trimming and lowercasing
                const headers = results.meta.fields || [];
                const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
                
                if (!normalizedHeaders.includes('email')) {
                    setError('CSV file must contain an "email" column');
                    setFile(null);
                    setFileName('No file selected');
                    return;
                }
                
                // Additional validation - check first row has email value
                const firstRow = results.data[0];
                if (!firstRow.email && !firstRow.EMAIL && !firstRow.Email) {
                    setError('Email column exists but no email value found in first row');
                    return;
                }
                
                setFile(selectedFile);
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                setError('Error reading CSV file. Please check the file format.');
            }
        });
    };

    const handleUploadRequest = async () => {
        if (!file) {
            setError('Please select a valid CSV file with email column');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await Axios.post(
                `/upload/${user.id}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            setFile(null);
            setFileName('No file selected');
            setStatus('pending');
            alert('File upload request submitted for approval.');
        } catch (error) {
            console.error('Error submitting file request:', error);
            setError('Failed to submit file upload request');
        } finally {
            setLoading(false);
        }
    };

    const DownloadCsvDemo = async () => {
        try {
            setLoading(true);
            const response = await fetch('/demo.csv');
            const blob = await response.blob();

            const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'demo.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            setError('Failed to download demo file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center overflow-y-scroll bg-gray-50 p-8">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FaCloudUploadAlt className="text-blue-600 text-3xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Upload CSV File</h1>
                    <p className="text-gray-500 mt-2">Select a CSV file with email column to upload</p>
                </div>

                <div className="space-y-6">
                    {/* File Upload Area */}
                    <div className={`border-2 border-dashed rounded-lg overflow-y-auto p-6 text-center transition-colors ${
                        error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
                    }`}>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center">
                                <FaFileCsv className={`text-4xl mb-3 ${
                                    error ? 'text-red-400' : 'text-gray-400'
                                }`} />
                                <p className="text-sm mb-1">Drag & drop your file here or click to browse</p>
                                <p className="text-xs text-gray-400">Supported format: .csv only</p>
                                {fileName && (
                                    <p className={`mt-3 text-sm font-medium ${
                                        error ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                        {fileName}
                                    </p>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg">
                            <FaExclamationTriangle className="mr-2" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        onClick={handleUploadRequest}
                        disabled={loading || !file || error}
                        className={`w-full h-10 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-all ${
                            loading || !file || error ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? (
                            <>
                                <FiLoader className="w-5 h-5 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <FaCloudUploadAlt />
                                <span>Submit for Approval</span>
                            </>
                        )}
                    </button>

                    {/* Demo File Section */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between lg:flex-row flex-col  items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">Need a template?</h3>
                                <p className="text-sm text-gray-500">Download our demo CSV file with email column</p>
                            </div>
                            <button
                                onClick={DownloadCsvDemo}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                                disabled={loading}
                            >
                                <FaDownload />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>

                    {status && (
                        <div className="text-center py-2 px-4 bg-blue-50 text-blue-700 rounded-lg">
                            Status: {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadFile;