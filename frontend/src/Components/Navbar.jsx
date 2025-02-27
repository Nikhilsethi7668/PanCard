import React, { useState, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { FiMenu, FiX, FiUser } from "react-icons/fi"; // Added User Icon
import { MdKeyboardArrowDown } from "react-icons/md"; // Arrow for dropdown

const Navbar = () => {
    const { isAuthenticated, login, logout } = useContext(UserContext);
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false); // Profile dropdown state
    const navigate = useNavigate();

    return (
        <nav className="bg-blue-500 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="text-white text-xl font-bold">
                    <Link to="/">Meeting</Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-6">
                    <Link to="/" className="text-white hover:text-gray-200 transition">BookUserSlots</Link>
                    <Link to="/meeting" className="text-white hover:text-gray-200 transition">CheckUserBooking</Link>
                    <Link to="/company" className="text-white hover:text-gray-200 transition">CompanyData</Link>
                </div>

                {/* Authentication & Profile */}
                <div className="hidden md:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <>
                            {/* Profile Dropdown */}
                            <div className="relative z-10">
                                <button
                                    className="text-white flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded hover:bg-gray-800 transition"
                                    onClick={() => setProfileOpen(!profileOpen)}
                                >
                                    <FiUser className="text-lg" />
                                    <span>Profile</span>
                                    <MdKeyboardArrowDown />
                                </button>

                                {/* Dropdown Menu */}
                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            My Profile
                                        </Link>
                                        <button

                                            className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                                            onClick={() => {
                                                setProfileOpen(false)
                                                navigate("/signup")

                                            }
                                            }
                                        >
                                            Handle Users
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-200"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button onClick={login} className="text-white bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition">
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
                    <Link to="/" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>BookUserSlots</Link>
                    <Link to="/meeting" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>CheckUserBooking</Link>
                    <Link to="/company" className="hover:text-gray-200 transition" onClick={() => setIsOpen(false)}>CompanyData</Link>

                    {isAuthenticated ? (
                        <>
                            <button
                                className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-800 flex items-center justify-between"
                                onClick={() => setProfileOpen(!profileOpen)}
                            >
                                <span>Profile</span>
                                <MdKeyboardArrowDown />
                            </button>

                            {profileOpen && (
                                <div className="bg-gray-800 p-2 rounded space-y-2">
                                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-700 rounded" onClick={() => setIsOpen(false)}>My Profile</Link>
                                    <Link to="/signup" className="block px-4 py-2 hover:bg-gray-700 rounded" onClick={() => setIsOpen(false)}>
                                        Handle Users
                                    </Link>

                                    <button onClick={logout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 rounded">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <button onClick={login} className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition">
                            Login
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;