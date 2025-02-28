import { useState } from 'react'
import './App.css'
import { Route, Router, Routes } from 'react-router-dom'
// import UploadPage from './Pages/UploadPage'
// import Login from './Pages/SignIn'
import ShowPanData from './Pages/ShowPanData'
import UploadFile from './Pages/UploadFile'
import SignIn from './Pages/SignIn'
import ProtectedLogin from './Protected/ProtectedLogin'
import Layout from './Pages/Layout'
import SignUp from './Pages/SignUp'
import ProtectedAdmin from './Protected/Admin'
import HandleUsers from './Pages/HandleUsers'

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

      </Route >
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />


    </Routes>
  )
}

export default App
