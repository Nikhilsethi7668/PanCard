import React, { useContext } from "react";
import { UserContext } from "../Context/UserContext";
import { Navigate } from "react-router-dom";
import Loader from "../Components/Loader";
const ProtectedAdmin = ({ children }) => {
    const { user, isAuthenticated, loading } = useContext(UserContext);

    if (loading) {
        return <Loader />;
    }
    if (!isAuthenticated) {
        alert("Contact Admin to get access");
        return <Navigate to="/login" replace />;
    }
    if (!user.isAdmin) {
        alert("You are not authorized to access this page");
        return <Navigate to="/" replace />;
    }

    // Render the protected content if authenticated
    return children;
};

export default ProtectedAdmin;