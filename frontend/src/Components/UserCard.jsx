import React from 'react';

const UserCard = ({ user, onGrantAdminAccess, onDeleteUser }) => {
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">{user.userName}</h2>
            <p className="text-gray-600 mb-2">Email: {user.email}</p>
            <p className="text-gray-600 mb-2">PAN Number: {user.panNumber}</p>
            <p className="text-gray-600 mb-4">
                Admin Access: {user.isAdmin ? 'Yes' : 'No'}
            </p>
            <div className="flex space-x-4">
                {!user.isAdmin && (
                    <button
                        onClick={() => onGrantAdminAccess(user.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Grant Admin Access
                    </button>
                )}
                <button
                    onClick={() => onDeleteUser(user.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Delete User
                </button>
            </div>
        </div>
    );
};

export default UserCard;