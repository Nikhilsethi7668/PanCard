import React from 'react';
import { FaUserShield, FaTrash, FaUser, FaIdCard, FaPhone, FaEnvelope } from 'react-icons/fa';

const UserCard = ({ user, onDeleteUser }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-4">
                {/* Header with user name */}
                <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <FaUser className="text-blue-600 text-xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{user.userName}</h2>
                </div>

                {/* User details */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                        <FaEnvelope className="text-gray-400 mr-3" />
                        <p className="text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center">
                        <FaIdCard className="text-gray-400 mr-3" />
                        <p className="text-gray-600">PAN: {user.panNumber}</p>
                    </div>
                    <div className="flex items-center">
                        <FaPhone className="text-gray-400 mr-3" />
                        <p className="text-gray-600">{user.phoneNumber}</p>
                    </div>
                    <div className="flex items-center">
                        <FaUserShield className={`mr-3 ${user.isAdmin ? 'text-green-500' : 'text-gray-400'}`} />
                        <p className={user.isAdmin ? 'text-green-600 font-medium' : 'text-gray-600'}>
                            {user.isAdmin ? 'Admin User' : 'Standard User'}
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => onDeleteUser(user.id)}
                        className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <FaTrash className="mr-2" />
                        Delete User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCard;