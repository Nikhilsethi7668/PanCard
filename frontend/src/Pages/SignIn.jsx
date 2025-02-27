import React, { useContext, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";

// Validation Schema
const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
});

const SignIn = () => {
    const { login, loading, user, logout, isAuthenticated } = useContext(UserContext);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (data) => {
        try {
            await login(data);
            navigate("/dashboard"); // Redirect to dashboard after successful login
        } catch (error) {
            console.error("Login error:", error);
            setErrorMessage("Invalid email or password");
        }
    };

    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name || "User"}! 🎉</h2>
                    <p className="text-gray-600">You are already logged in.</p>
                    <button
                        onClick={logout}
                        className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                    >
                        Log out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <h2 className="text-center text-3xl font-bold text-gray-900">Sign in to your account</h2>
                <Formik
                    initialValues={{ email: "", password: "" }}
                    validationSchema={validationSchema}
                    onSubmit={(data) => handleLogin({ ...data, email: data.email.toLowerCase() })}
                >
                    {({ isSubmitting }) => (
                        <Form className="space-y-6">
                            <div>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Field
                                        name="email"
                                        type="email"
                                        className="pl-10 w-full px-3 py-2 border rounded-md"
                                        placeholder="Email address"
                                    />
                                </div>
                                <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            <div>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Field
                                        name="password"
                                        type="password"
                                        className="pl-10 w-full px-3 py-2 border rounded-md"
                                        placeholder="Password"
                                    />
                                </div>
                                <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
                            <button
                                type="submit"
                                disabled={isSubmitting || loading}
                                className={`w-full py-2 px-4 rounded-md text-white ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                            >
                                <FiLogIn className="inline-block mr-2" />
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </Form>
                    )}
                </Formik>
                <p className="text-sm text-center text-gray-600">
                    Don't have an account? <a href="/signup" className="text-indigo-600">Sign up</a>
                </p>
            </div>
        </div>
    );
};

export default SignIn;