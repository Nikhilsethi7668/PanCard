import React, { useContext } from "react";
import { UserContext } from "../Context/UserContext";
import { Navigate } from "react-router-dom";
import Loader from "../Components/Loader";
const ProtectedLogin = ({ children }) => {
    const { user, isAuthenticated, loading } = useContext(UserContext);

    // Redirect to login if not authenticated
    if (loading) {
        return <Loader />;
    }
    if (!isAuthenticated || !user) {
        alert("Please login to continue");
        return <Navigate to="/login" replace />;
    }

    // Render the protected content if authenticated
    return children;
};

export default ProtectedLogin;