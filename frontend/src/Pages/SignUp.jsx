import React, { useContext, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { UserContext } from '../Context/UserContext';

const validationSchema = Yup.object({
    userName: Yup.string()
        .required('User name is required')
        .min(2, 'User name must be at least 2 characters')
        .max(50, 'User name cannot be longer than 50 characters'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters')
        .max(20, 'Password cannot be longer than 20 characters'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
    panNumber: Yup.string()
        .required('PAN number is required')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number'), // PAN number format validation
});

const SignUp = () => {
    const { signup } = useContext(UserContext);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submission = async (data) => {
        setIsSubmitting(true);
        const { confirmPassword, ...signupData } = data;
        console.log(signupData);

        try {
            await signup(signupData);
            alert('Registration Successful!');
        } catch (error) {
            alert(error.response.data.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-300 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Sign Up</h2>
                <Formik
                    initialValues={{ userName: '', email: '', password: '', confirmPassword: '', panNumber: '', isAdmin: false }}
                    validationSchema={validationSchema}
                    onSubmit={(values) => submission(values)}
                >
                    {({ errors, touched }) => (
                        <Form className="space-y-4">
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-700">User Name</label>
                                <Field type="text" id="userName" name="userName" placeholder="Enter user name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                {errors.userName && touched.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                <Field type="email" id="email" name="email" placeholder="Enter email Id" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                {errors.email && touched.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <Field type="password" id="password" name="password" placeholder="Enter password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                {errors.password && touched.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <Field type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                {errors.confirmPassword && touched.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                            <div>
                                <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">PAN Number</label>
                                <Field type="text" id="panNumber" name="panNumber" placeholder="Enter PAN number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                {errors.panNumber && touched.panNumber && <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>}
                            </div>


                            <div className="flex justify-end mt-4">
                                <button type="submit" disabled={isSubmitting} className={`px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{isSubmitting ? 'Registering...' : 'Register'}</button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default SignUp;