import { Route, Routes } from 'react-router-dom';
import ShowPanData from './Pages/ShowPanData';
import UploadFile from './Pages/UploadFile';
import SignIn from './Pages/SignIn';
import ProtectedLogin from './Protected/ProtectedLogin';
import Layout from './Pages/Layout';
import SignUp from './Pages/SignUp';
import ProtectedAdmin from './Protected/Admin';
import HandleUsers from './Pages/HandleUsers';
import AdminDashboard from './Pages/AdminDashboard';
import UserRequests from './Pages/UserRequests';
import VerifyOtp from './Pages/VerifyOtp';
import Invoice from './Pages/Invoice';
import Profile from './Pages/Profile';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedLogin>
            <Layout />
          </ProtectedLogin>
        }
      >
        <Route path="upload" element={<UploadFile />} />
        <Route path="" element={<ShowPanData />} />
        <Route path="users" element={
          <ProtectedAdmin>
            <HandleUsers />
          </ProtectedAdmin>
        } />
        <Route path="admin-dashboard" element={
          <ProtectedAdmin>
            <AdminDashboard />
          </ProtectedAdmin>
        } />
        <Route path="invoice" element={
            <Invoice />
        } />
        <Route path="user-requests" element={<UserRequests />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
    </Routes>
  );
}

export default App;