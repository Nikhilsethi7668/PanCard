import React, { createContext, useState, useEffect, useContext } from "react";
import { checkAuth, login as loginService, logout as logoutService, signup as signupService, checkAuth as checkAuthService } from "../Store.js";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook


export const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyUser = async () => {
            setLoading(true);
            try {
                const response = await checkAuthService();
                console.log("Response from checkAuth:", response);
                if (response?.data?.authenticated) {
                    console.log("Authenticated user:", response.data.user);
                    setUser(response?.data?.user)
                    console.log("user is set to ", user);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Error verifying user:", error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, []);
    useEffect(() => {
        console.log("User state updated:", user);
    }, [user, isAuthenticated]);

    // Login function
    const login = async (credentials) => {
        console.log("credentials", credentials);
        setLoading(true);
        try {
            const response = await loginService(credentials);
            if (response.success) {
                setUser(response.user);
                setIsAuthenticated(true);
                alert("Logged in successfully")
                console.log("User logged in:", user);
                return;
            }




        } catch (error) {
            alert("Error while logging in")
            console.error("Login failed:", error);
            setError("Login failed. Please try again.");
            throw error;
        }
        finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        setLoading(true);
        try {
            await logoutService();
            setUser(null);
            setIsAuthenticated(false);
            alert("Logged out successfully")
            navigate("/"); // Redirect to login after logout
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Failed to logout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Signup function
    const signup = async (userData) => {
        setLoading(true);
        try {
            console.log("userData", userData);
            const response = await signupService(userData);
            setUser(response.data.user);
            // setIsAuthenticated(true);
            alert("Signed up successfully")
        } catch (error) {
            console.error("Signup failed:", error.message);
            setError("Signup failed. Please try again.");
            throw error;
        } finally {
            setLoading(false);
        }
    };
    const checkAuth = async () => {
        const response = await checkAuthService();
        try {
            if (response.success) {
                setIsAuthenticated(true);
                console.log("User logged in:", user);
                return;
            }
        } catch (error) {
            console.error("CheckAuth failed:", error);
            setIsAuthenticated(false);
            return;
        } finally {
            setLoading(false);
        }


    };

    return (
        <UserContext.Provider value={{ user, signup, isAuthenticated, loading, error, login, logout, checkAuth }}>
            {children}
        </UserContext.Provider>
    );
};
export default UserProvider;