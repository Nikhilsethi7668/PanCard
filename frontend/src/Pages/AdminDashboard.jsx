import React, { useEffect, useState } from 'react';
import Axios from '../Lib/Axios';
import { FaDownload } from 'react-icons/fa';

const approvalColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    deleted: 'bg-gray-100 text-gray-800',
};

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('');

    const fetchRequests = async (status) => {
        try {
            const response = await Axios.get(`/upload/requests?approvalStage=${status}`);
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleApproveReject = async (requestId, status) => {
        try {
            await Axios.put(`/upload/requests/${requestId}`,{status});
            fetchRequests(filter); // Refresh after update
        } catch (error) {
            console.error('Error updating request status:', error);
        }
    };
    const handleDeleteData=async (requestId)=>{
        try {
            await Axios.put(`/upload/requests/delete/${requestId}`);
            fetchRequests(filter); // Refresh after update
        } catch (error) {
            console.error('Error deleting data:', error);
        }
    }
    const handleDownloadApprovedData = async (requestId) => {
        try {
          // 1. Make the API request with responseType: 'blob'
          const response = await Axios.get(`/upload/requests/get-csv/${requestId}`, {
            responseType: 'blob' // Important for file downloads
          });
      
          // 2. Create a download URL from the blob
          const url = window.URL.createObjectURL(new Blob([response.data]));
      
          // 3. Extract filename from headers or create one
          const contentDisposition = response.headers['content-disposition'];
          let filename = `approved-data-${requestId}.csv`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          }
      
          // 4. Create a temporary anchor element to trigger download
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
      
          // 5. Trigger the download
          link.click();
      
          // 6. Clean up
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);
      
        } catch (error) {
          console.error('Error downloading CSV:', error);
          // Handle errors (show toast, alert, etc.)
          alert('Failed to download CSV. Please try again.');
        }
      };
    const handleDownloadData = async (requestId) => {
        try {
            const response = await Axios.get(`/upload/download/${requestId}`, {
                responseType: 'blob',
            });

            // Create blob with explicit CSV type
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from headers or use default
            const disposition = response.headers['content-disposition'];
            let filename = 'data.csv'; // Default filename

            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1]
                    .split(';')[0]
                    .replace(/["']/g, '');

                // Ensure filename ends with .csv
                if (!filename.toLowerCase().endsWith('.csv')) {
                    filename = filename.split('.')[0] + '.csv';
                }
            }

            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Clean up
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            }, 100);

        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Failed to download CSV file');
        }
    };
    
    useEffect(() => {
        fetchRequests(filter);
    }, [filter]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">File Upload Requests</h1>

            {/* Dropdown for filter */}
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
                           <div className='flex items-center gap-1'> <p className="text-lg font-semibold">{request.fileName}</p> {request.approvalStage === 'pending'?<FaDownload onClick={()=>handleDownloadData(request.id)} className=' cursor-pointer'/>:request.approvalStage === 'approved'?<FaDownload onClick={()=>handleDownloadApprovedData(request.id)} className=' cursor-pointer'/>:null} </div>
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${approvalColors[request.approvalStage]}`}
                            >
                                {request.approvalStage}
                            </span>
                        </div>
                        <p><strong>User:</strong> {request.user.email}</p>
                        <p><strong>Created At:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                        {request.approvalStage === 'approved'&&<p><strong>Number of PANs:</strong> {request.numberOfPans}</p>}

                        {request.approvalStage === 'pending' && (
                            <div className="mt-3">
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
                        )}
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

export default AdminDashboard;
