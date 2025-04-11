import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = () => {
    const { isAuthenticated, login, logout, user } = useContext(UserContext);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // Handle Logout Confirmation
    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            logout();
            navigate("/");
        }
    };

    return (
        <nav className="bg-blue-500 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="text-white text-xl font-bold">
                    <Link to="/">SecureData</Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-6">
                    <Link to="/" className="text-white hover:text-gray-200 transition">PanData</Link>
                    <Link to="/upload" className="text-white hover:text-gray-200 transition">UploadFile</Link>
                    <Link to="/invoice" className="text-white hover:text-gray-200 transition">Invoice</Link>
                    {user.isAdmin && (
                        <>
                            <Link to="/admin-dashboard" className="text-white hover:text-gray-200 transition">Admin Dashboard</Link>
                            <Link to="/users" className="text-white hover:text-gray-200 transition">Handle Users</Link>
                        </>
                    )}
                    <Link to="/user-requests" className="text-white hover:text-gray-200 transition">Your Requests</Link>
                </div>

                {/* Authentication & Profile */}
                <div className="hidden md:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    ) : (
                        <button
                            onClick={login}
                            className="text-white bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition"
                        >
                            Login
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-white text-2xl focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isOpen && (
                <div className="md:hidden flex flex-col bg-blue-600 text-white p-4 space-y-4">
                    <Link to="/" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>PanData</Link>
                    <Link to="/upload" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>UploadFile</Link>
                    {user.isAdmin && (
                        <>
                            <Link to="/admin-dashboard" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
                            <Link to="/users" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>Handle Users</Link>
                        </>
                    )}
                    <Link to="/user-requests" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>Your Requests</Link>

                    {isAuthenticated ? (
                        <div className="right flex">
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsOpen(false);
                                }}
                                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition"
                            >
                                Logout
                            </button>
                            <NavLink
                                to="/profile"
                                className="text-gray-600 hover:text-purple-600"
                            >
                                Profile
                            </NavLink>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                login();
                                setIsOpen(false);
                            }}
                            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition"
                        >
                            Login
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;