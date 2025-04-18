import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../Context/UserContext';
import Axios from '../Lib/Axios';
import { FaDownload } from 'react-icons/fa';

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
            setRequests([])
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
    
            // Ensure it's handled as CSV
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
    
            // Extract filename from content-disposition header if available
            const disposition = response.headers['content-disposition'];
            let filename = 'downloaded-data.csv'; // Default fallback
    
            if (disposition && disposition.includes('filename=')) {
                filename = disposition
                    .split('filename=')[1]
                    .replace(/["']/g, '');
    
                // Add .csv extension if not present
                if (!filename.endsWith('.csv')) {
                    filename += '.csv';
                }
            }
    
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading CSV file:', error);
        }
    };
    


    useEffect(() => {
        if (user?.id) {
            fetchUserRequests(filter);
        }
    }, [user, filter]);

    return (
        <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Your File Upload Requests</h1>
          
          {/* Filter Dropdown */}
          <div className="w-full sm:w-64">
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
      
        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No requests found for the selected filter</p>
            </div>
          ) : (
            requests?.slice()?.reverse().map((request) => (
              <div 
                key={request.id} 
                className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  {/* Request Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {request.fileName}
                        </h2>
                        {(request.approvalStage === 'pending' || request.approvalStage === 'approved') && (
                          <button 
                            onClick={() => request.approvalStage === 'pending' 
                              ? handleDownloadData(request.id) 
                              : handleDownloadApprovedData(request.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Download"
                          >
                            <FaDownload className="text-lg" />
                          </button>
                        )}
                      </div>
                     
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Created:</span> {new Date(request.createdAt).toLocaleString()}
                      </p>
                      {request.approvalStage === "approved" && (
                        <p>
                          <span className="font-medium">Number of Emails:</span> {request.numberOfPans}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col items-end justify-end gap-2">
                    <div> <span className={`px-3 py-1 rounded-full text-xs font-medium ${approvalColors[request.approvalStage]}`}>
                        {request.approvalStage}
                      </span></div>
                    {request.approvalStage === 'approved' && (
                      <button
                        onClick={() => handleDeleteData(request.id)}
                        className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete Data
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
};

export default UserRequests;
