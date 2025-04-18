import React, { useContext, useState } from "react";
import { UserContext } from "../Context/UserContext";
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaPhone,
  FaShieldAlt,
} from "react-icons/fa";
import { Dialog, Transition } from "@headlessui/react";
import * as Yup from "yup";
import Axios from "../Lib/Axios";

const Profile = () => {
  const { user,verifyUser } = useContext(UserContext);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const passwordSchema = Yup.object().shape({
    currentPassword: Yup.string().required("Current password is required"),
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password cannot be longer than 64 characters")
      .matches(/[a-z]/, "Must include at least one lowercase letter")
      .matches(/[A-Z]/, "Must include at least one uppercase letter")
      .matches(/[0-9]/, "Must include at least one number")
      .matches(/[^a-zA-Z0-9]/, "Must include at least one special character"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const profileSchema = Yup.object().shape({
    username: Yup.string().required("Username is required"),
    phoneNumber: Yup.string()
      .required("Phone Number is required")
      .matches(
        /^\+[1-9]\d{1,14}$/,
        "Phone number must start with + and should be valid."
      )
      .min(10, "Phone number is too short"),
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await passwordSchema.validate(passwordData, { abortEarly: false });
      setPasswordErrors({});
  
      const res = await Axios.put("/auth/update-password", passwordData);
      console.log("Password changed:", res.data);
      setIsPasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else if (err.inner) {
        const errors = {};
        err.inner.forEach(error => {
          errors[error.path] = error.message;
        });
        setPasswordErrors(errors);
      } else {
        console.error("Password update error:", err);
      }
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await profileSchema.validate(formData, { abortEarly: false });
      setProfileErrors({});
  
      const res = await Axios.put("/auth/update-profile", formData);
      console.log("Profile updated:", res.data);
      setIsEditOpen(false);
      verifyUser()
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else if (err.inner) {
        const errors = {};
        err.inner.forEach(error => {
          errors[error.path] = error.message;
        });
        setProfileErrors(errors);
      } else {
        console.error("Update profile error:", err);
      }
    }
  };
  

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center">
              <div className="bg-white p-2 rounded-full mr-4">
                <FaUser className="text-blue-600 text-3xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.username}</h1>
                <p className="flex items-center">
                  <FaShieldAlt className="mr-1" />
                  {user.isAdmin ? "Admin User" : "Standard User"}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  Personal Information
                </h2>

                <div className="flex items-center">
                  <FaEnvelope className="text-gray-500 mr-3 text-lg" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-800">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaPhone className="text-gray-500 mr-3 text-lg" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-gray-800">{user.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  Account Information
                </h2>

                <div className="flex items-center">
                  <FaIdCard className="text-gray-500 mr-3 text-lg" />
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="text-gray-800">{user.panNumber}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaShieldAlt className="text-gray-500 mr-3 text-lg" />
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="text-gray-800">
                      {user.isAdmin ? "Administrator" : "Standard User"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
              <button onClick={() => setIsPasswordOpen(true)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Transition appear show={isEditOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditOpen(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Edit Profile
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label
                          htmlFor="username"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Username
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border ${
                            profileErrors.username ? 'border-red-500' : ''
                          }`}
                        />
                        {profileErrors.username && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.username}</p>
                        )}
                      </div>
                      <div className="mb-6">
                        <label
                          htmlFor="phoneNumber"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border ${
                            profileErrors.phoneNumber ? 'border-red-500' : ''
                          }`}
                          placeholder="+1234567890"
                        />
                        {profileErrors.phoneNumber && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.phoneNumber}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsEditOpen(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Change Password Modal */}
      <Transition appear show={isPasswordOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsPasswordOpen(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Change Password
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="mb-4">
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border ${
                            passwordErrors.currentPassword ? 'border-red-500' : ''
                          }`}
                        />
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      <div className="mb-4">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700"
                        >
                          New Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={passwordData.password}
                          onChange={handlePasswordChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border ${
                            passwordErrors.password ? 'border-red-500' : ''
                          }`}
                        />
                        {passwordErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{passwordErrors.password}</p>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          Password must contain:
                          <ul className="list-disc pl-5">
                            <li>At least 8 characters</li>
                            <li>At least one uppercase letter</li>
                            <li>At least one lowercase letter</li>
                            <li>At least one number</li>
                            <li>At least one special character</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mb-6">
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border ${
                            passwordErrors.confirmPassword ? 'border-red-500' : ''
                          }`}
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsPasswordOpen(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Change Password
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Profile;