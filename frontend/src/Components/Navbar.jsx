import React, { useState, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { FaLock, FaUser } from "react-icons/fa";

const Navbar = () => {
    const { isAuthenticated, login, logout, user } = useContext(UserContext);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            logout();
            navigate("/");
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <div className="text-blue-600 items-center gap-2 lg:text-2xl flex font-bold tracking-wide select-none">
                    <Link to="/" className="hover:text-blue-300 flex items-center gap-1 transition">
                      <FaLock/>  SecureData
                    </Link>
                    <div className="border-l border-gray-400 text-black pl-2 font-normal text-base lg:text-xl">Hello, {user.username}</div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-8 font-medium text-blue-600">
                    <Link to="/" className="hover:text-blue-400 transition">
                        PanData
                    </Link>
                    <Link to="/upload" className="hover:text-blue-400 transition">
                        UploadFile
                    </Link>
                    <Link to="/invoice" className="hover:text-blue-400 transition">
                        Invoice
                    </Link>
                    {user.isAdmin && (
                        <>
                            <Link to="/admin-dashboard" className="hover:text-blue-400 transition">
                                Admin Dashboard
                            </Link>
                            <Link to="/users" className="hover:text-blue-400 transition">
                                Handle Users
                            </Link>
                        </>
                    )}
                    <Link to="/user-requests" className="hover:text-blue-400 transition">
                        Your Requests
                    </Link>
                </div>

                {/* Authentication & Profile */}
                <div className="hidden md:flex items-center space-x-4">
                    {isAuthenticated ? (<div className="flex gap-2">
                         <Link to="/profile" className="bg-blue-100 p-3 rounded-full mr-4">
                                                <FaUser className="text-blue-600 text-xl" />
                         </Link>
                        <button
                            onClick={handleLogout}
                            className=" hover:bg-red-500 border flex gap-1 items-center border-red-500 hover:text-white text-red-500 px-5 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                          <FiLogOut/>  Logout
                        </button>
                        </div> ) : (
                        <button
                            onClick={login}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            Login
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-blue-600 text-3xl focus:outline-none focus:ring-2 focus:ring-white rounded"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isOpen && (
                <div className="md:hidden bg-white shadow-inner px-6 py-6 space-y-5 font-medium text-blue-600 select-none">
                    <Link
                        to="/"
                        className="block hover:text-blue-300 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        PanData
                    </Link>
                    <Link
                        to="/upload"
                        className="block hover:text-blue-300 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        UploadFile
                    </Link>
                    <Link
                        to="/invoice"
                        className="block hover:text-blue-300 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        Invoice
                    </Link>
                    {user.isAdmin && (
                        <>
                            <Link
                                to="/admin-dashboard"
                                className="block hover:text-blue-300 transition"
                                onClick={() => setIsOpen(false)}
                            >
                                Admin Dashboard
                            </Link>
                            <Link
                                to="/users"
                                className="block hover:text-blue-300 transition"
                                onClick={() => setIsOpen(false)}
                            >
                                Handle Users
                            </Link>
                        </>
                    )}
                    <Link
                        to="/user-requests"
                        className="block hover:text-blue-300 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        Your Requests
                    </Link>

                    <div className="pt-4 border-t border-blue-500 flex flex-col space-y-3">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsOpen(false);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    Logout
                                </button>
                                <NavLink
                                    to="/profile"
                                    className="text-blue-600 hover:text-blue-300 transition px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Profile
                                </NavLink>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    login();
                                    setIsOpen(false);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
