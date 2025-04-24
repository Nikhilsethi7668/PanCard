import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../Context/UserContext';
import Axios from '../Lib/Axios';
import UserCard from '../Components/UserCard';

const HandleUsers = () => {
    const { user } = useContext(UserContext);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const response = await Axios.get(`/data/get-all-users/${user.id}`);
            setAllUsers(response.data);
        } catch (error) {
            alert(error.message);
            console.log(error.message);
        }
    };

    // const handleAdminAccess = async (userId) => {
    //     console.log(userId);
        
    //     try {
    //         await Axios.post(`/data/grant-admin-access/${userId}`, {
    //             requestingUserId: user.id, // Pass the requesting user's ID
    //         });
    //         fetchAllUsers(); // Refresh the list after granting admin access
    //         alert('Admin access granted successfully!');
    //     } catch (error) {
    //         alert(error.response.data.message);
    //     }
    // };

    const handleDeleteUser = async (userId) => {
        try {
            await Axios.delete(`/data/delete-user/${userId}`, {
                data: { requestingUserId: user.id }, // Pass the requesting user's ID
            });
            fetchAllUsers(); // Refresh the list after deleting the user
            alert('User deleted successfully!');
        } catch (error) {
            alert(error.response.data.message);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">All Users</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allUsers.map((user) => (
                    <UserCard
                        key={user._id}
                        user={user}
                        onDeleteUser={handleDeleteUser}
                    />
                ))}
            </div>
        </div>
    );
};

export default HandleUsers;